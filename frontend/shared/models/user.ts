import * as z from 'zod'

export const NewOrUpdatedUserSchema = z.object({
  name: z.string(),
  password: z.string().nullish(),
  is_admin: z.boolean(),
})

export type NewOrUpdatedUser = z.infer<typeof NewOrUpdatedUserSchema>

export const UserSchema = z.object({
  id: z.uuidv4(),
  name: z.string(),
  is_admin: z.boolean(),
  last_login: z.date().nullish(),
})

export type User = z.infer<typeof UserSchema>

export const AuthenticableUserSchema = UserSchema.extend({
  password: z.string(),
})

export type AuthenticableUser = z.infer<typeof AuthenticableUserSchema>
