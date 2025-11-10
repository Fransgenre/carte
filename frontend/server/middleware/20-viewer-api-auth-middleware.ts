import { defineEventHandlerWithAppError } from '../lib/errors'

export default defineEventHandlerWithAppError((event) => {
  if (!event.path.startsWith('/api/map/')) return

  // TODO
})
