import * as z from 'zod'
import { GeneralOptions, InitPopupOptions, CartographyInitConfig, CartographySourceConfig } from '../models/options'
import state from '../lib/server-state'

export const SafeMode = z.object({
  enabled: z.boolean(),
  hcaptcha_sitekey: z.string().nullish(),
})

export type SafeMode = z.infer<typeof SafeMode>

export const StatusResponse = z.object({
  status: z.string(),
  general: GeneralOptions,
  init_popup: InitPopupOptions,
  cartography_init: CartographyInitConfig,
  cartography_source: CartographySourceConfig,
  safe_mode: SafeMode,
})

export type StatusResponse = z.infer<typeof StatusResponse>

/**
 * The /api/status GET endpoint, which returns the public configuration of the app
 */
export default defineEventHandler((): StatusResponse => {
  const { options } = state
  return {
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
})
