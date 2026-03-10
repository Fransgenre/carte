CREATE TABLE locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    latitude FLOAT,
    longitude FLOAT,
    address TEXT,
    entity_id UUID NOT NULL REFERENCES entities(id));

WITH expanded_entities AS (
    SELECT 
        id,
        jsonb_array_elements(locations) AS location
    FROM entities)
INSERT INTO locations(latitude, longitude, address, entity_id)
    (SELECT
        (location -> 'lat')::DOUBLE PRECISION,
        (location -> 'long')::DOUBLE PRECISION,
        location -> 'plain_text',
        id
    FROM expanded_entities);

DROP MATERIALIZED VIEW IF EXISTS entities_caches;

CREATE MATERIALIZED VIEW entities_caches AS
 WITH families_indexed_fields AS (
         SELECT f.id AS family_id,
            ( SELECT jsonb_object_agg(field.value ->> 'key'::text, field.value ->> 'field_type'::text) AS jsonb_object_agg
                   FROM jsonb_array_elements(f.entity_form -> 'fields'::text) field(value)
                  WHERE ((field.value ->> 'indexed'::text)::boolean) IS TRUE AND ((field.value ->> 'field_type'::text) = ANY (ARRAY['EnumSingleOption'::text, 'EnumMultiOption'::text]))) AS indexed_enums,
            ( SELECT jsonb_object_agg(field.value ->> 'key'::text, field.value ->> 'field_type'::text) AS jsonb_object_agg
                   FROM jsonb_array_elements(f.entity_form -> 'fields'::text) field(value)
                  WHERE ((field.value ->> 'indexed'::text)::boolean) IS TRUE AND ((field.value ->> 'field_type'::text) = ANY (ARRAY['SingleLineText'::text, 'MultiLineText'::text, 'RichText'::text]))) AS indexed_strings
           FROM families f
        ), transitive_locations AS (
         SELECT ee.child_id,
            e.id AS parent_id,
            e.display_name AS parent_display_name,
            parent_location.id AS location_id,
            parent_location.longitude,
            parent_location.latitude,
            parent_location.address
           FROM entities_entities ee
             JOIN entities e ON ee.parent_id = e.id
             LEFT JOIN locations parent_location ON e.id = parent_location.entity_id
          WHERE e.moderated
        ), direct_locations AS (
         SELECT e.id AS entity_id,
            e.category_id,
            e.display_name,
            c.family_id,
            e.hidden,
            location.id AS location_id,
            location.longitude,
            location.latitude,
            location.address,
            array_remove(array_agg(DISTINCT et.tag_id), NULL::uuid) AS tags_ids,
            COALESCE(jsonb_object_agg(transformed_fields.key,
                CASE
                    WHEN jsonb_typeof(transformed_fields.value) = 'array'::text THEN transformed_fields.value
                    ELSE
                    CASE
                        WHEN transformed_fields.value IS NULL THEN '[]'::jsonb
                        ELSE jsonb_build_array(transformed_fields.value)
                    END
                END) FILTER (WHERE transformed_fields.key IS NOT NULL), '{}'::jsonb) AS enums,
            ( SELECT string_agg(jsonb_each_text.value, ' '::text) AS string_agg
                   FROM jsonb_each_text(e.data) jsonb_each_text(key, value)
                  WHERE (jsonb_each_text.key IN ( SELECT jsonb_object_keys(f.indexed_strings) AS jsonb_object_keys
                           FROM families_indexed_fields f
                          WHERE f.family_id = c.family_id))) AS indexed_string_values
           FROM entities e
             JOIN categories c ON e.category_id = c.id
             LEFT JOIN entity_tags et ON e.id = et.entity_id
             LEFT JOIN entities_entities ee ON e.id = ee.parent_id
             LEFT JOIN entities e2 ON ee.child_id = e2.id
             LEFT JOIN entity_tags cet ON ee.child_id = cet.entity_id
             LEFT JOIN locations location ON e.id = location.entity_id 
             LEFT JOIN LATERAL ( SELECT jsonb_each.key,
                    jsonb_each.value
                   FROM jsonb_each(e.data) jsonb_each(key, value)
                  WHERE (jsonb_each.key IN ( SELECT jsonb_object_keys(f.indexed_enums) AS jsonb_object_keys
                           FROM families_indexed_fields f
                          WHERE f.family_id = c.family_id))) transformed_fields ON true
          WHERE e.moderated
          GROUP BY e.id, c.family_id, e.display_name, e.category_id, location.id, location.longitude, location.latitude, location.address
        )
 SELECT md5((dl.entity_id::text || COALESCE(dl.location_id, '11111111-1111-1111-1111-111111111111'::uuid)) || 'alone_loc'::text)::uuid AS id,
    dl.entity_id,
    dl.category_id,
    dl.display_name,
    dl.family_id,
    dl.longitude,
    dl.latitude,
    st_transform(st_setsrid(st_makepoint(dl.longitude, dl.latitude), 4326), 3857) AS web_mercator_location,
    dl.address AS plain_text_location,
    dl.tags_ids,
    NULL::uuid AS parent_id,
    NULL::text AS parent_display_name,
    dl.hidden,
    to_tsvector((dl.display_name || ' '::text) || COALESCE(dl.indexed_string_values, ''::text)) AS full_text_search_ts,
    dl.enums
   FROM direct_locations dl
