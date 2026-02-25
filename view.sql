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
            parent_location.value,
            parent_location.ordinality AS location_index
           FROM entities_entities ee
             JOIN entities e ON ee.parent_id = e.id
             LEFT JOIN LATERAL ( SELECT location.value,
                    location.ordinality
                   FROM jsonb_array_elements(e.locations) WITH ORDINALITY location(value, ordinality)) parent_location ON true
          WHERE e.moderated
        ), direct_locations AS (
         SELECT e.id AS entity_id,
            e.category_id,
            e.display_name,
            c.family_id,
            e.hidden,
            location.value AS location,
            location.ordinality AS location_index,
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
             LEFT JOIN LATERAL ( SELECT location_1.value,
                    location_1.ordinality
                   FROM jsonb_array_elements(e.locations) WITH ORDINALITY location_1(value, ordinality)) location ON true
             LEFT JOIN LATERAL ( SELECT jsonb_each.key,
                    jsonb_each.value
                   FROM jsonb_each(e.data) jsonb_each(key, value)
                  WHERE (jsonb_each.key IN ( SELECT jsonb_object_keys(f.indexed_enums) AS jsonb_object_keys
                           FROM families_indexed_fields f
                          WHERE f.family_id = c.family_id))) transformed_fields ON true
          WHERE e.moderated
          GROUP BY e.id, c.family_id, e.display_name, e.category_id, location.value, location.ordinality
        )
 SELECT md5((dl.entity_id::text || COALESCE(dl.location_index, '-1'::integer::bigint)::text) || 'alone_loc'::text)::uuid AS id,
    dl.entity_id,
    dl.category_id,
    dl.display_name,
    dl.family_id,
    dl.location_index,
    (dl.location ->> 'long'::text)::double precision AS longitude,
    (dl.location ->> 'lat'::text)::double precision AS latitude,
    st_transform(st_setsrid(st_makepoint((dl.location ->> 'long'::text)::double precision, (dl.location ->> 'lat'::text)::double precision), 4326), 3857) AS web_mercator_location,
    dl.location ->> 'plain_text'::text AS plain_text_location,
    dl.tags_ids,
    NULL::uuid AS parent_id,
    NULL::text AS parent_display_name,
    dl.hidden,
    to_tsvector((dl.display_name || ' '::text) || COALESCE(dl.indexed_string_values, ''::text)) AS full_text_search_ts,
    dl.enums
   FROM direct_locations dl
UNION
 SELECT md5(((tl.child_id::text || tl.parent_id::text) || COALESCE(tl.location_index, '-1'::integer::bigint)::text) || 'with_parent'::text)::uuid AS id,
    tl.child_id AS entity_id,
    dl.category_id,
    dl.display_name,
    dl.family_id,
    tl.location_index,
    (tl.value ->> 'long'::text)::double precision AS longitude,
    (tl.value ->> 'lat'::text)::double precision AS latitude,
    st_transform(st_setsrid(st_makepoint((tl.value ->> 'long'::text)::double precision, (tl.value ->> 'lat'::text)::double precision), 4326), 3857) AS web_mercator_location,
    tl.value ->> 'plain_text'::text AS plain_text_location,
    dl.tags_ids,
    tl.parent_id,
    tl.parent_display_name,
    dl.hidden,
    to_tsvector((dl.display_name || ' '::text) || COALESCE(dl.indexed_string_values, ''::text)) AS full_text_search_ts,
    dl.enums
   FROM transitive_locations tl
     JOIN direct_locations dl ON tl.child_id = dl.entity_id;
