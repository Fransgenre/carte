import * as z from 'zod'

export const UserSchema = z.object({
  id: z.uuidv4(),
  name: z.string(),
  is_admin: z.boolean(),
  last_login: z.date().nullable(),
})

export type User = z.infer<typeof UserSchema>

export const NewOrUpdatedUserSchema = UserSchema.pick({
  name: true,
  is_admin: true,
}).extend({
  password: z.string().optional(),
})

export type NewOrUpdatedUser = z.infer<typeof NewOrUpdatedUserSchema>

export const AuthenticableUserSchema = UserSchema.extend({
  password: z.string(),
})

export type AuthenticableUser = z.infer<typeof AuthenticableUserSchema>

export const AdminUserIdentitySchema = UserSchema.pick({
  is_admin: true,
}).extend({
  admin_id: UserSchema.shape.id,
  username: UserSchema.shape.name,
})

export type AdminUserIdentity = z.infer<typeof AdminUserIdentitySchema>
