import * as z from 'zod'
import QueryStream from 'pg-query-stream'
import { describeParseError } from '../utils.ts'
import type { IDbLike } from '../db.ts'

export const FieldTypeSchema = z.enum([
  'SingleLineText',
  'MultiLineText',
  'RichText',
  'Number',
  'Boolean',
  'DiscreteScore',
  'Date',
  'EnumSingleOption',
  'EnumMultiOption',
  'EventList',
])

export type FieldType = z.infer<typeof FieldTypeSchema>

export const FieldSchema = z.object({
  key: z.string(),
  display_name: z.string(),
  help: z.string().nullish().transform(x => x ?? null),
  field_type: FieldTypeSchema,
  field_type_metadata: z.unknown(),
  indexed: z.boolean(),
  privately_indexed: z.boolean(),
  mandatory: z.boolean(),
  user_facing: z.boolean(),
  form_page: z.int(),
  form_weight: z.int(),
  display_weight: z.int(),
  categories: z.array(z.uuid()).nullish().transform(x => x ?? null),
})

export type Field = z.infer<typeof FieldSchema>

export const FormSchema = z.object({
  title: z.string(),
  help: z.string().nullish().transform(x => x ?? null),
  fields: z.array(FieldSchema),
})

export type Form = z.infer<typeof FormSchema>

export const FamilySchema = z.object({
  id: z.uuid(),
  title: z.string(),
  icon_hash: z.string().nullish().transform(x => x ?? null),
  entity_form: FormSchema,
  comment_form: FormSchema,
  sort_order: z.int32(),
  version: z.int32(),
})

export type Family = z.infer<typeof FamilySchema>

export async function validateFamilies(db: IDbLike) {
  let valid = 0, invalid = 0
  await db.stream(new QueryStream(`
    SELECT *, (SELECT hash FROM icons WHERE id = icon_id) AS icon_hash
    FROM families
  `), (s) => {
    s.on('data', (data: unknown) => {
      const parsed = FamilySchema.safeParse(data)
      if (parsed.success) {
        valid++
      }
      else {
        console.warn('Invalid family with data ', data, ' reasons ', describeParseError(parsed.error))
        invalid++
      }
    })
  })
  console.info('Found ', valid, ' valid families, and ', invalid, ' invalid families, total ', valid + invalid, ' families')
}
