import * as z from 'zod'
import { makeCloneCodec } from '../lib/zod-additions'
import { GeneralOptionsSchema, InitPopupOptionsSchema, CartographyInitConfigSchema, CartographySourceConfigSchema, SafeModeConfigSchema } from '../models/'

export const GetStatusResponseSchema = z.object({
  status: z.string(),
  general: GeneralOptionsSchema,
  init_popup: InitPopupOptionsSchema,
  cartography_init: CartographyInitConfigSchema,
  cartography_source: CartographySourceConfigSchema,
  safe_mode: SafeModeConfigSchema.pick({ enabled: true, hcaptcha_sitekey: true }),
})
export type GetStatusResponse = z.infer<typeof GetStatusResponseSchema>
export const GetStatusResponseJsonSchema = GetStatusResponseSchema
export type GetStatusResponseJson = z.infer<typeof GetStatusResponseJsonSchema>
export const GetStatusResponseJsonCodec = makeCloneCodec(GetStatusResponseSchema, GetStatusResponseJsonSchema)
