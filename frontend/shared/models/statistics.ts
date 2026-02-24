import * as z from 'zod'

export const CountResultSchema = z.tuple([
  z.record(
    z.string(),
    z.tuple([z.uint32(), z.uint32(), z.uint32(), z.uint32()]),
  ),
  z.record(
    z.string(),
    z.tuple([z.uint32(), z.uint32(), z.uint32(), z.uint32()]),
  ),
])

export type CountResult = z.infer<typeof CountResultSchema>

export const HomePageStatsSchema = z.object({
  total_entities: z.uint32(),
  total_comments: z.uint32(),
  pending_entities: z.uint32(),
  pending_comments: z.uint32(),
  total_visits_30_days: z.uint64(),
  total_visits_7_days: z.uint64(),
  visits_30_days: z.record(
    z.string(),
    z.uint64(),
  ),
})

export type HomePageStats = z.infer<typeof HomePageStatsSchema>
