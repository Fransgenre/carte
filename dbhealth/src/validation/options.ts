import * as z from 'zod'
import QueryStream from 'pg-query-stream'
import { describeParseError } from '../utils.ts'
import type { IDbLike } from '../db.ts'

export const GeneralOptionsSchema = z.object({
  title: z.string().default('SafeHaven'),
  subtitle: z.string().nullish().default('Carte associative'),
  logo_url: z.string().nullish().transform(x => x ?? null),
  information: z.string().nullish().transform(x => x ?? null),
  redirect_url: z.string().nullish().transform(x => x ?? null),
}).meta({
  option_name: 'general',
})

export type GeneralOptions = z.infer<typeof GeneralOptionsSchema>

export const InitPopupOptionsSchema = z.object({
  popup: z.string().nullish().transform(x => x ?? null),
  popup_check_text: z.string().nullish().transform(x => x ?? null),
}).meta({
  option_name: 'init_popup',
})

export type InitPopupOptions = z.infer<typeof InitPopupOptionsSchema>

export const SafeModeConfigSchema = z.object({
  enabled: z.boolean().default(false),
  hcaptcha_secret: z.string().nullish().default(''),
  hcaptcha_sitekey: z.string().nullish().default(''),
}).meta({
  option_name: 'safe_mode',
})

export type SafeModeConfig = z.infer<typeof SafeModeConfigSchema>

export const CartographyInitConfigSchema = z.object({
  center_lat: z.float64().default(47.0),
  center_lng: z.float64().default(2.0),
  zoom: z.int().default(5),
}).meta({
  option_name: 'cartography_init',
})

export type CartographyInitConfig = z.infer<typeof CartographyInitConfigSchema>

export const CartographySourceConfigSchema = z.object({
  light_map_url: z.string().default('https://tile.openstreetmap.org/{z}/{x}/{y}.png'),
  dark_map_url: z.string().default('Map data © OpenStreetMap contributors'),
  light_map_attributions: z.string().default('https://tile.openstreetmap.org/{z}/{x}/{y}.png'),
  dark_map_attributions: z.string().default('Map data © OpenStreetMap contributors'),
}).meta({
  option_name: 'cartography_source',
})

export type CartographySourceConfig = z.infer<typeof CartographySourceConfigSchema>

export const CartographyClusterConfigSchema = z.object({
  declustering_speed: z.float64().default(1.65),
  characteristic_distance: z.float64().default(5.0),
  minimal_cluster_size: z.int32().default(6),
}).meta({
  option_name: 'cartography_cluster',
})

export type CartographyClusterConfig = z.infer<typeof CartographyClusterConfigSchema>

export const SafeHavenOptionsSchema = z.object({
  general: GeneralOptionsSchema,
  init_popup: InitPopupOptionsSchema,
  safe_mode: SafeModeConfigSchema,
  cartography_init: CartographyInitConfigSchema,
  cartography_source: CartographySourceConfigSchema,
  cartography_cluster: CartographyClusterConfigSchema,
})

export type SafeHavenOptions = z.infer<typeof SafeHavenOptionsSchema>

function parse_configuration_option(data: unknown) {
  const parsers = [
    GeneralOptionsSchema,
    InitPopupOptionsSchema,
    SafeModeConfigSchema,
    CartographyInitConfigSchema,
    CartographySourceConfigSchema,
    CartographyClusterConfigSchema,
  ]
  for (const parser of parsers) {
    const parse = parser.safeParse(data)
    if (parse.success) return parse.data
  }
  return false
}

export const OptionSchema = z.object({
  name: z.string(),
  value: z.looseObject({}),
})

export type Option = z.infer<typeof OptionSchema>

export async function validateOptions(db: IDbLike) {
  let valid = 0, invalid = 0
  await db.stream(new QueryStream(`
    SELECT * FROM options
  `), (s) => {
    s.on('data', (data: unknown) => {
      const parsedRow = OptionSchema.safeParse(data)
      if (!parsedRow.success) {
        invalid++
        console.warn('Invalid option with data ', data, ' reasons ', describeParseError(parsedRow.error))
        return
      }

      const parsed = parse_configuration_option(parsedRow.data.value)
      if (parsed) {
        valid++
      }
      else {
        console.warn('Invalid option with data ', data, ' could not parse it with any registered option parsers')
        invalid++
      }
    })
  })
  console.info('Found ', valid, ' valid options, and ', invalid, ' invalid options, total ', valid + invalid, ' options')
}
