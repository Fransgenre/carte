import pgPromise from 'pg-promise'
import type { ITask } from 'pg-promise'
import type { IInitOptions } from 'pg-promise'
import type { IConnectionParameters } from 'pg-promise/typescript/pg-subset'
import type { Config } from './config.ts'

export type IPgp = ReturnType<typeof pgPromise>
export type IDb = ReturnType<IPgp>
export type IConnectedDb = Awaited<ReturnType<IDb['connect']>>
export type IDbTask = ITask<unknown>
export type IDbLike = IDb | IConnectedDb | IDbTask

let pgp: IPgp | undefined

export function getPgp(): IPgp {
  if (!pgp) throw 'Please call initDb() first'
  return pgp
}

let db: IDb | undefined

export function getDb(): IDb {
  if (!db) throw 'Please call initDb() first'
  return db
}

export function initDb(config: Config) {
  if (pgp || db) throw 'Database already initialized'

  const initOptions: IInitOptions = {
    pgFormatting: false,
    pgNative: false,
    capSQL: true,
    schema: undefined,
    noWarnings: false,
  }
  pgp = pgPromise(initOptions)

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
    connectionString: config.databaseUrl,
  }
  db = pgp(connectionOptions)
}

export async function checkConnection(db: IDbLike) {
  let isConnected: boolean | undefined
  try {
    await db.any('SELECT 1')
    isConnected = true
  }
  catch {
    isConnected = false
  }
  return isConnected
}
