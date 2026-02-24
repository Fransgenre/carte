import { defineEventHandlerWithAppErrorAsync, UnauthorizedAppError, ValidationAppError } from '~~/server/lib/errors'
import type { PutAdminOptionResponse, PutAdminOptionResponseJson } from '~~/shared/responses'
import type { PutAdminOptionRequest } from '~~/shared/requests'
import { PutAdminOptionResponseJsonCodec } from '~~/shared/responses'
import { get_admin_user_identity_from_request } from '~~/server/lib/admin-api-auth'
import state from '~~/server/lib/server-state'
import { OptionsRepository } from '~~/server/repositories'
import { CartographyClusterConfigSchema, CartographyInitConfigSchema, CartographySourceConfigSchema, GeneralOptionsSchema, InitPopupOptionsSchema, SafeModeConfigSchema, type ConfigurationOption } from '~~/shared/models'
import { PutAdminOptionRequestJsonCodec, PutAdminOptionRequestJsonSchema } from '~~/shared/requests'

/**
 * The /api/admin/options/<name> PUT endpoint, which sets the given options of the application
 */
export default defineEventHandlerWithAppErrorAsync(async (event): Promise<PutAdminOptionResponseJson> => {
  const identity = get_admin_user_identity_from_request(event)
  if (!identity.is_admin) throw new UnauthorizedAppError()

  const name = getRouterParam(event, 'name')
  if (name == undefined) throw new ValidationAppError()

  const bodyJson = await readValidatedBody(event, PutAdminOptionRequestJsonSchema.parse)
  const body: PutAdminOptionRequest = PutAdminOptionRequestJsonCodec.decode(bodyJson)

  let config: ConfigurationOption | undefined
  if (name == GeneralOptionsSchema.meta()!.option_name as string) config = GeneralOptionsSchema.parse(body)
  else if (name == InitPopupOptionsSchema.meta()!.option_name as string) config = InitPopupOptionsSchema.parse(body)
  else if (name == SafeModeConfigSchema.meta()!.option_name as string) config = SafeModeConfigSchema.parse(body)
  else if (name == CartographyInitConfigSchema.meta()!.option_name as string) config = CartographyInitConfigSchema.parse(body)
  else if (name == CartographySourceConfigSchema.meta()!.option_name as string) config = CartographySourceConfigSchema.parse(body)
  else if (name == CartographyClusterConfigSchema.meta()!.option_name as string) config = CartographyClusterConfigSchema.parse(body)
  if (!config) throw new ValidationAppError()

  const repository = new OptionsRepository(state.db)
  await repository.insert_or_update_config(name, config)
  const options = await repository.load()

  const response: PutAdminOptionResponse = options
  return PutAdminOptionResponseJsonCodec.encode(response)
})
