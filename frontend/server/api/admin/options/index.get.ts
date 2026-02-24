import { defineEventHandlerWithAppError } from '~~/server/lib/errors'
import type { GetAdminOptionsResponse, GetAdminOptionsResponseJson } from '~~/shared/responses'
import { GetAdminOptionsResponseJsonCodec } from '~~/shared/responses'
import state from '~~/server/lib/server-state'

/**
 * The /api/admin/options GET endpoint, which returns the full configuration of the app
 */
export default defineEventHandlerWithAppError((): GetAdminOptionsResponseJson => {
  const options = structuredClone(state.options)

  const response: GetAdminOptionsResponse = options
  return GetAdminOptionsResponseJsonCodec.encode(response)
})
