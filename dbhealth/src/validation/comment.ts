import * as z from 'zod'
import QueryStream from 'pg-query-stream'
import { describeParseError } from '../utils.ts'
import type { IDbLike } from '../db.ts'

export const PublicCommentSchema = z.object({
  id: z.uuid(),
  author: z.string(),
  text: z.string(),
  data: z.looseObject({}),
  created_at: z.date(),
  updated_at: z.date(),
})

export type PublicComment = z.infer<typeof PublicCommentSchema>

export async function validatePublicComments(db: IDbLike) {
  let valid = 0, invalid = 0
  await db.stream(new QueryStream(`SELECT * FROM comments`), (s) => {
    s.on('data', (data: unknown) => {
      const parsed = PublicCommentSchema.safeParse(data)
      if (parsed.success) {
        valid++
      }
      else {
        console.log('Invalid publiccomment with data ', data, ' reasons ', describeParseError(parsed.error))
        invalid++
      }
    })
  })
  console.info('Found ', valid, ' valid publiccomments, and ', invalid, ' invalid publiccomments, total ', valid + invalid, ' publiccomments')
}

export const AdminCommentSchema = PublicCommentSchema.extend({
  entity_id: z.string(),
  moderated: z.boolean(),
  version: z.int32(),
  entity_display_name: z.string(),
  entity_category_id: z.uuid(),
})

export type AdminComment = z.infer<typeof AdminCommentSchema>

export async function validateAdminComments(db: IDbLike) {
  let valid = 0, invalid = 0
  await db.stream(new QueryStream(`
    SELECT c.*, e.display_name AS entity_display_name, e.category_id AS entity_category_id
    FROM comments c
    JOIN entities e ON e.id = c.entity_id
  `), (s) => {
    s.on('data', (data: unknown) => {
      const parsed = AdminCommentSchema.safeParse(data)
      if (parsed.success) {
        valid++
      }
      else {
        console.log('Invalid admincomment with data ', data, ' reasons ', describeParseError(parsed.error))
        invalid++
      }
    })
  })
  console.info('Found ', valid, ' valid admincomments, and ', invalid, ' invalid admincomments, total ', valid + invalid, ' admincomments')
}

export const AdminListedCommentSchema = AdminCommentSchema.pick({
  id: true,
  entity_id: true,
  author: true,
  entity_display_name: true,
  entity_category_id: true,
  created_at: true,
  updated_at: true,
  moderated: true,
})

export type AdminListedComment = z.infer<typeof AdminListedCommentSchema>

export async function validateAdminListedComments(db: IDbLike) {
  let valid = 0, invalid = 0
  await db.stream(new QueryStream(`
    SELECT c.*, e.display_name AS entity_display_name, e.category_id AS entity_category_id
    FROM comments c
    JOIN entities e ON e.id = c.entity_id
  `), (s) => {
    s.on('data', (data: unknown) => {
      const parsed = AdminListedCommentSchema.safeParse(data)
      if (parsed.success) {
        valid++
      }
      else {
        console.log('Invalid adminlistedcomment with data ', data, ' reasons ', describeParseError(parsed.error))
        invalid++
      }
    })
  })
  console.info('Found ', valid, ' valid adminlistedcomments, and ', invalid, ' invalid adminlistedcomments, total ', valid + invalid, ' adminlistedcomments')
}
