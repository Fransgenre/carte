import { defineEventHandlerWithAppErrorAsync, ValidationAppError } from '~~/server/lib/errors'
import type { PutAdminTagResponse, PutAdminTagResponseJson } from '~~/shared/responses'
import type { PutAdminTagRequest } from '~~/shared/requests'
import { PutAdminTagResponseJsonCodec } from '~~/shared/responses'
import { PutAdminTagRequestJsonSchema, PutAdminTagRequestJsonCodec } from '~~/shared/requests'
import state from '~~/server/lib/server-state'
import { TagRepository } from '~~/server/repositories'

/**
 * The /api/admin/tags/<id> PUT endpoint, which updates the given tag
 */
export default defineEventHandlerWithAppErrorAsync(async (event): Promise<PutAdminTagResponseJson> => {
  const id = getRouterParam(event, 'id')
  if (id == undefined) throw new ValidationAppError()

  const bodyJson = await readValidatedBody(event, PutAdminTagRequestJsonSchema.parse)
  const body: PutAdminTagRequest = PutAdminTagRequestJsonCodec.decode(bodyJson)

  const repository = new TagRepository(state.db)
  const tag = await repository.update_tag(id, body)

  const response: PutAdminTagResponse = tag
  return PutAdminTagResponseJsonCodec.encode(response)
})
