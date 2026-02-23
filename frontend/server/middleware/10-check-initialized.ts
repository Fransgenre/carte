import { defineEventHandlerWithAppError, InternalServerAppError } from '../lib/errors'
import state from '../lib/server-state'

export default defineEventHandlerWithAppError(() => {
  if (!state.initialized) throw new InternalServerAppError('Server not initialized')
})
