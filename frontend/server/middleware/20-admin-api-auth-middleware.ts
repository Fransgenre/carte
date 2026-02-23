import { defineEventHandlerWithAppError } from '../lib/errors'

export default defineEventHandlerWithAppError((event) => {
  if (!event.path.startsWith('/api/admin/')) return
  if (event.path.startsWith('/api/admin/session')) {
    if (['POST', 'DELETE'].includes(event.method)) return
  }

  // TODO
})
