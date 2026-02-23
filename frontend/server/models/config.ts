import * as z from 'zod'

export const DatabaseConfigSchema = z.object({
  url: z.string(),
  pool_size: z.number(),
  timeout: z.number(),
})

export type DatabaseConfig = z.infer<typeof DatabaseConfigSchema>

export const DatabaseConfigWithDefaultsSchema = DatabaseConfigSchema.extend({
  url: DatabaseConfigSchema.shape.url.default('postgresql://postgres:postgres@localhost/safehaven'),
  pool_size: DatabaseConfigSchema.shape.pool_size.default(5),
  timeout: DatabaseConfigSchema.shape.timeout.default(3),
})

export const SafeHavenConfigSchema = z.object({
  database: DatabaseConfigSchema,
  token_secret: z.string(),
  secure_cookie: z.boolean(),
})

export type SafeHavenConfig = z.infer<typeof SafeHavenConfigSchema>

export const SafeHavenConfigWithDefaultsSchema = SafeHavenConfigSchema.extend({
  database: SafeHavenConfigSchema.shape.database.default(DatabaseConfigWithDefaultsSchema.parse({})),
  token_secret: SafeHavenConfigSchema.shape.token_secret.default('SecretForValidatingAngSigningTokens'),
  secure_cookie: SafeHavenConfigSchema.shape.secure_cookie.default(false),
})
