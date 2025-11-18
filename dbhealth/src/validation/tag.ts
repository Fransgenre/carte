import * as z from 'zod'
import QueryStream from 'pg-query-stream'
import { describeParseError } from '../utils.ts'
import type { IDbLike } from '../db.ts'

export const TagSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  is_filter: z.boolean(),
  is_primary_filter: z.boolean(),
  default_filter_status: z.boolean(),
  filter_description: z.string().nullish().transform(x => x ?? null),
  fill_color: z.string(),
  border_color: z.string().nullish().transform(x => x ?? null),
  version: z.int32(),
})

export type Tag = z.infer<typeof TagSchema>

export async function validateTags(db: IDbLike) {
  let valid = 0, invalid = 0
  await db.stream(new QueryStream('SELECT * FROM tags'), (s) => {
    s.on('data', (data: unknown) => {
      const parsed = TagSchema.safeParse(data)
      if (parsed.success) {
        valid++
      }
      else {
        console.log('Invalid tag with data ', data, ' reasons ', describeParseError(parsed.error))
        invalid++
      }
    })
  })
  console.info('Found ', valid, ' valid tags, and ', invalid, ' invalid tags, total ', valid + invalid, ' tags')
}
