import state from '~~/server/lib/server-state'
import { defineEventHandlerWithAppError } from '~~/server/lib/errors'
import type { GetStatusResponseJson, GetStatusResponse } from '~~/shared/responses'
import { GetStatusResponseJsonCodec } from '~~/shared/responses'

/**
 * The /api/status GET endpoint, which returns the public configuration of the app
 */
export default defineEventHandlerWithAppError((): GetStatusResponseJson => {
  const options = structuredClone(state.options)

  const response: GetStatusResponse = {
    status: 'ok',
    general: options.general,
    init_popup: options.init_popup,
    cartography_init: options.cartography_init,
    cartography_source: options.cartography_source,
    safe_mode: {
      enabled: options.safe_mode.enabled,
      hcaptcha_sitekey: options.safe_mode.hcaptcha_sitekey,
    },
  }
  return GetStatusResponseJsonCodec.encode(response)
})
