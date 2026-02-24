import * as z from 'zod'
import { makeCloneCodec } from '../lib/zod-additions'
import { ConfigurationOptionParser, NewOrUpdateTagSchema } from '../models'

// /api/admin/options

export const PutAdminOptionRequestSchema = ConfigurationOptionParser
export type PutAdminOptionRequest = z.infer<typeof PutAdminOptionRequestSchema>
export const PutAdminOptionRequestJsonSchema = PutAdminOptionRequestSchema
export type PutAdminOptionRequestJson = z.infer<typeof PutAdminOptionRequestJsonSchema>
export const PutAdminOptionRequestJsonCodec = makeCloneCodec(PutAdminOptionRequestSchema, PutAdminOptionRequestJsonSchema)

// /api/admin/session

export const PostAdminSessionRequestSchema = z.object({
  username: z.string(),
  password: z.string(),
  remember_me: z.boolean(),
})
export type PostAdminSessionRequest = z.infer<typeof PostAdminSessionRequestSchema>
export const PostAdminSessionRequestJsonSchema = PostAdminSessionRequestSchema
export type PostAdminSessionRequestJson = z.infer<typeof PostAdminSessionRequestJsonSchema>
export const PostAdminSessionRequestJsonCodec = makeCloneCodec(PostAdminSessionRequestSchema, PostAdminSessionRequestJsonSchema)

// /api/admin/tags

export const PostAdminTagRequestSchema = NewOrUpdateTagSchema
export type PostAdminTagRequest = z.infer<typeof PostAdminTagRequestSchema>
export const PostAdminTagRequestJsonSchema = PostAdminTagRequestSchema
export type PostAdminTagRequestJson = z.infer<typeof PostAdminTagRequestJsonSchema>
export const PostAdminTagRequestJsonCodec = makeCloneCodec(PostAdminTagRequestSchema, PostAdminTagRequestJsonSchema)

export const PutAdminTagRequestSchema = NewOrUpdateTagSchema.extend({
  version: z.int32(),
})
export type PutAdminTagRequest = z.infer<typeof PutAdminTagRequestSchema>
export const PutAdminTagRequestJsonSchema = PutAdminTagRequestSchema
export type PutAdminTagRequestJson = z.infer<typeof PutAdminTagRequestJsonSchema>
export const PutAdminTagRequestJsonCodec = makeCloneCodec(PutAdminTagRequestSchema, PutAdminTagRequestJsonSchema)
