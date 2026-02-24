import { authenticate_request } from '../lib/admin-api-auth'
import { defineEventHandlerWithAppErrorAsync } from '../lib/errors'
import state from '../lib/server-state'

export default defineEventHandlerWithAppErrorAsync(async (event) => {
  if (!event.path.startsWith('/api/admin/')) return
  if (event.path.startsWith('/api/admin/session')) {
    if (['POST', 'DELETE'].includes(event.method)) return
  }

  await authenticate_request(event, state)
})
