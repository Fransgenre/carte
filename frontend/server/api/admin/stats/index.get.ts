import { defineEventHandlerWithAppErrorAsync } from '~~/server/lib/errors'
import { StatisticsRepository } from '~~/server/repositories'
import type { GetAdminStatsResponse, GetAdminStatsResponseJson } from '~~/shared/responses'
import { GetAdminStatsResponseJsonCodec } from '~~/shared/responses'
import state from '~~/server/lib/server-state'

/**
 * The /api/admin/stats GET endpoint, which returns the stats on the admin homepage
 */
export default defineEventHandlerWithAppErrorAsync(async (): Promise<GetAdminStatsResponseJson> => {
  const repository = new StatisticsRepository(state.db)
  const stats = await repository.home_page_stats()

  const response: GetAdminStatsResponse = stats
  return GetAdminStatsResponseJsonCodec.encode(response)
})
