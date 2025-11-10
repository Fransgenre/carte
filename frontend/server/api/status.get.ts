import state from '../lib/server-state'
import { defineEventHandlerWithAppError } from '../lib/errors'
import type { StatusResponseJson, StatusResponse } from '../../shared/responses'
import { StatusResponseJsonCodec } from '../../shared/responses'

/**
 * The /api/status GET endpoint, which returns the public configuration of the app
 */
export default defineEventHandlerWithAppError((): StatusResponseJson => {
  const { options } = state
  const response: StatusResponse = {
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
  return StatusResponseJsonCodec.encode(response)
})
