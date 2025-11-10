import * as z from 'zod'
import type { ZodSafeParseResult } from 'zod'
import { defineNitroPlugin } from 'nitropack/runtime'
import process from 'node:process'
import { tryWithKillProcess } from '../lib/errors'
import state from '../lib/server-state'
import { DatabaseConfigWithDefaultsSchema, SafeHavenConfigWithDefaultsSchema } from '../models/'

export default defineNitroPlugin(() => {
  tryWithKillProcess(() => {
    initConfigFromEnv()
  })
})

function initConfigFromEnv() {
  let parsed: ZodSafeParseResult<unknown>

  let databaseUrl: string | undefined
  if (process.env.SH__DATABASE__URL) {
    parsed = z.string().nonempty().safeParse(process.env.SH__DATABASE__URL)
    if (parsed.success) databaseUrl = parsed.data as string
    else console.warn('Failed parsing configuration env SH__DATABASE__URL, using default')
  }

  let pool_size: number | undefined
  if (process.env.SH__DATABASE__POOL_SIZE) {
    parsed = z.coerce.number().safeParse(process.env.SH__DATABASE__POOL_SIZE)
    if (parsed.success) pool_size = parsed.data as number
    else console.warn('Failed parsing configuration env SH__DATABASE__POOL_SIZE, using default')
  }

  let timeout: number | undefined
  if (process.env.SH__DATABASE__TIMEOUT) {
    parsed = z.coerce.number().safeParse(process.env.SH__DATABASE__TIMEOUT)
    if (parsed.success) timeout = parsed.data as number
    else console.warn('Failed parsing configuration env SH__DATABASE__TIMEOUT, using default')
  }

  let token_secret: string | undefined
  if (process.env.SH__TOKEN_SECRET) {
    parsed = z.string().nonempty().safeParse(process.env.SH__TOKEN_SECRET)
    if (parsed.success) token_secret = parsed.data as string
    else console.warn('Failed parsing configuration env SH__TOKEN_SECRET, using default')
  }

  let secure_cookie: boolean | undefined
  if (process.env.SH__SECURE_COOKIE) {
    parsed = z.stringbool().safeParse(process.env.SH__SECURE_COOKIE)
    if (parsed.success) secure_cookie = parsed.data as boolean
    else console.warn('Failed parsing configuration env SH__TOKEN_SECRET, using default')
  }

  state.config = SafeHavenConfigWithDefaultsSchema.parse({
    database: DatabaseConfigWithDefaultsSchema.parse({
      url: databaseUrl,
      pool_size,
      timeout,
    }),
    token_secret,
    secure_cookie,
  })

  console.info('Loaded application configuration')
}
