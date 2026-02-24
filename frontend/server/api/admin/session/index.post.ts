import { BadUsernameOrPasswordAppError, defineEventHandlerWithAppErrorAsync } from '~~/server/lib/errors'
import type { PostAdminSessionResponse, PostAdminSessionResponseJson } from '~~/shared/responses'
import type { PostAdminSessionRequest } from '~~/shared/requests'
import { PostAdminSessionResponseJsonCodec } from '~~/shared/responses'
import { set_auth_cookies } from '~~/server/lib/admin-api-auth'
import { PostAdminSessionRequestJsonCodec, PostAdminSessionRequestJsonSchema } from '~~/shared/requests'
import { UserRepository } from '~~/server/repositories'
import state from '~~/server/lib/server-state'

/**
 * The /api/admin/session POST endpoint, which performs user login
 */
export default defineEventHandlerWithAppErrorAsync(async (event): Promise<PostAdminSessionResponseJson> => {
  const bodyJson = await readValidatedBody(event, PostAdminSessionRequestJsonSchema.parse)
  const body: PostAdminSessionRequest = PostAdminSessionRequestJsonCodec.decode(bodyJson)

  const repository = new UserRepository(state.db)
  const auth_user = await repository.authenticate_user(body.username, body.password)
  if (!auth_user) throw new BadUsernameOrPasswordAppError()

  set_auth_cookies(auth_user, body.remember_me, event, state)

  const response: PostAdminSessionResponse = { is_admin: auth_user.is_admin }
  return PostAdminSessionResponseJsonCodec.encode(response)
})
