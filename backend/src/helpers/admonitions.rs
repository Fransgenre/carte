use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

#[derive(Deserialize, Serialize, Clone, ToSchema, Debug, sqlx::Type)]
#[serde(rename_all = "lowercase")]
#[sqlx(type_name = "admonition_type", rename_all = "lowercase")]
pub enum AdmonitionType {
    Neutral,
    Info,
    Success,
    Fail,
    Warning,
}

impl AdmonitionType {}
