import * as z from 'zod'

export const GeneralOptionsSchema = z.object({
  title: z.string(),
  subtitle: z.string(),
  logo_url: z.string().nullish(),
  information: z.string().nullish(),
  redirect_url: z.string().nullish(),
}).meta({
  option_name: 'general',
})

export type GeneralOptions = z.infer<typeof GeneralOptionsSchema>

export const GeneralOptionsWithDefaultsSchema = GeneralOptionsSchema.extend({
  title: GeneralOptionsSchema.shape.subtitle.default('SafeHaven'),
  subtitle: GeneralOptionsSchema.shape.subtitle.default('Carte associative'),
})

export const InitPopupOptionsSchema = z.object({
  popup: z.string().nullish(),
  popup_check_text: z.string().nullish(),
}).meta({
  option_name: 'init_popup',
})

export type InitPopupOptions = z.infer<typeof InitPopupOptionsSchema>

export const InitPopupOptionsWithDefaultsSchema = InitPopupOptionsSchema.extend({
})

export const SafeModeConfigSchema = z.object({
  enabled: z.boolean(),
  hcaptcha_secret: z.string().nullish(),
  hcaptcha_sitekey: z.string().nullish(),
}).meta({
  option_name: 'safe_mode',
})

export type SafeModeConfig = z.infer<typeof SafeModeConfigSchema>

export const SafeModeConfigWithDefaultsSchema = SafeModeConfigSchema.extend({
  enabled: SafeModeConfigSchema.shape.enabled.default(false),
  hcaptcha_secret: SafeModeConfigSchema.shape.hcaptcha_secret.default(''),
  hcaptcha_sitekey: SafeModeConfigSchema.shape.hcaptcha_sitekey.default(''),
})

export const CartographyInitConfigSchema = z.object({
  center_lat: z.float64(),
  center_lng: z.float64(),
  zoom: z.int(),
}).meta({
  option_name: 'cartography_init',
})

export type CartographyInitConfig = z.infer<typeof CartographyInitConfigSchema>

export const CartographyInitConfigWithDefaultsSchema = CartographyInitConfigSchema.extend({
  center_lat: CartographyInitConfigSchema.shape.center_lat.default(47.0),
  center_lng: CartographyInitConfigSchema.shape.center_lng.default(2.0),
  zoom: CartographyInitConfigSchema.shape.zoom.default(5),
})

export const CartographySourceConfigSchema = z.object({
  light_map_url: z.string(),
  dark_map_url: z.string(),
  light_map_attributions: z.string(),
  dark_map_attributions: z.string(),
}).meta({
  option_name: 'cartography_source',
})

export type CartographySourceConfig = z.infer<typeof CartographySourceConfigSchema>

export const CartographySourceConfigWithDefaultsSchema = CartographySourceConfigSchema.extend({
  light_map_url: CartographySourceConfigSchema.shape.light_map_url.default('https://tile.openstreetmap.org/{z}/{x}/{y}.png'),
  light_map_attributions: CartographySourceConfigSchema.shape.light_map_attributions.default('Map data © OpenStreetMap contributors'),
  dark_map_url: CartographySourceConfigSchema.shape.dark_map_url.default('https://tile.openstreetmap.org/{z}/{x}/{y}.png'),
  dark_map_attributions: CartographySourceConfigSchema.shape.dark_map_attributions.default('Map data © OpenStreetMap contributors'),
})

export const CartographyClusterConfigSchema = z.object({
  declustering_speed: z.float64(),
  characteristic_distance: z.float64(),
  minimal_cluster_size: z.int32(),
}).meta({
  option_name: 'cartography_cluster',
})

export type CartographyClusterConfig = z.infer<typeof CartographyClusterConfigSchema>

export const CartographyClusterConfigWithDefaultsSchema = CartographyClusterConfigSchema.extend({
  minimal_cluster_size: CartographyClusterConfigSchema.shape.minimal_cluster_size.default(1.65),
  characteristic_distance: CartographyClusterConfigSchema.shape.characteristic_distance.default(5.0),
  declustering_speed: CartographyClusterConfigSchema.shape.declustering_speed.default(6),
})

export const SafeHavenOptionsSchema = z.object({
  general: GeneralOptionsSchema,
  init_popup: InitPopupOptionsSchema,
  safe_mode: SafeModeConfigSchema,
  cartography_init: CartographyInitConfigSchema,
  cartography_source: CartographySourceConfigSchema,
  cartography_cluster: CartographyClusterConfigSchema,
})

export type SafeHavenOptions = z.infer<typeof SafeHavenOptionsSchema>

export const SafeHavenOptionsWithDefaultsSchema = SafeHavenOptionsSchema.extend({
  general: SafeHavenOptionsSchema.shape.general.default(GeneralOptionsWithDefaultsSchema.parse({})),
  init_popup: SafeHavenOptionsSchema.shape.init_popup.default(InitPopupOptionsWithDefaultsSchema.parse({})),
  safe_mode: SafeHavenOptionsSchema.shape.safe_mode.default(SafeModeConfigWithDefaultsSchema.parse({})),
  cartography_init: SafeHavenOptionsSchema.shape.cartography_init.default(CartographyInitConfigWithDefaultsSchema.parse({})),
  cartography_source: SafeHavenOptionsSchema.shape.cartography_source.default(CartographySourceConfigWithDefaultsSchema.parse({})),
  cartography_cluster: SafeHavenOptionsSchema.shape.cartography_cluster.default(CartographyClusterConfigWithDefaultsSchema.parse({})),
})

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

export type ConfigurationOption = ReturnType<typeof parse_configuration_option>

export const ConfigurationOptionParser = z.custom<ConfigurationOption>(parse_configuration_option)
