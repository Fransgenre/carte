-- Usage de `[]` plutôt que `null` pour représenter l’absence d’événement.
update comments
set data = jsonb_set(data, '{list_of_events}', '[]'::jsonb)
where data->'list_of_events' = 'null'::jsonb;

-- Suppression des évènements vides et nulls dans les commentaires.
update comments
-- Mise à jour de la liste des événements de ce commentaire.
set data = jsonb_set(
  data,
  '{list_of_events}',
  (
    -- Reconstruction de la liste des événements de ce commentaire.
    select coalesce( jsonb_agg(event), '[]'::jsonb )
    -- Pour tous les événements non-vides et non-nulls de ce commentaire.
    from jsonb_array_elements(data->'list_of_events') events(event)
    where event != '{}'::jsonb
    and event != 'null'::jsonb
  )
)
-- Pour tous les commentaires qui contiennent des événements.
where jsonb_array_length(data->'list_of_events') > 0;

-- Renommage du champ `comment` que certains événements ont en `details`.
update comments
-- Mise à jour de la liste des événements de ce commentaire.
set data = jsonb_set(
  data,
  '{list_of_events}',
  (
    -- Reconstruction de la liste des événements de ce commentaire.
    select jsonb_agg(
      -- Définition du champ `details` pour cet événement.
      jsonb_set(
        event,
        '{details}',
        -- On retient le premier qui existe entre `comment` et `details`.
        coalesce(event->'comment', event->'details')
      )
      -- Suppression du champ `comment` pour cet événement.
      #- '{comment}'
    )
    -- Pour tous les événements de ce commentaire.
    from jsonb_array_elements(data->'list_of_events') events(event)
  )
)
-- Pour tous les commentaires qui contiennent des événements.
where jsonb_array_length(data->'list_of_events') > 0;
