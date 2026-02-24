import { defineEventHandlerWithAppErrorAsync, ValidationAppError } from '~~/server/lib/errors'
import state from '~~/server/lib/server-state'
import { TagRepository } from '~~/server/repositories'

/**
 * The /api/admin/tags/<id> DELETE endpoint, which deletes the given tag
 */
export default defineEventHandlerWithAppErrorAsync(async (event) => {
  const id = getRouterParam(event, 'id')
  if (id == undefined) throw new ValidationAppError()

  const repository = new TagRepository(state.db)
  await repository.delete_tag(id)
})
