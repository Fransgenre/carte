import * as z from 'zod'
import QueryStream from 'pg-query-stream'
import { describeParseError, MultiPolygonSchema } from '../utils.ts'
import type { IDbLike } from '../db.ts'

export const PermissionPolicySchema = z.object({
  allow_all: z.boolean(),
  allow_list: z.array(z.uuid()),
  force_exclude: z.array(z.uuid()),
})

export type PermissionPolicy = z.infer<typeof PermissionPolicySchema>

export const PermissionsSchema = z.object({
  families_policy: PermissionPolicySchema,
  categories_policy: PermissionPolicySchema,
  tags_policy: PermissionPolicySchema,
  geographic_restrictions: MultiPolygonSchema.nullish().transform(x => x ?? null),
  can_list_entities: z.boolean(),
  can_list_without_query: z.boolean(),
  can_list_with_filters: z.boolean(),
  can_list_with_enum_constraints: z.boolean(),
  can_access_entity: z.boolean(),
  can_access_comments: z.boolean(),
  can_add_entity: z.boolean(),
  can_add_comment: z.boolean(),
})

export type Permissions = z.infer<typeof PermissionsSchema>

export const AccessTokenSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  token: z.string(),
  permissions: PermissionsSchema,
  last_week_visits: z.int64(),
  active: z.boolean(),
})

export type AccessToken = z.infer<typeof AccessTokenSchema>

export async function validateAccessTokens(db: IDbLike) {
  let valid = 0, invalid = 0
  await db.stream(new QueryStream(`
    SELECT *, (SELECT COUNT(*) FROM access_tokens_visits WHERE token_id = id AND visited_at > NOW() - INTERVAL '1 week') AS last_week_visits
    FROM access_tokens
  `), (s) => {
    s.on('data', (data: unknown) => {
      const parsed = AccessTokenSchema.safeParse(data)
      if (parsed.success) {
        valid++
      }
      else {
        console.log('Invalid accesstoken with data ', data, ' reasons ', describeParseError(parsed.error))
        invalid++
      }
    })
  })
  console.info('Found ', valid, ' valid accesstokens, and ', invalid, ' invalid accesstokens, total ', valid + invalid, ' accesstokens')
}
