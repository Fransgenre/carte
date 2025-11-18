import * as z from 'zod'
import QueryStream from 'pg-query-stream'
import { describeParseError } from '../utils.ts'
import type { IDbLike } from '../db.ts'

export const ViewerCachedEntitySchema = z.object({
  id: z.string(), // Those aren't real UUIDs, they are generated via md5(...)::uuid in PG
  entity_id: z.uuid(),
  category_id: z.uuid(),
  family_id: z.uuid(),
  display_name: z.string(),
  parent_id: z.uuid().nullish().transform(x => x ?? null),
  parent_display_name: z.string().nullish().transform(x => x ?? null),
  web_mercator_x: z.float64().nullish().transform(x => x ?? null),
  web_mercator_y: z.float64().nullish().transform(x => x ?? null),
  plain_text_location: z.string().nullish().transform(x => x ?? null),
})

export type ViewerCachedEntity = z.infer<typeof ViewerCachedEntitySchema>

export async function validateViewerCachedEntities(db: IDbLike) {
  let valid = 0, invalid = 0
  await db.stream(new QueryStream(`
    SELECT
      ec.*,
      ST_X(ec.web_mercator_location) AS web_mercator_x,
      ST_Y(ec.web_mercator_location) AS web_mercator_y
    FROM entities_caches ec
  `), (s) => {
    s.on('data', (data: unknown) => {
      const parsed = ViewerCachedEntitySchema.safeParse(data)
      if (parsed.success) {
        valid++
      }
      else {
        console.warn('Invalid viewercachedentity with data ', data, ' reasons ', describeParseError(parsed.error))
        invalid++
      }
    })
  })
  console.info('Found ', valid, ' valid viewercachedentities, and ', invalid, ' invalid viewercachedentities, total ', valid + invalid, ' viewercachedentities')
}

export const AdminCachedEntitySchema = z.object({
  ...ViewerCachedEntitySchema.pick({
    id: true,
    entity_id: true,
    category_id: true,
    family_id: true,
    display_name: true,
  }).shape,
  tags_ids: z.array(z.uuid()),
  hidden: z.boolean(),
})

export type AdminCachedEntity = z.infer<typeof AdminCachedEntitySchema>

export async function validateAdminCachedEntities(db: IDbLike) {
  let valid = 0, invalid = 0
  await db.stream(new QueryStream(`SELECT * FROM entities_caches`), (s) => {
    s.on('data', (data: unknown) => {
      const parsed = AdminCachedEntitySchema.safeParse(data)
      if (parsed.success) {
        valid++
      }
      else {
        console.warn('Invalid admincachedentity with data ', data, ' reasons ', describeParseError(parsed.error))
        invalid++
      }
    })
  })
  console.info('Found ', valid, ' valid admincachedentities, and ', invalid, ' invalid admincachedentities, total ', valid + invalid, ' admincachedentities')
}
