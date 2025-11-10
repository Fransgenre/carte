import type { ITask } from 'pg-promise'
import type pgPromise from 'pg-promise'
import type { SafeHavenConfig } from '../models/'
import type { SafeHavenOptions } from '../../shared/models/'

export type IPgp = ReturnType<typeof pgPromise>
export type IDb = ReturnType<IPgp>
export type IConnectedDb = Awaited<ReturnType<IDb['connect']>>
export type IDbTask = ITask<unknown>
export type IDbLike = IDb | IConnectedDb | IDbTask

export class ServerState {
  #config: SafeHavenConfig | undefined

  set config(config: SafeHavenConfig) {
    this.#config = config
  }

  get config(): SafeHavenConfig {
    if (!this.#config) throw 'Configuration not available, please set it first'
    return this.#config
  }

  #pgp: IPgp | undefined
  #db: IDb | undefined

  initDb(pgp: IPgp, db: IDb) {
    if (this.#pgp || this.#db) throw 'Database already initialized'
    this.#pgp = pgp
    this.#db = db
  }

  get pgp(): IPgp {
    if (!this.#pgp) throw 'Database not initialized, please call initDb() first'
    return this.#pgp
  }

  get db(): IDb {
    if (!this.#db) throw 'Database not initialized, please call initDb() first'
    return this.#db
  }

  #options: SafeHavenOptions | undefined

  set options(options: SafeHavenOptions) {
    this.#options = options
  }

  get options(): SafeHavenOptions {
    if (!this.#options) throw 'Cached options not available, please set them first'
    return this.#options
  }

  #initialized: boolean = false

  set initialized(initialized: boolean) {
    if (this.#initialized) throw 'Already initialized'
    this.#initialized = initialized
  }

  get initialized() {
    return this.#initialized
  }
}

const state = new ServerState()
export default state
