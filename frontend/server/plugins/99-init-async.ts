import { defineNitroPlugin } from 'nitropack/runtime'
import * as z from 'zod'
import { generate as generatePassword } from 'generate-password'
import { runner as pgMigrate } from 'node-pg-migrate'
import { tryWithKillProcessAsync } from '../lib/errors'
import state from '../lib/server-state'
import type { IConnectedDb, IDbLike } from '../lib/server-state'
import { OptionsRepository, UserRepository } from '../repositories'
import { PgListener } from 'pg-listener'
import type { IDatabase, IMain } from 'pg-promise'
import type { IClient } from 'pg-promise/typescript/pg-subset'

// Nitro plugins aren't asynchronous, so all asynchronous code should be in this one, which should run last
export default defineNitroPlugin(() => {
  tryWithKillProcessAsync(async () => {
    await ensureDatabaseConnectable()
    await runMigrations()
    await createAdminUserIfNeeded()
    await initOptionsFromDb()
    initOptionsDbListener()
    markAsInitialized()
  })
})

async function ensureDatabaseConnectable() {
  const { db } = state

  let isConnected: boolean | undefined
  try {
    await db.any('SELECT 1')
    isConnected = true
  }
  catch {
    isConnected = false
  }

  if (isConnected) {
    console.info('Database connection established')
  }
  else {
    throw 'FATAL : Couldn\'t connect to the database at startup'
  }
}

async function runMigrations() {
  const { db } = state
  let connection: IConnectedDb | undefined
  try {
    connection = await db.connect()
    await pgMigrate({
      dbClient: connection.client,
      databaseUrl: undefined,
      dir: 'migrations',
      direction: 'up',
      migrationsTable: 'pgmigrations',
    })
    console.info('Migrations executed')
  }
  catch (ex) {
    console.error(ex)
    throw 'FATAL : Failed to run migrations'
  }
  finally {
    if (connection) await connection.done()
  }
}

async function createAdminUserIfNeeded() {
  const { db } = state
  const repo = new UserRepository(db)

  try {
    const count = await repo.get_users_count()
    if (count > 0) {
      console.info('Found %d user%s', count, count > 1 ? 's' : '')
      return
    }

    const parsedName = z.string().nonempty().safeParse(process.env.SAFEHAVEN_DEFAULT_USER)
    const name = parsedName.success ? parsedName.data : 'admin'

    const parsedPassword = z.string().nonempty().safeParse(process.env.SAFEHAVEN_DEFAULT_PASSWORD)
    let password = parsedPassword.success ? parsedPassword.data : undefined
    if (password == undefined) password = generatePassword({
      uppercase: true,
      lowercase: true,
      numbers: true,
      symbols: false,
      excludeSimilarCharacters: true,
      length: 32,
    })

    console.info('No user found, creating admin user %s with password %s', name, password)

    const user = await repo.create_user({ name, password, is_admin: true })
    if (!user) throw 'Failed creating admin user'

    console.warn('Default admin user created, please change the password')
  }
  catch (ex) {
    console.error(ex)
    throw 'FATAL : Failed to try and create the default admin user if needed'
  }
}

async function initOptionsFromDb() {
  const { db } = state
  try {
    await refreshCachedOptionsFromDb(db)
  }
  catch (ex) {
    console.error(ex)
    throw 'FATAL : Failed to initialize application options'
  }
}

async function refreshCachedOptionsFromDb(db: IDbLike) {
  const repo = new OptionsRepository(db)
  const options = await repo.load()
  state.options = options
  console.info('Loaded application options')
}

function initOptionsDbListener() {
  const { pgp, db } = state
  const listener = new PgListener({
    pgp: pgp as IMain<object, IClient>,
    db: db as IDatabase<object, IClient>,
    retryAll: {
      retry: Number.POSITIVE_INFINITY,
      delay: 10000,
    },
  })
  let connection: IConnectedDb | undefined
  listener.listen(['reload_options'], {
    onConnected(cn) {
      console.info('Listening for application options change notifications')
      connection = cn
    },
    onDisconnected() {
      console.info('Lost connection to application options change notifications, reconnecting...')
      connection = undefined
    },
    onFailedReconnect() {
      console.error('No longer listening for application options change notifications !')
      connection = undefined
    },
    onMessage(message) {
      if ('reload_options' == message.channel) {
        console.info('Received notification to reload options')
        refreshCachedOptionsFromDb(connection || db)
      }
    },
  })
}

function markAsInitialized() {
  state.initialized = true
  console.info('Server initialized')
}
