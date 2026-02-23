-- Convertir en chaine les valeurs de secteur des entités médicales sauvegardées si elles sont au format nombre

UPDATE entities
SET data = jsonb_set(data, '{sector}', to_jsonb(data->>'sector'))
WHERE jsonb_typeof(data->'sector') = 'number'
AND category_id IN (
  SELECT id
  FROM categories
  WHERE family_id = '7d7672cc-2261-4559-86de-645d6d1f85c0'
);

-- Convertir en chaine les valeurs de délai d'attente des entités médicales sauvegardées si elles sont au format nombre

UPDATE entities
SET data = jsonb_set(data, '{waiting_time_for_first_appointment}', to_jsonb(data->>'waiting_time_for_first_appointment'))
WHERE jsonb_typeof(data->'waiting_time_for_first_appointment') = 'number'
AND category_id IN (
  SELECT id
  FROM categories
  WHERE family_id = '7d7672cc-2261-4559-86de-645d6d1f85c0'
);

-- Convertir en chaine les valeurs de secteur du réglage de famille médical si elles sont au format nombre

UPDATE families
SET entity_form = jsonb_set(entity_form, '{fields}', (
  SELECT jsonb_agg(
    CASE field->'key'
      WHEN to_jsonb('sector'::text) THEN jsonb_set(field, '{field_type_metadata,options}', (
        SELECT jsonb_agg(
          CASE jsonb_typeof(opt->'value')
            WHEN 'number' THEN jsonb_set(opt, '{value}', to_jsonb(opt->>'value'))
            ELSE opt
          END
        )
        FROM jsonb_array_elements(field->'field_type_metadata'->'options') opts(opt)
      ))
      ELSE field
    END
  )
  FROM jsonb_array_elements(entity_form->'fields') fields(field)
))
WHERE entity_form @? '$.fields[*] ? (@.key == "sector").field_type_metadata.options[*] ? (@.value.type() == "number")'
AND id = '7d7672cc-2261-4559-86de-645d6d1f85c0';

-- Convertir en chaine les valeurs de délai d'attente du réglage de famille médical si elles sont au format nombre

UPDATE families
SET entity_form = jsonb_set(entity_form, '{fields}', (
  SELECT jsonb_agg(
    CASE field->'key'
      WHEN to_jsonb('waiting_time_for_first_appointment'::text) THEN jsonb_set(field, '{field_type_metadata,options}', (
        SELECT jsonb_agg(
          CASE jsonb_typeof(opt->'value')
            WHEN 'number' THEN jsonb_set(opt, '{value}', to_jsonb(opt->>'value'))
            ELSE opt
          END
        )
        FROM jsonb_array_elements(field->'field_type_metadata'->'options') opts(opt)
      ))
      ELSE field
    END
  )
  FROM jsonb_array_elements(entity_form->'fields') fields(field)
))
WHERE entity_form @? '$.fields[*] ? (@.key == "waiting_time_for_first_appointment").field_type_metadata.options[*] ? (@.value.type() == "number")'
AND id = '7d7672cc-2261-4559-86de-645d6d1f85c0';
