import { defineEventHandlerWithAppErrorAsync, ValidationAppError } from '~~/server/lib/errors'
import type { GetAdminTagResponse, GetAdminTagResponseJson } from '~~/shared/responses'
import { GetAdminTagResponseJsonCodec } from '~~/shared/responses'
import state from '~~/server/lib/server-state'
import { TagRepository } from '~~/server/repositories'

/**
 * The /api/admin/tags/<id> GET endpoint, which returns the given tag
 */
export default defineEventHandlerWithAppErrorAsync(async (event): Promise<GetAdminTagResponseJson> => {
  const id = getRouterParam(event, 'id')
  if (id == undefined) throw new ValidationAppError()

  const repository = new TagRepository(state.db)
  const tag = await repository.get_tag(id)

  const response: GetAdminTagResponse = tag
  return GetAdminTagResponseJsonCodec.encode(response)
})
