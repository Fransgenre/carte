import * as z from 'zod'
import { AdminUserIdentitySchema } from '../../shared/models'

const BaseTokenClaimsSchema = z.object({
  exp: z.uint32(),
  iat: z.uint32(),
})

export const AdminEphemeralTokenClaimsSchema = BaseTokenClaimsSchema.extend(AdminUserIdentitySchema.shape)

export type AdminEphemeralTokenClaims = z.infer<typeof AdminEphemeralTokenClaimsSchema>

export const AdminRefreshTokenClaimsSchema = BaseTokenClaimsSchema.extend({
  admin_id: AdminEphemeralTokenClaimsSchema.shape.admin_id,
  remember_me: z.boolean(),
})

export type AdminRefreshTokenClaims = z.infer<typeof AdminRefreshTokenClaimsSchema>

export const MapUserTokenClaimsSchema = BaseTokenClaimsSchema.extend({
  // TODO
  fam_priv_idx: z.record(
    z.string(),
    z.array(z.string()),
  ),
})

/* pub struct MapUserTokenClaims {
    pub perms: Permissions,
    pub fam_priv_idx: HashMap<Uuid, Vec<String>>,
    pub exp: usize,
    pub iat: usize,
} */

export type MapUserTokenClaims = z.infer<typeof MapUserTokenClaimsSchema>
