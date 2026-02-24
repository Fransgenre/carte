import { defineEventHandlerWithAppErrorAsync } from '~~/server/lib/errors'
import type { PostAdminTagResponse, PostAdminTagResponseJson } from '~~/shared/responses'
import type { PostAdminTagRequest } from '~~/shared/requests'
import { PostAdminTagResponseJsonCodec } from '~~/shared/responses'
import { PostAdminTagRequestJsonSchema, PostAdminTagRequestJsonCodec } from '~~/shared/requests'
import state from '~~/server/lib/server-state'
import { TagRepository } from '~~/server/repositories'

/**
 * The /api/admin/tags POST endpoint, which creates a new tag
 */
export default defineEventHandlerWithAppErrorAsync(async (event): Promise<PostAdminTagResponseJson> => {
  const bodyJson = await readValidatedBody(event, PostAdminTagRequestJsonSchema.parse)
  const body: PostAdminTagRequest = PostAdminTagRequestJsonCodec.decode(bodyJson)

  const repository = new TagRepository(state.db)
  const tag = await repository.create_tag(body)

  const response: PostAdminTagResponse = tag
  return PostAdminTagResponseJsonCodec.encode(response)
})
