import { defineEventHandlerWithAppErrorAsync, UnauthorizedAppError, ValidationAppError } from '~~/server/lib/errors'
import type { DeleteAdminOptionResponse, DeleteAdminOptionResponseJson } from '~~/shared/responses'
import { DeleteAdminOptionResponseJsonCodec } from '~~/shared/responses'
import { get_admin_user_identity_from_request } from '~~/server/lib/admin-api-auth'
import state from '~~/server/lib/server-state'
import { OptionsRepository } from '~~/server/repositories'
import { CartographyClusterConfigSchema, CartographyInitConfigSchema, CartographySourceConfigSchema, GeneralOptionsSchema, InitPopupOptionsSchema, SafeModeConfigSchema } from '~~/shared/models'

/**
 * The /api/admin/options/<name> DELETE endpoint, which deletes the given options of the app
 */
export default defineEventHandlerWithAppErrorAsync(async (event): Promise<DeleteAdminOptionResponseJson> => {
  const identity = get_admin_user_identity_from_request(event)
  if (!identity.is_admin) throw new UnauthorizedAppError()

  const name = getRouterParam(event, 'name')
  if (name == undefined) throw new ValidationAppError()
  if (![
    GeneralOptionsSchema.meta()!.option_name as string,
    InitPopupOptionsSchema.meta()!.option_name as string,
    SafeModeConfigSchema.meta()!.option_name as string,
    CartographyInitConfigSchema.meta()!.option_name as string,
    CartographySourceConfigSchema.meta()!.option_name as string,
    CartographyClusterConfigSchema.meta()!.option_name as string,
  ].includes(name)) throw new ValidationAppError()

  const repository = new OptionsRepository(state.db)
  await repository.delete(name)
  const options = await repository.load()

  const response: DeleteAdminOptionResponse = options
  return DeleteAdminOptionResponseJsonCodec.encode(response)
})
