use crate::api::AppError;
use crate::helpers::deserializers::empty_string_is_invalid;
use crate::models::family::Family;
use serde::{Deserialize, Serialize};
use serde_json::{to_value, Value};
use sqlx::{types::Json, Acquire, FromRow, PgConnection, Postgres, Transaction};
use utoipa::ToSchema;
use uuid::Uuid;

use super::family::Form;

#[derive(Serialize, Deserialize, ToSchema, Debug)]
pub struct UnprocessedLocation {
    #[serde(deserialize_with = "empty_string_is_invalid")]
    pub plain_text: String,
    pub lat: f64,
    pub long: f64,
}

#[derive(Serialize, Deserialize, ToSchema, Debug)]
pub struct Location {
    pub latitude: Option<f64>,
    pub longitude: Option<f64>,
    pub address: Option<String>,
}

#[derive(Deserialize, Serialize, ToSchema, Debug)]
pub struct PublicNewEntity {
    #[serde(deserialize_with = "empty_string_is_invalid")]
    pub display_name: String,
    pub category_id: Uuid,
    pub locations: Vec<UnprocessedLocation>,
    pub data: Value,
}

#[derive(FromRow, Deserialize, Serialize, ToSchema, Debug)]
pub struct PublicListedEntity {
    pub id: Uuid,
    pub display_name: String,
    pub category_id: Uuid,
    pub created_at: chrono::NaiveDateTime,
    pub tags: Vec<Uuid>,
}
#[derive(FromRow, Deserialize, Serialize, ToSchema, Debug)]
pub struct PublicEntity {
    pub id: Uuid,
    pub display_name: String,
    pub category_id: Uuid,
    pub family_id: Uuid,
    #[schema(value_type = Vec<UnprocessedLocation>)]
    pub locations: Vec<Uuid>,
    pub data: Value,
    pub tags: Vec<Uuid>,
    #[schema(value_type = Form)]
    pub entity_form: Json<Form>,
    #[schema(value_type = Form)]
    pub comment_form: Json<Form>,
    pub created_at: chrono::NaiveDateTime,
    pub updated_at: chrono::NaiveDateTime,
}

impl PublicEntity {
    /// Remove all data that is not user_facing from the data object using the entity_form
    fn cleanup_data(&mut self) {
        let data = self.data.as_object_mut().expect("data is not an object");
        let non_user_facing_fields: Vec<String> = self
            .entity_form
            .fields
            .iter()
            .filter(|field| !field.user_facing)
            .map(|field| field.key.clone()) // Assuming each field has a 'name' attribute
            .collect();

        for field_name in non_user_facing_fields.iter() {
            data.remove(field_name);
        }
    }

    pub async fn new(
        entity: PublicNewEntity,
        conn: &mut PgConnection,
    ) -> Result<PublicEntity, AppError> {
        let family = Family::get_from_category(entity.category_id, conn).await?;
        family
            .entity_form
            .validate_data(&entity.data, entity.category_id)?;

        let mut transaction: Transaction<'_, Postgres> =
            conn.begin().await.map_err(AppError::Database)?;

        let entity_id = sqlx::query_scalar!(
            r#"
            INSERT INTO entities (display_name, category_id, data)
            VALUES ($1, $2, $3)
            RETURNING id
            "#,
            entity.display_name,
            entity.category_id,
            entity.data,
        )
        .fetch_one(&mut *transaction)
        .await
        .map_err(AppError::Database)?;

        let locations = to_value(entity.locations).unwrap();
        sqlx::query!(
            r#"
            SELECT replace_locations_for_entity($1, $2)
            "#,
            entity_id,
            locations,
        )
        .execute(&mut *transaction)
        .await
        .map_err(AppError::Database)?;
        let created_entity = sqlx::query_as!(
            PublicEntity,
            r#"SELECT 
                e.id, 
                e.category_id, 
                e.display_name, 
                e.data,
                COALESCE(
                    (SELECT array_agg(l.id) FROM locations l WHERE l.entity_id = e.id), 
                    array[]::uuid[]
                ) AS "locations!",
                e.created_at,
                e.updated_at,
                array[]::uuid[] AS "tags!", 
                c.family_id,
                f.entity_form AS "entity_form: Json<Form>", 
                f.comment_form AS "comment_form: Json<Form>"
            FROM entities e
            JOIN categories c ON c.id = e.category_id
            JOIN families f ON f.id = c.family_id
            WHERE e.id = $1
            "#,
            entity_id,
        )
        .fetch_one(&mut *transaction)
        .await
        .map_err(AppError::Database)?;

        transaction.commit().await.map_err(AppError::Database)?;

        Ok(created_entity)
    }

