import * as z from 'zod'
import { makeCloneCodec } from '../lib/zod-additions'
import { GeneralOptionsSchema, InitPopupOptionsSchema, CartographyInitConfigSchema, CartographySourceConfigSchema, SafeModeConfigSchema } from '../models/'

export const StatusResponseSchema = z.object({
  status: z.string(),
  general: GeneralOptionsSchema,
  init_popup: InitPopupOptionsSchema,
  cartography_init: CartographyInitConfigSchema,
  cartography_source: CartographySourceConfigSchema,
  safe_mode: SafeModeConfigSchema.pick({ enabled: true, hcaptcha_sitekey: true }),
})

export type StatusResponse = z.infer<typeof StatusResponseSchema>

export const StatusResponseJsonSchema = StatusResponseSchema.extend({})

export type StatusResponseJson = z.infer<typeof StatusResponseJsonSchema>

export const StatusResponseJsonCodec = makeCloneCodec(StatusResponseSchema, StatusResponseJsonSchema)
