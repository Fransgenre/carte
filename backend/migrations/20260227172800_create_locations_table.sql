CREATE TABLE locations (
    id SERIAL,
    latitude FLOAT,
    longitude FLOAT,
    address VARCHAR,
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

-- TODO: update materialized view

ALTER TABLE entities DROP COLUMN IF EXISTS locations;
