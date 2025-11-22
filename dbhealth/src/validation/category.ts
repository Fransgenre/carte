import * as z from 'zod'
import QueryStream from 'pg-query-stream'
import { describeParseError } from '../utils.ts'
import type { IDbLike } from '../db.ts'

export const CategorySchema = z.object({
  id: z.uuid(),
  title: z.string(),
  family_id: z.uuid(),
  default_status: z.boolean(),
  icon_hash: z.string().nullish().transform(x => x ?? null),
  fill_color: z.string(),
  border_color: z.string(),
  version: z.int32(),
})

export type Category = z.infer<typeof CategorySchema>

export async function validateCategories(db: IDbLike) {
  let valid = 0, invalid = 0
  await db.stream(new QueryStream(`
    SELECT *, (SELECT hash FROM icons WHERE id = icon_id) AS icon_hash
    FROM categories
  `), (s) => {
    s.on('data', (data: unknown) => {
      const parsed = CategorySchema.safeParse(data)
      if (parsed.success) {
        valid++
      }
      else {
        console.warn('Invalid category with data ', data, ' reasons ', describeParseError(parsed.error))
        invalid++
      }
    })
  })
  console.info('Found ', valid, ' valid categories, and ', invalid, ' invalid categories, total ', valid + invalid, ' categories')
}
