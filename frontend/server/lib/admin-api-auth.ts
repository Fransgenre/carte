import type { EventHandlerRequest, H3Event } from 'h3'
import type { CookieSerializeOptions } from 'cookie-es'
import type { AdminEphemeralTokenClaims, AdminRefreshTokenClaims } from '~~/server/models'
import type { User, AdminUserIdentity } from '~~/shared/models'
import type { ServerState } from '~~/server/lib/server-state'
import { setCookie, deleteCookie, getCookie } from 'h3'
import jsonwebtoken from 'jsonwebtoken'
import { AdminEphemeralTokenClaimsSchema, AdminRefreshTokenClaimsSchema } from '~~/server/models'
import { AdminUserIdentitySchema } from '~~/shared/models'
import { UnauthorizedAppError } from './errors'
import { UserRepository } from '~~/server/repositories'

const EPHEMERAL_TOKEN_COOKIE_NAME = 'ephemeral_token'
const REFRESH_TOKEN_COOKIE_NAME = 'refresh_token'

const EPHEMERAL_TOKEN_DURATION = 60 * 60 * 1 // 1 hour (in sec)
const REFRESH_TOKEN_DURATION = 60 * 60 * 8 // 8 hours (in sec)
const REFRESH_TOKEN_REMEMBER_ME_DURATION = 60 * 60 * 24 * 7 // 7 days (in sec)

function create_admin_user_identity_from_claims(claims: AdminEphemeralTokenClaims): AdminUserIdentity {
  return {
    admin_id: claims.admin_id,
    username: claims.username,
    is_admin: claims.is_admin,
  }
}

function create_admin_user_identity_from_user(user: User): AdminUserIdentity {
  return {
    admin_id: user.id,
    username: user.name,
    is_admin: user.is_admin,
  }
}

const REQUEST_CONTEXT_ADMIN_USER_IDENTITY = 'admin_user_identity'

export function get_admin_user_identity_from_request<T extends EventHandlerRequest>(event: H3Event<T>): AdminUserIdentity {
  const data: unknown = event.context[REQUEST_CONTEXT_ADMIN_USER_IDENTITY]
  const result = AdminUserIdentitySchema.safeParse(data)
  if (!result.success) throw new UnauthorizedAppError()
  return result.data
}

export function set_admin_user_identity_in_request<T extends EventHandlerRequest>(data: AdminUserIdentity, event: H3Event<T>) {
  event.context[REQUEST_CONTEXT_ADMIN_USER_IDENTITY] = data
}

export async function authenticate_request<T extends EventHandlerRequest>(event: H3Event<T>, state: ServerState) {
  // If an ephemeral token is present, try to use it
  // An invalid ephemeral token is equivalent to no token at all

  const ephemeral_token_str = getCookie(event, EPHEMERAL_TOKEN_COOKIE_NAME)
  if (ephemeral_token_str != undefined) {
    let claims: AdminEphemeralTokenClaims | undefined
    try {
      // Decode the ephemeral token
      const data: unknown = jsonwebtoken.verify(ephemeral_token_str, state.config.token_secret)
      claims = AdminEphemeralTokenClaimsSchema.parse(data)
    }
    catch {
      // empty
    }

    // If the token is valid we just set the identity and return
    if (claims) {
      const identity = create_admin_user_identity_from_claims(claims)
      set_admin_user_identity_in_request(identity, event)
      return
    }
  }

  // If no ephemeral token is present, or the ephemeral token is invalid, generate one using the refresh token

  const refresh_token_str = getCookie(event, REFRESH_TOKEN_COOKIE_NAME)
  if (refresh_token_str == undefined) throw new UnauthorizedAppError()
  let claims: AdminRefreshTokenClaims | undefined
  try {
    // Decode the refresh token
    const data: unknown = jsonwebtoken.verify(refresh_token_str, state.config.token_secret)
    claims = AdminRefreshTokenClaimsSchema.parse(data)
  }
  catch {
    // empty
  }
  if (!claims) {
    // If the refresh token is invalid, clear it and return an error
    expire_cookies(event, state)
    throw new UnauthorizedAppError()
  }

  // get the user
  const repository = new UserRepository(state.db)
  let user: User | undefined
  try {
    user = await repository.get_user(claims.admin_id)
  }
  catch {
    // empty
  }
  // if the user is not found, the user was deleted, clear the cookies and return an error
  if (!user) {
    expire_cookies(event, state)
    throw new UnauthorizedAppError()
  }

  // Regenerate and update tokens
  set_auth_cookies(user, claims.remember_me, event, state)
  const identity = create_admin_user_identity_from_user(user)
  set_admin_user_identity_in_request(identity, event)
}

function getAdminCookieProps(state: ServerState): CookieSerializeOptions {
  return {
    path: '/api/admin',
    secure: state.config.secure_cookie,
    httpOnly: true,
    sameSite: 'strict',
  }
}

export function set_auth_cookies(auth_user: User, remember_me: boolean, event: H3Event, state: ServerState) {
  const time_now = Math.floor(Date.now() / 1000)

  const ephemeral_token_exp = time_now + EPHEMERAL_TOKEN_DURATION
  const ephemeral_token_str = state.generate_token(AdminEphemeralTokenClaimsSchema.parse({
    admin_id: auth_user.id,
    username: auth_user.name,
    is_admin: auth_user.is_admin,
    iat: time_now,
    exp: ephemeral_token_exp,
  }))
  const ephemeral_cookie_props = getAdminCookieProps(state)
  ephemeral_cookie_props.expires = new Date(ephemeral_token_exp * 1000)
  setCookie(event, EPHEMERAL_TOKEN_COOKIE_NAME, ephemeral_token_str, ephemeral_cookie_props)

  const refresh_token_exp = time_now + (remember_me ? REFRESH_TOKEN_REMEMBER_ME_DURATION : REFRESH_TOKEN_DURATION)
  const refresh_token_str = state.generate_token(AdminRefreshTokenClaimsSchema.parse({
    admin_id: auth_user.id,
    iat: time_now,
    exp: refresh_token_exp,
    remember_me,
  }))
  const refresh_cookie_props = getAdminCookieProps(state)
  refresh_cookie_props.expires = remember_me ? new Date(refresh_token_exp * 1000) : undefined
  setCookie(event, REFRESH_TOKEN_COOKIE_NAME, refresh_token_str, refresh_cookie_props)
}

export function expire_cookies<T extends EventHandlerRequest>(event: H3Event<T>, state: ServerState) {
  [EPHEMERAL_TOKEN_COOKIE_NAME, REFRESH_TOKEN_COOKIE_NAME].forEach((cookie) => {
    deleteCookie(event, cookie, getAdminCookieProps(state))
  })
}
