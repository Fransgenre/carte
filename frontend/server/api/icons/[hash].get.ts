import { defineEventHandlerWithAppErrorAsync, ValidationAppError } from '~~/server/lib/errors'
import { IconRepository } from '~~/server/repositories'
import type { ServerState } from '~~/server/lib/server-state'
import state from '~~/server/lib/server-state'
import type { Icon } from '~~/shared/models'

/**
 * The /api/icons/<hash> GET endpoint, which returns the given icon
 */
export default defineEventHandlerWithAppErrorAsync(async (event): Promise<Buffer> => {
  const hash = getRouterParam(event, 'hash')
  if (hash == undefined) throw new ValidationAppError()

  const icon = await get_icon_internal(hash, state)

  appendResponseHeaders(event, {
    'Content-Type': icon.http_mime_type,
    'Cache-Control': 'public, max-age=31536000',
  })

  return icon.data
})

export async function get_icon_internal(hash: string, serverState: ServerState): Promise<Icon> {
  // Check cache firsts
  let icon: Icon | undefined = serverState.icon_cache[hash]
  if (icon) return icon

  // If not found in cache, query the database
  const repository = new IconRepository(serverState.db)
  icon = await repository.get_icon(hash)

  // Update cache and return the icon
  serverState.icon_cache[hash] = icon
  return icon
}
