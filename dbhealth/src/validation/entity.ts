import * as z from 'zod'
import QueryStream from 'pg-query-stream'
import { describeParseError } from '../utils.ts'
import type { IDbLike } from '../db.ts'
import { FormSchema } from './family.ts'

export const PublicListedEntitySchema = z.object({
  id: z.uuid(),
  display_name: z.string(),
  category_id: z.uuid(),
  created_at: z.date(),
  tags: z.array(z.uuid()),
})

export type PublicListedEntity = z.infer<typeof PublicListedEntitySchema>

export async function validatePublicListedEntities(db: IDbLike) {
  let valid = 0, invalid = 0
  await db.stream(new QueryStream(`
    SELECT
      e.*,
      COALESCE(
          (SELECT array_agg(t.tag_id) FROM entity_tags t WHERE t.entity_id = e.id), 
            array[]::uuid[]
      ) AS tags
    FROM entities e
  `), (s) => {
    s.on('data', (data: unknown) => {
      const parsed = PublicListedEntitySchema.safeParse(data)
      if (parsed.success) {
        valid++
      }
      else {
        console.warn('Invalid publiclistedentity with data ', data, ' reasons ', describeParseError(parsed.error))
        invalid++
      }
    })
  })
  console.info('Found ', valid, ' valid publiclistedentities, and ', invalid, ' invalid publiclistedentities, total ', valid + invalid, ' publiclistedentities')
}

export const UnprocessedLocationSchema = z.object({
  plain_text: z.string().nonempty(),
  lat: z.float64(),
  long: z.float64(),
})

export type UnprocessedLocation = z.infer<typeof UnprocessedLocationSchema>

export const PublicEntitySchema = PublicListedEntitySchema.extend({
  family_id: z.uuid(),
  locations: z.array(UnprocessedLocationSchema),
  data: z.looseObject({}),
  entity_form: FormSchema,
  comment_form: FormSchema,
  updated_at: z.date(),
})

export type PublicEntity = z.infer<typeof PublicEntitySchema>

export async function validatePublicEntities(db: IDbLike) {
  let valid = 0, invalid = 0
  await db.stream(new QueryStream(`
    SELECT
      e.*,
      c.family_id AS family_id,
      COALESCE(
          (SELECT array_agg(t.tag_id) FROM entity_tags t WHERE t.entity_id = e.id), 
            array[]::uuid[]
      ) AS tags,
      f.entity_form AS entity_form,
      f.comment_form AS comment_form
    FROM entities e
    JOIN categories c ON e.category_id = c.id
    JOIN families f ON c.family_id = f.id
  `), (s) => {
    s.on('data', (data: unknown) => {
      const parsed = PublicEntitySchema.safeParse(data)
      if (parsed.success) {
        valid++
      }
      else {
        console.warn('Invalid publicentity with data ', data, ' reasons ', describeParseError(parsed.error))
        invalid++
      }
    })
  })
  console.info('Found ', valid, ' valid publicentities, and ', invalid, ' invalid publicentities, total ', valid + invalid, ' publicentities')
}

export const AdminListedEntitySchema = PublicListedEntitySchema.extend({
  hidden: z.boolean(),
  moderated: z.boolean(),
  updated_at: z.date(),
})

export type AdminListedEntity = z.infer<typeof AdminListedEntitySchema>

export async function validateAdminListedEntities(db: IDbLike) {
  let valid = 0, invalid = 0
  await db.stream(new QueryStream(`
    SELECT
      e.*,
      COALESCE(
          (SELECT array_agg(t.tag_id) FROM entity_tags t WHERE t.entity_id = e.id), 
            array[]::uuid[]
      ) AS tags
    FROM entities e
  `), (s) => {
    s.on('data', (data: unknown) => {
      const parsed = AdminListedEntitySchema.safeParse(data)
      if (parsed.success) {
        valid++
      }
      else {
        console.warn('Invalid adminlistedentity with data ', data, ' reasons ', describeParseError(parsed.error))
        invalid++
      }
    })
  })
  console.info('Found ', valid, ' valid adminlistedentities, and ', invalid, ' invalid adminlistedentities, total ', valid + invalid, ' adminlistedentities')
}

export const AdminEntitySchema = AdminListedEntitySchema.extend({
  family_id: z.uuid(),
  locations: z.array(UnprocessedLocationSchema),
  data: z.looseObject({}),
  entity_form: FormSchema,
  comment_form: FormSchema,
  hidden: z.boolean(),
  moderation_notes: z.string().nullish().transform(x => x ?? null),
  moderated: z.boolean(),
  version: z.int32(),
  updated_at: z.date(),
})

export type AdminEntity = z.infer<typeof AdminEntitySchema>

export async function validateAdminEntities(db: IDbLike) {
  let valid = 0, invalid = 0
  await db.stream(new QueryStream(`
    SELECT
      e.*,
      c.family_id AS family_id,
      COALESCE(
          (SELECT array_agg(t.tag_id) FROM entity_tags t WHERE t.entity_id = e.id), 
            array[]::uuid[]
      ) AS tags,
      f.entity_form AS entity_form,
      f.comment_form AS comment_form
    FROM entities e
    JOIN categories c ON e.category_id = c.id
    JOIN families f ON c.family_id = f.id
  `), (s) => {
    s.on('data', (data: unknown) => {
      const parsed = AdminEntitySchema.safeParse(data)
      if (parsed.success) {
        valid++
      }
      else {
        console.warn('Invalid adminentity with data ', data, ' reasons ', describeParseError(parsed.error))
        invalid++
      }
    })
  })
  console.info('Found ', valid, ' valid adminentities, and ', invalid, ' invalid adminentities, total ', valid + invalid, ' adminentities')
}
