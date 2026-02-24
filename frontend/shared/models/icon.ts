import * as z from 'zod'

export const IconSchema = z.object({
  data: z.instanceof(Buffer),
  http_mime_type: z.string(),
})

export type Icon = z.infer<typeof IconSchema>

export const IconCacheSchema = z.record(
  z.string(),
  IconSchema,
)

export type IconCache = z.infer<typeof IconCacheSchema>
