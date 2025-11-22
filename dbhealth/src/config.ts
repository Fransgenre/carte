import * as z from 'zod'
import process from 'node:process'

export const ConfigSchema = z.object({
  databaseUrl: z.string(),
})

export type Config = z.infer<typeof ConfigSchema>

function initConfig(): Config {
  let parsed: z.ZodSafeParseResult<unknown>

  parsed = z.string().nonempty().safeParse(process.env.SH__DATABASE__URL)
  if (!parsed.success) parsed = z.string().nonempty().safeParse(process.env.DATABASE_URL)
  if (!parsed.success) throw 'Environment variable SH__DATABASE__URL ou DATABASE_URL not found'
  const databaseUrl = parsed.data as string

  return ConfigSchema.parse({
    databaseUrl,
  })
}

export const config = initConfig()
