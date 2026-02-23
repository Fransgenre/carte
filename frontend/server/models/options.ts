import * as z from 'zod'

export const GeneralOptions = z.object({
  title: z.string(),
  subtitle: z.string(),
  logo_url: z.string().nullish(),
  information: z.string().nullish(),
  redirect_url: z.string().nullish(),
}).meta({
  option_name: 'general',
})

export type GeneralOptions = z.infer<typeof GeneralOptions>

export const GeneralOptionsParser = GeneralOptions.extend({
  title: GeneralOptions.shape.subtitle.default('SafeHaven'),
  subtitle: GeneralOptions.shape.subtitle.default('Carte associative'),
})

export const InitPopupOptions = z.object({
  popup: z.string().nullish(),
  popup_check_text: z.string().nullish(),
}).meta({
  option_name: 'init_popup',
})

export type InitPopupOptions = z.infer<typeof InitPopupOptions>

export const InitPopupOptionsParser = InitPopupOptions.extend({
})

export const SafeModeConfig = z.object({
  enabled: z.boolean(),
  hcaptcha_secret: z.string().nullish(),
  hcaptcha_sitekey: z.string().nullish(),
}).meta({
  option_name: 'safe_mode',
})

export type SafeModeConfig = z.infer<typeof SafeModeConfig>

export const SafeModeConfigParser = SafeModeConfig.extend({
  enabled: SafeModeConfig.shape.enabled.default(false),
  hcaptcha_secret: SafeModeConfig.shape.hcaptcha_secret.default(''),
  hcaptcha_sitekey: SafeModeConfig.shape.hcaptcha_sitekey.default(''),
})

export const CartographyInitConfig = z.object({
  center_lat: z.float64(),
  center_lng: z.float64(),
  zoom: z.int(),
}).meta({
  option_name: 'cartography_init',
})

export type CartographyInitConfig = z.infer<typeof CartographyInitConfig>

export const CartographyInitConfigParser = CartographyInitConfig.extend({
  center_lat: CartographyInitConfig.shape.center_lat.default(47.0),
  center_lng: CartographyInitConfig.shape.center_lng.default(2.0),
  zoom: CartographyInitConfig.shape.zoom.default(5),
})

export const CartographySourceConfig = z.object({
  light_map_url: z.string(),
  dark_map_url: z.string(),
  light_map_attributions: z.string(),
  dark_map_attributions: z.string(),
}).meta({
  option_name: 'cartography_source',
})

export type CartographySourceConfig = z.infer<typeof CartographySourceConfig>

export const CartographySourceConfigParser = CartographySourceConfig.extend({
  light_map_url: CartographySourceConfig.shape.light_map_url.default('https://tile.openstreetmap.org/{z}/{x}/{y}.png'),
  light_map_attributions: CartographySourceConfig.shape.light_map_attributions.default('Map data © OpenStreetMap contributors'),
  dark_map_url: CartographySourceConfig.shape.dark_map_url.default('https://tile.openstreetmap.org/{z}/{x}/{y}.png'),
  dark_map_attributions: CartographySourceConfig.shape.dark_map_attributions.default('Map data © OpenStreetMap contributors'),
})

export const CartographyClusterConfig = z.object({
  declustering_speed: z.float64(),
  characteristic_distance: z.float64(),
  minimal_cluster_size: z.int32(),
}).meta({
  option_name: 'cartography_cluster',
})

export type CartographyClusterConfig = z.infer<typeof CartographyClusterConfig>

export const CartographyClusterConfigParser = CartographyClusterConfig.extend({
  minimal_cluster_size: CartographyClusterConfig.shape.minimal_cluster_size.default(1.65),
  characteristic_distance: CartographyClusterConfig.shape.characteristic_distance.default(5.0),
  declustering_speed: CartographyClusterConfig.shape.declustering_speed.default(6),
})

export const ConfigurationOption = z.union([
  GeneralOptions,
  InitPopupOptions,
  SafeModeConfig,
  CartographyInitConfig,
  CartographySourceConfig,
  CartographyClusterConfig,
])

export type ConfigurationOption = z.infer<typeof ConfigurationOption>

export const ConfigurationOptionParser = z.custom<ConfigurationOption>((data: unknown) => {
  const parsers = [
    GeneralOptionsParser,
    InitPopupOptionsParser,
    SafeModeConfigParser,
    CartographyInitConfigParser,
    CartographySourceConfigParser,
    CartographyClusterConfigParser,
  ]
  for (const parser of parsers) {
    const parse = parser.safeParse(data)
    if (parse.success) return parse.data
  }
  return false
})

export const SafeHavenOptions = z.object({
  general: GeneralOptions,
  init_popup: InitPopupOptions,
  safe_mode: SafeModeConfig,
  cartography_init: CartographyInitConfig,
  cartography_source: CartographySourceConfig,
  cartography_cluster: CartographyClusterConfig,
})

export type SafeHavenOptions = z.infer<typeof SafeHavenOptions>

export const SafeHavenOptionsParser = SafeHavenOptions.extend({
  general: SafeHavenOptions.shape.general.default(GeneralOptionsParser.parse({})),
  init_popup: SafeHavenOptions.shape.init_popup.default(InitPopupOptionsParser.parse({})),
  safe_mode: SafeHavenOptions.shape.safe_mode.default(SafeModeConfigParser.parse({})),
  cartography_init: SafeHavenOptions.shape.cartography_init.default(CartographyInitConfigParser.parse({})),
  cartography_source: SafeHavenOptions.shape.cartography_source.default(CartographySourceConfigParser.parse({})),
  cartography_cluster: SafeHavenOptions.shape.cartography_cluster.default(CartographyClusterConfigParser.parse({})),
})