    pub async fn get(given_id: Uuid, conn: &mut PgConnection) -> Result<PublicEntity, AppError> {
        let mut public_entity = sqlx::query_as!(
            PublicEntity,
            r#"
            SELECT e.id, c.family_id, e.category_id, e.display_name, e.data, e.created_at, e.updated_at,
                COALESCE(
                    (SELECT array_agg(t.tag_id) FROM entity_tags t WHERE t.entity_id = e.id), 
                    array[]::uuid[]
                ) AS "tags!",
                COALESCE(
                    (SELECT array_agg(l.id) FROM locations l WHERE l.entity_id = e.id), 
                    array[]::uuid[]
                ) AS "locations!",
                f.entity_form AS "entity_form: Json<Form>",
                f.comment_form AS "comment_form: Json<Form>"
            FROM entities e
            INNER JOIN categories c ON e.category_id = c.id
            INNER JOIN families f ON c.family_id = f.id
            WHERE e.id = $1 AND e.moderated AND NOT e.hidden
            "#,
            given_id
        )
        .fetch_one(conn)
        .await
        .map_err(AppError::Database)?;

        public_entity.cleanup_data();
        Ok(public_entity)
    }

    pub async fn get_children(
        given_id: Uuid,
        conn: &mut PgConnection,
    ) -> Result<Vec<PublicListedEntity>, AppError> {
        sqlx::query_as!(
            PublicListedEntity,
            r#"
            SELECT e.id,
            e.display_name,
            e.category_id,
            e.created_at,
                COALESCE(
                    (SELECT array_agg(t.tag_id) FROM entity_tags t WHERE t.entity_id = e.id), 
                    array[]::uuid[]
                ) AS "tags!"
            FROM entities e
            INNER JOIN entities_entities ee ON e.id = ee.child_id
            WHERE ee.parent_id = $1 AND e.moderated AND NOT e.hidden
            "#,
            given_id
        )
        .fetch_all(conn)
        .await
        .map_err(AppError::Database)
    }

    pub async fn get_parents(
        given_id: Uuid,
        conn: &mut PgConnection,
    ) -> Result<Vec<PublicListedEntity>, AppError> {
        sqlx::query_as!(
            PublicListedEntity,
            r#"
            SELECT e.id,
            e.display_name,
            e.category_id,
            e.created_at,
                COALESCE(
                    (SELECT array_agg(t.tag_id) FROM entity_tags t WHERE t.entity_id = e.id), 
                    array[]::uuid[]
                ) AS "tags!"
            FROM entities e
            INNER JOIN entities_entities ee ON e.id = ee.parent_id
            WHERE ee.child_id = $1 AND e.moderated AND NOT e.hidden
            "#,
            given_id
        )
        .fetch_all(conn)
        .await
        .map_err(AppError::Database)
    }
}

#[derive(Deserialize, Serialize, ToSchema, Debug)]
pub struct AdminNewOrUpdateEntity {
    pub display_name: String,
    pub category_id: Uuid,
    #[schema(value_type = Vec<UnprocessedLocation>)]
    pub locations: Json<Vec<UnprocessedLocation>>,
    pub data: Value,
    pub tags: Vec<Uuid>,
    pub hidden: bool,
    pub moderation_notes: Option<String>,
    pub moderated: bool,
    pub version: Option<i32>,
}

#[derive(FromRow, Deserialize, Serialize, ToSchema, Debug)]
pub struct AdminListedEntity {
    pub id: Uuid,
    pub display_name: String,
    pub category_id: Uuid,
    pub tags: Vec<Uuid>,
    pub hidden: bool,
    pub moderated: bool,
    pub created_at: chrono::NaiveDateTime,
    pub updated_at: chrono::NaiveDateTime,
}

#[derive(FromRow, Deserialize, Serialize, ToSchema, Debug)]
pub struct AdminEntity {
    pub id: Uuid,
    pub display_name: String,
    pub category_id: Uuid,
    pub family_id: Uuid,
    #[schema(value_type = Vec<UnprocessedLocation>)]
    pub locations: Vec<Uuid>,
    pub data: Value,
    pub tags: Vec<Uuid>,
    pub hidden: bool,
    pub moderation_notes: Option<String>,
    pub moderated: bool,
    pub version: i32,
    pub created_at: chrono::NaiveDateTime,
    pub updated_at: chrono::NaiveDateTime,
}

