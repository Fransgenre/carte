import * as z from 'zod'

export const Database = z.object({
  url: z.string(),
  pool_size: z.number(),
  timeout: z.number(),
})

export type Database = z.infer<typeof Database>

export const DatabaseParser = Database.extend({
  url: Database.shape.url.default('postgresql://postgres:postgres@localhost/safehaven'),
  pool_size: Database.shape.pool_size.default(5),
  timeout: Database.shape.timeout.default(3),
})

export const SafeHavenConfig = z.object({
  database: Database,
  token_secret: z.string(),
  secure_cookie: z.boolean(),
})

export type SafeHavenConfig = z.infer<typeof SafeHavenConfig>

export const SafeHavenConfigParser = SafeHavenConfig.extend({
  database: SafeHavenConfig.shape.database.default(DatabaseParser.parse({})),
  token_secret: SafeHavenConfig.shape.token_secret.default('SecretForValidatingAngSigningTokens'),
  secure_cookie: SafeHavenConfig.shape.secure_cookie.default(false),
})
