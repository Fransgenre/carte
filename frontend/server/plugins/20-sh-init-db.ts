import { defineNitroPlugin } from 'nitropack/runtime'
import pgPromise from 'pg-promise'
import type { IInitOptions } from 'pg-promise'
import state from '../lib/server-state'
import type { IConnectionParameters } from 'pg-promise/typescript/pg-subset'

export default defineNitroPlugin(() => {
  initDb()
})

function initDb() {
  const { config } = state

  const initOptions: IInitOptions = {
    pgFormatting: false,
    pgNative: false,
    capSQL: true,
    schema: undefined,
    noWarnings: false,
  }
  const pgp = pgPromise(initOptions)

  // Use bigint for BIGINT datatypes (would be string otherwise)
  // Type Id 20 = BIGINT | BIGSERIAL
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pgp.pg.types.setTypeParser(20 as any, BigInt)

  // Use bigint[] for BIGINT[] datatypes (would be string[] otherwise)
  // 1016 = Type Id for arrays of BigInt values
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parseBigIntArray = pgp.pg.types.getTypeParser(1016 as any)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pgp.pg.types.setTypeParser(1016 as any, a => parseBigIntArray(a).map(BigInt))

  const connectionOptions: IConnectionParameters = {
    connectionString: config.database.url,
    max: config.database.pool_size,
    connectionTimeoutMillis: config.database.timeout * 1000,
  }
  const db = pgp(connectionOptions)

  state.initDb(pgp, db)

  console.info('Initialized database pool')
}
