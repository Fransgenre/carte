import { defineEventHandlerWithAppError, NotFoundAppError } from '../lib/errors'

/**
 * Default API route handler, which will be called for any unhandled API route
 */
export default defineEventHandlerWithAppError((event): never => {
  throw new NotFoundAppError(`API endpoint for ${event.method} ${event.path} not found`)
})