UNION
 SELECT md5(((tl.child_id::text || tl.parent_id::text) || COALESCE(tl.location_id, '11111111-1111-1111-1111-111111111111'::uuid)::text) || 'with_parent'::text)::uuid AS id,
    tl.child_id AS entity_id,
    dl.category_id,
    dl.display_name,
    dl.family_id,
    dl.longitude,
    dl.latitude,
    st_transform(st_setsrid(st_makepoint(dl.longitude, dl.latitude), 4326), 3857) AS web_mercator_location,
    dl.address AS plain_text_location,
    dl.tags_ids,
    tl.parent_id,
    tl.parent_display_name,
    dl.hidden,
    to_tsvector((dl.display_name || ' '::text) || COALESCE(dl.indexed_string_values, ''::text)) AS full_text_search_ts,
    dl.enums
   FROM transitive_locations tl
     JOIN direct_locations dl ON tl.child_id = dl.entity_id;

CREATE UNIQUE INDEX entities_caches_id_idx ON entities_caches(id);

ALTER TABLE entities DROP COLUMN IF EXISTS locations;

DROP FUNCTION search_entities;

CREATE OR REPLACE FUNCTION search_entities(
    search_query TEXT,
    geographic_restriction TEXT,
    input_family_id UUID,

    at_allow_all_categories BOOL,
    at_allow_all_tags BOOL,
    at_allowed_categories_ids  UUID[],
    at_allowed_tags_ids UUID[],
    at_excluded_categories_ids UUID[],
    at_excluded_tags_ids UUID[],

    current_page BIGINT,
    page_size BIGINT,

    user_active_categories_ids UUID[],
    user_required_tags_ids UUID[],
    user_excluded_tags_ids UUID[],

    require_locations BOOL,

    user_enum_constraints JSONB
) RETURNS TABLE (
    id UUID,
    entity_id UUID,
    category_id UUID,
    tags_ids UUID[],
    family_id UUID,
    display_name TEXT,
    parents JSONB,
    locations JSONB,
    total_results BIGINT,
    total_pages BIGINT,
    response_current_page BIGINT
) AS $$
BEGIN
    RETURN QUERY
    WITH included_entities AS (
        SELECT ec.*
        FROM entities_caches ec
        WHERE
            -- Family filter
            ec.family_id = input_family_id
            -- Hidden filter
            AND NOT ec.hidden
            -- Access tokens blacklists
            AND NOT (ec.category_id = ANY(at_excluded_categories_ids))
            AND NOT (ec.tags_ids && at_excluded_tags_ids)
            -- User filters blacklists
            AND NOT (ec.tags_ids && user_excluded_tags_ids)
    ),
    filtered_entities AS (
        SELECT
            ie.*,
            CASE
                WHEN search_query IS NOT NULL AND search_query = '' AND
                    (ie.display_name ILIKE '%' || lower(search_query) || '%')
                THEN 1 ELSE 0
            END AS exact_match_score
        FROM included_entities ie
        WHERE
            (
                search_query IS NULL OR search_query = '' OR (
                    ie.display_name ILIKE '%' || lower(search_query) || '%'
                        OR (full_text_search_ts @@ plainto_tsquery(search_query))
                    )
            )
            AND (
                geographic_restriction IS NULL OR
                ST_Intersects(ie.web_mercator_location, st_geomfromtext(geographic_restriction))
            )
            AND ie.family_id = input_family_id
            AND NOT ie.hidden
            -- Categories
            AND (at_allow_all_categories OR ie.category_id = ANY(at_allowed_categories_ids))
            -- Tags
            AND (at_allow_all_tags OR (ie.tags_ids && at_allowed_tags_ids))
            -- User filters
            AND (ie.category_id = ANY(user_active_categories_ids))
            AND (array_length(user_required_tags_ids, 1) = 0 OR user_required_tags_ids <@ ie.tags_ids)
            -- Enum constraints
            AND (
                user_enum_constraints IS NULL OR
                user_enum_constraints = '{}'::jsonb OR
                (
                    SELECT bool_and(
                        ie.enums->key ?| array(SELECT jsonb_array_elements_text(value))
                    )
                    FROM jsonb_each(user_enum_constraints) AS constraints(key, value)
                    WHERE key IS NOT NULL AND ie.enums ? key
                )
            )
    ),
    aggregated_entities AS (
        SELECT
            fe.entity_id,
            fe.category_id,
            fe.tags_ids,
            fe.family_id,
            fe.display_name,
            COALESCE (
                jsonb_agg(
                    DISTINCT jsonb_build_object(
                        'id', fe.parent_id,
                        'display_name', fe.parent_display_name
                    )
                ) FILTER (
                    WHERE fe.parent_id IS NOT NULL
                        AND fe.parent_id IS NOT NULL
                        AND fe.parent_display_name IS NOT NULL
                ),
                '[]'::jsonb
            ) AS parents,
            COALESCE(
                jsonb_agg(
                    DISTINCT jsonb_build_object(
                        'longitude', fe.longitude,
                        'latitude', fe.latitude,
                        'address', fe.address
                    )
                ),
                '[]'::jsonb
            ) AS locations,
            fe.longitude,
            fe.latitude,
            fe.plain_text_location,
            fe.exact_match_score,
            fe.full_text_search_ts
        FROM filtered_entities fe
        GROUP BY
            fe.entity_id,
            fe.category_id,
            fe.tags_ids,
            fe.family_id,
            fe.display_name,
            fe.exact_match_score,
            fe.full_text_search_ts
    ),
    ranked_entities AS (
        SELECT
            ae.*,
            RANK() OVER (
                ORDER BY
                exact_match_score DESC,
                CASE
                    WHEN search_query IS NOT NULL AND search_query <> '' THEN
                        ts_rank(full_text_search_ts, plainto_tsquery(search_query))
                    ELSE 0
                END DESC
            ) AS rank
        FROM aggregated_entities ae
        WHERE ((NOT require_locations) OR ae.longitude != NULL OR ae.latitude OR ae.plain_text_location)
    ),
    total_count AS (
        SELECT COUNT(*) AS total_results FROM ranked_entities
    ),
    paginated_results AS (
        SELECT
            re.entity_id AS id,
            re.entity_id,
            re.category_id,
            re.tags_ids,
            re.family_id,
            re.display_name,
            re.parents,
            re.longitude,
            re.latitude,
            re.plain_text_location,
            tc.total_results,
            CEIL(tc.total_results / page_size::FLOAT)::BIGINT AS total_pages,
            current_page as response_current_page
        FROM ranked_entities re, total_count tc
        LIMIT page_size
        OFFSET (current_page - 1) * page_size
    )
    SELECT * FROM paginated_results;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION replace_locations_for_entity(
    p_entity_id UUID,
    p_locations JSONB
) RETURNS VOID AS $$
BEGIN
    DELETE FROM locations WHERE entity_id = p_entity_id;
    INSERT INTO locations (
        entity_id,
        latitude,
        longitude,
        address
    )
    SELECT
        p_entity_id,
        location -> 'lat'::DOUBLE PRECISION AS latitude,
        location -> 'long'::DOUBLE PRECISION AS longitude,
        location -> 'plain_text' AS address
    FROM jsonb_array_elements(p_locations) location;
END;
$$ LANGUAGE plpgsql;
