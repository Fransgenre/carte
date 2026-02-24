import * as z from 'zod'

export const TagSchema = z.object({
  id: z.uuidv4(),
  title: z.string(),
  is_filter: z.boolean(),
  is_primary_filter: z.boolean(),
  default_filter_status: z.boolean(),
  filter_description: z.string().nullable(),
  fill_color: z.string(),
  border_color: z.string(),
  version: z.int32(),
})

export type Tag = z.infer<typeof TagSchema>

export const NewOrUpdateTagSchema = TagSchema.pick({
  title: true,
  is_filter: true,
  is_primary_filter: true,
  filter_description: true,
  default_filter_status: true,
  fill_color: true,
  border_color: true,
}).extend({
  version: TagSchema.shape.version.optional(),
})

export type NewOrUpdateTag = z.infer<typeof NewOrUpdateTagSchema>
