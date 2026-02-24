import { defineEventHandlerWithAppErrorAsync } from '../lib/errors'

export default defineEventHandlerWithAppErrorAsync((event) => {
  if (!event.path.startsWith('/api/map/')) return

  // TODO
})
