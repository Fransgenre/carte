import type { ConfigurationOption, SafeHavenOptions } from '../models/options'
import { CartographyClusterConfig, CartographyClusterConfigParser, CartographyInitConfig, CartographyInitConfigParser, CartographySourceConfig, CartographySourceConfigParser, ConfigurationOptionParser, GeneralOptions, GeneralOptionsParser, InitPopupOptions, InitPopupOptionsParser, SafeHavenOptionsParser, SafeModeConfig, SafeModeConfigParser } from '../models/options'
import type { IDbLike } from '../lib/server-state'
import type { ZodSafeParseResult } from 'zod'

export default class OptionsRepository {
  db: IDbLike

  constructor(db: IDbLike) {
    this.db = db
  }

  async insert_or_update_config(option_name: string, option_value: ConfigurationOption) {
    await this.db.txIf(async (t) => {
      await t.none('INSERT INTO options (name, value) VALUES ($1, $2) ON CONFLICT (name) DO UPDATE SET value = $2', [option_name, option_value])
    })
  }

  async delete(option_name: string) {
    await this.db.txIf(async (t) => {
      await t.none('DELETE FROM options WHERE NAME = $1', option_name)
    })
  }

  async fetch_option(option_name: string): Promise<ConfigurationOption | undefined> {
    const res = await this.db.oneOrNone<{ value: unknown }>('SELECT value FROM options WHERE name = $1', option_name)
    if (res == undefined) return undefined
    return ConfigurationOptionParser.parse(res.value)
  }

  async load(): Promise<SafeHavenOptions> {
    let general: GeneralOptions | undefined
    let init_popup: InitPopupOptions | undefined
    let safe_mode: SafeModeConfig | undefined
    let cartography_init: CartographyInitConfig | undefined
    let cartography_source: CartographySourceConfig | undefined
    let cartography_cluster: CartographyClusterConfig | undefined

    await this.db.task(async (t) => {
      const repo = new OptionsRepository(t)
      let parsed: ZodSafeParseResult<ConfigurationOption> | undefined

      parsed = GeneralOptionsParser.safeParse(
        await repo.fetch_option(GeneralOptions.meta()!.option_name as string),
      )
      if (parsed.success) general = parsed.data as GeneralOptions
      else console.warn('Failed loading general options, using defaults')

      parsed = InitPopupOptionsParser.safeParse(
        await repo.fetch_option(InitPopupOptions.meta()!.option_name as string),
      )
      if (parsed.success) init_popup = parsed.data as InitPopupOptions
      else console.warn('Failed loading init_popup options, using defaults')

      parsed = SafeModeConfigParser.safeParse(
        await repo.fetch_option(SafeModeConfig.meta()!.option_name as string),
      )
      if (parsed.success) safe_mode = parsed.data as SafeModeConfig
      else console.warn('Failed loading safe_mode options, using defaults')

      parsed = CartographyInitConfigParser.safeParse(
        await repo.fetch_option(CartographyInitConfig.meta()!.option_name as string),
      )
      if (parsed.success) cartography_init = parsed.data as CartographyInitConfig
      else console.warn('Failed loading cartography_init options, using defaults')

      parsed = CartographySourceConfigParser.safeParse(
        await repo.fetch_option(CartographySourceConfig.meta()!.option_name as string),
      )
      if (parsed.success) cartography_source = parsed.data as CartographySourceConfig
      else console.warn('Failed loading cartography_source options, using defaults')

      parsed = CartographyClusterConfigParser.safeParse(
        await repo.fetch_option(CartographyClusterConfig.meta()!.option_name as string),
      )
      if (parsed.success) cartography_cluster = parsed.data as CartographyClusterConfig
      else console.warn('Failed loading cartography_cluster options, using defaults')
    })

    return SafeHavenOptionsParser.parse({
      general, init_popup, safe_mode, cartography_init, cartography_source, cartography_cluster,
    })
  }
}