impl AdminEntity {
    pub async fn new(
        new_entity: AdminNewOrUpdateEntity,
        conn: &mut PgConnection,
    ) -> Result<AdminEntity, AppError> {
        // Start a database transaction
        let mut tx: Transaction<'_, Postgres> = conn.begin().await.map_err(AppError::Database)?;

        // Validate the new data against the form from the corresponding family
        let family = Family::get_from_category(new_entity.category_id, &mut tx).await?;
        family
            .entity_form
            .validate_data(&new_entity.data, new_entity.category_id)?;

        let entity_id = sqlx::query_scalar!(
            r#"
            INSERT INTO entities (
                display_name,
                category_id,
                data,
                hidden,
                moderation_notes,
                moderated
            )
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id
            "#,
            new_entity.display_name,
            new_entity.category_id,
            new_entity.data,
            new_entity.hidden,
            new_entity.moderation_notes,
            new_entity.moderated,
        )
        .fetch_one(&mut *tx)
        .await
        .map_err(AppError::Database)?;

        // Handle locations
        // Serialize locations to JSON
        let locations = to_value(new_entity.locations).unwrap();
        sqlx::query!(
            r#"
            SELECT replace_locations_for_entity($1, $2)
            "#,
            entity_id,
            locations,
        )
        .execute(&mut *tx)
        .await
        .map_err(AppError::Database)?;

        // Handle the many-to-many relationship for tags
        sqlx::query!(
            r#"
                SELECT replace_tags_for_entity($1, $2)
            "#,
            entity_id,
            &new_entity.tags
        )
        .execute(&mut *tx)
        .await
        .map_err(AppError::Database)?;

        let created_entity = sqlx::query_as!(
            AdminEntity,
            r#"SELECT 
                e.id, 
                e.display_name, 
                e.category_id, 
                COALESCE(
                    (SELECT array_agg(l.id) FROM locations l WHERE l.entity_id = e.id), 
                    array[]::uuid[]
                ) AS "locations!",
                e.data,
                e.hidden,
                e.moderation_notes,
                e.moderated,
                e.created_at,
                e.updated_at,
                e.version,
                c.family_id,
                array[]::uuid[] AS "tags!"
            FROM entities e
            JOIN categories c ON c.id = e.category_id
            WHERE e.id = $1
            "#,
            entity_id,
        )
        .fetch_one(&mut *tx)
        .await
        .map_err(AppError::Database)?;

        // Commit the transaction if all operations succeeded
        tx.commit().await.map_err(AppError::Database)?;

        Ok(created_entity)
    }

    pub async fn update(
        id: Uuid,
        update: AdminNewOrUpdateEntity,
        conn: &mut PgConnection,
    ) -> Result<AdminEntity, AppError> {
        // Check if the version is provided
        if update.version.is_none() {
            return Err(AppError::Validation("Version is required".to_string()));
        }

        // Start a database transaction using the Acquire trait
        let mut tx: Transaction<'_, Postgres> = conn.begin().await.map_err(AppError::Database)?;

        // Validate the new data against the form from the corresponding family
        let family = Family::get_from_category(update.category_id, &mut tx).await?;
        family
            .entity_form
            .validate_data(&update.data, update.category_id)?;

        // Handle locations
        // Serialize locations to JSON
        let locations = to_value(update.locations).unwrap();
        sqlx::query!(
            r#"
            SELECT replace_locations_for_entity($1, $2)
            "#,
            id,
            locations,
        )
        .execute(&mut *tx)
        .await
        .map_err(AppError::Database)?;

        // Handle the many-to-many relationship for tags
        sqlx::query!(
            r#"
            SELECT replace_tags_for_entity($1, $2)
            "#,
            id,
            &update.tags
        )
        .execute(&mut *tx)
        .await
        .map_err(AppError::Database)?;

        sqlx::query!(
            r#"
            UPDATE entities
            SET
                display_name = $2,
                category_id = $3,
                data = $4,
                hidden = $5,
                moderation_notes = $6,
                moderated = $7,
                version = $8
            WHERE id = $1
            "#,
            id,
            update.display_name,
            update.category_id,
            update.data,
            update.hidden,
            update.moderation_notes,
            update.moderated,
            update.version,
        )
        .execute(&mut *tx)
        .await
        .map_err(AppError::Database)?;
        let updated_entity = sqlx::query_as!(
            AdminEntity,
            r#"SELECT 
                e.id,
                e.display_name,
                e.category_id,
                COALESCE(
                    (SELECT array_agg(l.id) FROM locations l WHERE l.entity_id = e.id), 
                    array[]::uuid[]
                ) AS "locations!",
                e.data,
                e.hidden,
                e.moderation_notes,
                e.moderated,
                e.created_at,
                e.updated_at,
                e.version,
                c.family_id,
                COALESCE(array(
                    SELECT tag_id
                    FROM entity_tags
                    WHERE entity_id = e.id
                ), array[]::uuid[]) AS "tags!"
            FROM entities e
            JOIN categories c ON c.id = e.category_id
            "#,
        )
        .fetch_one(&mut *tx)
        .await
        .map_err(AppError::Database)?;

        // Commit the transaction if all operations succeeded
        tx.commit().await.map_err(AppError::Database)?;

        Ok(updated_entity)
    }

