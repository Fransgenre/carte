import * as z from 'zod'
import QueryStream from 'pg-query-stream'
import { describeParseError } from '../utils.ts'
import type { IDbLike } from '../db.ts'

export const UserSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  password: z.string(),
  is_admin: z.boolean(),
  last_login: z.date().nullish().transform(x => x ?? null),
})

export type User = z.infer<typeof UserSchema>

export async function validateUsers(db: IDbLike) {
  let valid = 0, invalid = 0
  await db.stream(new QueryStream('SELECT * FROM users'), (s) => {
    s.on('data', (data: unknown) => {
      const parsed = UserSchema.safeParse(data)
      if (parsed.success) {
        valid++
      }
      else {
        console.log('Invalid user with data ', data, ' reasons ', describeParseError(parsed.error))
        invalid++
      }
    })
  })
  console.info('Found ', valid, ' valid users, and ', invalid, ' invalid users, total ', valid + invalid, ' users')
}
