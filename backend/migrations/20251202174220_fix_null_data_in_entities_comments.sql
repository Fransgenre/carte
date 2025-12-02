-- Convertir en objet vide JSON la propriété data des entités si elle est égale au null JSON

UPDATE entities
SET data = '{}'::jsonb
WHERE data = 'null'::jsonb;

-- Convertir en objet vide JSON la propriété data des commentaires si elle est égale au null JSON

UPDATE comments
SET data = '{}'::jsonb
WHERE data = 'null'::jsonb;
