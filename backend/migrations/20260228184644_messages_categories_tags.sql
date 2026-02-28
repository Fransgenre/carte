CREATE TYPE admonition_type AS ENUM ('neutral', 'info', 'success', 'fail', 'warning');

ALTER TABLE tags
ADD COLUMN message_text TEXT,
ADD COLUMN message_type admonition_type,
ADD CONSTRAINT tags_constraint_message_type_not_null_if_message_text_not_null CHECK (message_type IS NOT NULL OR message_text IS NULL);

ALTER TABLE categories
ADD COLUMN message_text TEXT,
ADD COLUMN message_type admonition_type,
ADD CONSTRAINT categories_constraint_message_type_not_null_if_message_text_not_null CHECK (message_type IS NOT NULL OR message_text IS NULL);
