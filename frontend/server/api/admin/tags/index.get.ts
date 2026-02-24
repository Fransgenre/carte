import { defineEventHandlerWithAppErrorAsync } from '~~/server/lib/errors'
import type { GetAdminTagsResponse, GetAdminTagsResponseJson } from '~~/shared/responses'
import { GetAdminTagsResponseJsonCodec } from '~~/shared/responses'
import state from '~~/server/lib/server-state'
import { TagRepository } from '~~/server/repositories'

/**
 * The /api/admin/tags GET endpoint, which returns a list of all the tags
 */
export default defineEventHandlerWithAppErrorAsync(async (): Promise<GetAdminTagsResponseJson> => {
  const repository = new TagRepository(state.db)
  const tags = await repository.list_tags()

  const response: GetAdminTagsResponse = tags
  return GetAdminTagsResponseJsonCodec.encode(response)
})
