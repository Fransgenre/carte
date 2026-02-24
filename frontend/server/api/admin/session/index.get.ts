import { defineEventHandlerWithAppError } from '~~/server/lib/errors'
import type { GetAdminSessionResponse, GetAdminSessionResponseJson } from '~~/shared/responses'
import { GetAdminSessionResponseJsonCodec } from '~~/shared/responses'
import { get_admin_user_identity_from_request } from '~~/server/lib/admin-api-auth'

/**
 * The /api/admin/session GET endpoint, which returns the current session info
 */
export default defineEventHandlerWithAppError((event): GetAdminSessionResponseJson => {
  const identity = get_admin_user_identity_from_request(event)

  const response: GetAdminSessionResponse = identity
  return GetAdminSessionResponseJsonCodec.encode(response)
})
