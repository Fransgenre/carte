import * as z from 'zod'
import QueryStream from 'pg-query-stream'
import { describeParseError } from '../utils.ts'
import type { IDbLike } from '../db.ts'

export const IconSchema = z.object({
  id: z.uuid(),
  data: z.instanceof(Buffer),
  hash: z.string(),
  http_mime_type: z.string(),
})

export type Icon = z.infer<typeof IconSchema>

export async function validateIcons(db: IDbLike) {
  let valid = 0, invalid = 0
  await db.stream(new QueryStream('SELECT * FROM icons'), (s) => {
    s.on('data', (data: unknown) => {
      const parsed = IconSchema.safeParse(data)
      if (parsed.success) {
        valid++
      }
      else {
        console.warn('Invalid icon with data ', data, ' reasons ', describeParseError(parsed.error))
        invalid++
      }
    })
  })
  console.info('Found ', valid, ' valid icons, and ', invalid, ' invalid icons, total ', valid + invalid, ' icons')
}
