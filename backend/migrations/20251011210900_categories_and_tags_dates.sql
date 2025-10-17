-- ajout des colonnes created_at et updated_at sur les catégories
ALTER TABLE categories
  ADD COLUMN created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
;

-- remplacement des champs created_at et updated_at des catégories avec la date de la migration vers safehaven
UPDATE categories SET
  created_at = TO_TIMESTAMP('01/07/2024', 'DD/MM/YYYY'),
  updated_at = TO_TIMESTAMP('01/07/2024', 'DD/MM/YYYY')
;

-- mise à jour automatique du champ updated_at des catégories
CREATE TRIGGER update_categories_updated_at
BEFORE UPDATE ON categories
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ajout des colonnes created_at et updated_at sur les tags
ALTER TABLE tags
  ADD COLUMN created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
;

-- remplacement des champs created_at et updated_at des tags avec la date de la migration vers safehaven
UPDATE tags SET
  created_at = TO_TIMESTAMP('01/07/2024', 'DD/MM/YYYY'),
  updated_at = TO_TIMESTAMP('01/07/2024', 'DD/MM/YYYY')
;

-- mise à jour automatique du champ updated_at des tags
CREATE TRIGGER update_tags_updated_at
BEFORE UPDATE ON tags
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
