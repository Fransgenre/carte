import { defineEventHandlerWithAppErrorAsync } from '~~/server/lib/errors'
import { StatisticsRepository } from '~~/server/repositories'
import type { GetAdminStatsCountCommentsEntitiesResponse, GetAdminStatsCountCommentsEntitiesResponseJson } from '~~/shared/responses'
import { GetAdminStatsCountCommentsEntitiesResponseJsonCodec } from '~~/shared/responses'
import state from '~~/server/lib/server-state'

/**
 * The /api/admin/stats/count-comments-entities GET endpoint, which returns the counts of entities and comments for categories and families
 */
export default defineEventHandlerWithAppErrorAsync(async (): Promise<GetAdminStatsCountCommentsEntitiesResponseJson> => {
  const repository = new StatisticsRepository(state.db)
  const stats = await repository.count_comments_entities()

  const response: GetAdminStatsCountCommentsEntitiesResponse = stats
  return GetAdminStatsCountCommentsEntitiesResponseJsonCodec.encode(response)
})
