import * as z from 'zod'

export const NewOrUpdatedUser = z.object({
  name: z.string(),
  password: z.string().nullish(),
  is_admin: z.boolean(),
})

export type NewOrUpdatedUser = z.infer<typeof NewOrUpdatedUser>

export const NewOrUpdatedUserParser = NewOrUpdatedUser.extend({
})

export const User = z.object({
  id: z.uuidv4(),
  name: z.string(),
  is_admin: z.boolean(),
  last_login: z.date().nullish(),
})

export type User = z.infer<typeof User>

export const UserParser = User.extend({
})

export const AuthenticableUser = z.object({
  ...User.shape,
  password: z.string(),
})

export type AuthenticableUser = z.infer<typeof AuthenticableUser>

export const AuthenticableUserParser = AuthenticableUser.extend({
})