    pub async fn delete(id: Uuid, conn: &mut PgConnection) -> Result<(), AppError> {
        sqlx::query!(
            r#"
            DELETE FROM entities
            WHERE id = $1
            "#,
            id
        )
        .execute(conn)
        .await
        .map_err(AppError::Database)?;

        Ok(())
    }

    pub async fn register_parent_child(
        parent_id: Uuid,
        child_id: Uuid,
        conn: &mut PgConnection,
    ) -> Result<(), AppError> {
        sqlx::query!(
            r#"
            INSERT INTO entities_entities (parent_id, child_id)
            VALUES ($1, $2)
            "#,
            parent_id,
            child_id
        )
        .execute(conn)
        .await
        .map_err(AppError::Database)?;

        Ok(())
    }

    pub async fn delete_parent_child(
        parent_id: Uuid,
        child_id: Uuid,
        conn: &mut PgConnection,
    ) -> Result<(), AppError> {
        sqlx::query!(
            r#"
            DELETE FROM entities_entities
            WHERE parent_id = $1 AND child_id = $2
            "#,
            parent_id,
            child_id
        )
        .execute(conn)
        .await
        .map_err(AppError::Database)?;

        Ok(())
    }

    pub async fn get_parents(
        given_id: Uuid,
        conn: &mut PgConnection,
    ) -> Result<Vec<AdminListedEntity>, AppError> {
        sqlx::query_as!(
            AdminListedEntity,
            r#"
            SELECT e.id, e.display_name, e.category_id, e.created_at, e.hidden,
                    e.moderated, e.updated_at,
                    COALESCE(
                        (SELECT array_agg(t.tag_id) FROM entity_tags t WHERE t.entity_id = e.id), 
                        array[]::uuid[]
                    ) AS "tags!"
                FROM entities e
                INNER JOIN entities_entities ee ON e.id = ee.parent_id
                WHERE ee.child_id = $1
                "#,
            given_id
        )
        .fetch_all(conn)
        .await
        .map_err(AppError::Database)
    }

    pub async fn get_children(
        given_id: Uuid,
        conn: &mut PgConnection,
    ) -> Result<Vec<AdminListedEntity>, AppError> {
        sqlx::query_as!(
            AdminListedEntity,
            r#"
            SELECT e.id, e.display_name, e.category_id, e.created_at, e.hidden,
                    e.moderated, e.updated_at,
                    COALESCE(
                        (SELECT array_agg(t.tag_id) FROM entity_tags t WHERE t.entity_id = e.id), 
                        array[]::uuid[]
                    ) AS "tags!"
                FROM entities e
                INNER JOIN entities_entities ee ON e.id = ee.child_id
                WHERE ee.parent_id = $1
                "#,
            given_id
        )
        .fetch_all(conn)
        .await
        .map_err(AppError::Database)
    }

    pub async fn get_locations(
        given_id: Uuid,
        conn: &mut PgConnection,
    ) -> Result<Vec<Location>, AppError> {
        sqlx::query_as!(
            Location,
            r#"
            SELECT latitude, longitude, address
            FROM locations
            WHERE entity_id = $1
            "#,
            given_id,
        )
        .fetch_all(conn)
        .await
        .map_err(AppError::Database)
    }

    pub async fn get(given_id: Uuid, conn: &mut PgConnection) -> Result<AdminEntity, AppError> {
        sqlx::query_as!(
            AdminEntity,
            r#"
            SELECT e.id, c.family_id, e.display_name, e.category_id, 
                COALESCE(
                    (SELECT array_agg(l.id) FROM locations l WHERE l.entity_id = e.id), 
                    array[]::uuid[]
                ) AS "locations!",
                e.data, e.hidden, e.moderation_notes, e.moderated, 
                e.created_at, e.updated_at, e.version,
                COALESCE(
                    (SELECT array_agg(t.tag_id) FROM entity_tags t WHERE t.entity_id = e.id), 
                    array[]::uuid[]
                ) AS "tags!"
            FROM entities e
            INNER JOIN categories c ON e.category_id = c.id
            WHERE e.id = $1
            "#,
            given_id,
        )
        .fetch_one(conn)
        .await
        .map_err(AppError::Database)
    }

    pub async fn pending(conn: &mut PgConnection) -> Result<Vec<AdminListedEntity>, AppError> {
        sqlx::query_as!(
            AdminListedEntity,
            r#"
            SELECT e.id, e.display_name, e.category_id, e.created_at, e.hidden,
                    e.moderated, e.updated_at,
                    COALESCE(
                        (SELECT array_agg(t.tag_id) FROM entity_tags t WHERE t.entity_id = e.id), 
                        array[]::uuid[]
                    ) AS "tags!"
            FROM entities e
            WHERE NOT e.moderated
            ORDER BY created_at
            "#
        )
        .fetch_all(conn)
        .await
        .map_err(AppError::Database)
    }
}
