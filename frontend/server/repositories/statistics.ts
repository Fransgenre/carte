import * as z from 'zod'
import type { IDbLike } from '../lib/server-state'
import type { CountResult, HomePageStats } from '~~/shared/models'
import { CountResultSchema, HomePageStatsSchema } from '~~/shared/models'

const CommentEntityCountsSchema = z.object({
  category_id: z.string(),
  family_id: z.string(),
  moderated_entities_count: z.int64(),
  unmoderated_entities_count: z.int64(),
  moderated_comments_count: z.int64(),
  unmoderated_comments_count: z.int64(),
})

const HomePageCountsSchema = z.object({
  total_entities: z.int64(),
  total_comments: z.int64(),
  pending_entities: z.int64(),
  pending_comments: z.int64(),
  total_visits_30_days: z.int64(),
  total_visits_7_days: z.int64(),
  visits_30_days: z.record(
    z.string(),
    z.int64().or(z.int32()),
  ),
})

export default class StatisticsRepository {
  db: IDbLike

  constructor(db: IDbLike) {
    this.db = db
  }

  async count_comments_entities(): Promise<CountResult> {
    const rows = await this.db.any<unknown>(`
      SELECT
        c.id AS category_id,
        c.family_id,
        COUNT(DISTINCT e.id) FILTER (WHERE e.moderated) AS moderated_entities_count,
        COUNT(DISTINCT e.id) FILTER (WHERE NOT e.moderated) AS unmoderated_entities_count,
        COUNT(cm.id) FILTER (WHERE cm.moderated) AS moderated_comments_count,
        COUNT(cm.id) FILTER (WHERE NOT cm.moderated) AS unmoderated_comments_count
      FROM public.categories c
      JOIN public.entities e ON c.id = e.category_id
      LEFT JOIN public.comments cm ON e.id = cm.entity_id
      GROUP BY c.id, c.family_id
    `)
    const countItems = rows.map(r => CommentEntityCountsSchema.parse(r))

    const result: CountResult = [{}, {}]
    const countByFamily = result[0], countByCategory = result[1]
    countItems.forEach((countItem) => {
      let family = countByFamily[countItem.family_id]
      if (!family) {
        family = [0, 0, 0, 0]
        countByFamily[countItem.family_id] = family
      }
      family[0] += Number(countItem.moderated_entities_count)
      family[1] += Number(countItem.unmoderated_entities_count)
      family[2] += Number(countItem.moderated_comments_count)
      family[3] += Number(countItem.unmoderated_comments_count)

      let category = countByCategory[countItem.category_id]
      if (!category) {
        category = [0, 0, 0, 0]
        countByCategory[countItem.category_id] = category
      }
      category[0] += Number(countItem.moderated_entities_count)
      category[1] += Number(countItem.unmoderated_entities_count)
      category[2] += Number(countItem.moderated_comments_count)
      category[3] += Number(countItem.unmoderated_comments_count)
    })

    return CountResultSchema.parse(result)
  }

  async home_page_stats(): Promise<HomePageStats> {
    const row = await this.db.one<unknown>(`
      SELECT
        (SELECT COUNT(*) FROM entities WHERE moderated) AS total_entities,
        (SELECT COUNT(*) FROM comments WHERE moderated) AS total_comments,
        (SELECT COUNT(*) FROM entities WHERE NOT moderated) AS pending_entities,
        (SELECT COUNT(*) FROM comments WHERE NOT moderated) AS pending_comments,
        (SELECT COUNT(*) FROM access_tokens_visits WHERE visited_at >= NOW()::date - INTERVAL '30 days') AS total_visits_30_days,
        (SELECT COUNT(*) FROM access_tokens_visits WHERE visited_at >= NOW()::date - INTERVAL '7 days') AS total_visits_7_days,
        (
          WITH date_series AS (
            SELECT generate_series(
              NOW()::date - INTERVAL '30 days',
              NOW()::date,
              INTERVAL '1 day'
            )::date AS visit_date
          ),
          aggregated_visits AS (
            SELECT
              ds.visit_date,
              COALESCE(COUNT(atv.visited_at), 0) AS visit_count
            FROM
              date_series ds
            LEFT JOIN
              access_tokens_visits atv
            ON
              ds.visit_date = DATE(atv.visited_at)
            WHERE
              ds.visit_date >= NOW()::date - INTERVAL '30 days'
            GROUP BY
              ds.visit_date
            ORDER BY
              ds.visit_date
          )
          SELECT json_object_agg(
            TO_CHAR(visit_date, 'YYYY-MM-DD'),
            visit_count
          ) AS visits
          FROM aggregated_visits
        )
        AS visits_30_days
    `)
    const data = HomePageCountsSchema.parse(row)

    const visits_30_days: Record<string, bigint> = {}
    Object.keys(data.visits_30_days).forEach((visit_date) => {
      visits_30_days[visit_date] = BigInt(data.visits_30_days[visit_date]!)
    })

    return HomePageStatsSchema.parse({
      total_entities: Number(data.total_entities),
      total_comments: Number(data.total_comments),
      pending_entities: Number(data.pending_entities),
      pending_comments: Number(data.pending_comments),
      total_visits_30_days: data.total_visits_30_days,
      total_visits_7_days: data.total_visits_7_days,
      visits_30_days: visits_30_days,
    })
  }
}
