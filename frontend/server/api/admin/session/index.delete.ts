import { defineEventHandlerWithAppError } from '~~/server/lib/errors'
import { expire_cookies } from '~~/server/lib/admin-api-auth'
import state from '~~/server/lib/server-state'

/**
 * The /api/admin/session DELETE endpoint, which performs user logout
 */
export default defineEventHandlerWithAppError((event) => {
  expire_cookies(event, state)
})
