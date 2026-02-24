import * as z from 'zod'
import { makeCloneCodec } from '../lib/zod-additions'
import { AdminUserIdentitySchema, SafeHavenOptionsSchema, HomePageStatsSchema, CountResultSchema, TagSchema } from '../../shared/models/'

// /api/admin/options

export const GetAdminOptionsResponseSchema = SafeHavenOptionsSchema
export type GetAdminOptionsResponse = z.infer<typeof GetAdminOptionsResponseSchema>
export const GetAdminOptionsResponseJsonSchema = GetAdminOptionsResponseSchema
export type GetAdminOptionsResponseJson = z.infer<typeof GetAdminOptionsResponseJsonSchema>
export const GetAdminOptionsResponseJsonCodec = makeCloneCodec(GetAdminOptionsResponseSchema, GetAdminOptionsResponseJsonSchema)

export const PutAdminOptionResponseSchema = GetAdminOptionsResponseSchema
export type PutAdminOptionResponse = z.infer<typeof PutAdminOptionResponseSchema>
export const PutAdminOptionResponseJsonSchema = PutAdminOptionResponseSchema
export type PutAdminOptionResponseJson = z.infer<typeof PutAdminOptionResponseJsonSchema>
export const PutAdminOptionResponseJsonCodec = makeCloneCodec(PutAdminOptionResponseSchema, PutAdminOptionResponseJsonSchema)

export const DeleteAdminOptionResponseSchema = GetAdminOptionsResponseSchema
export type DeleteAdminOptionResponse = z.infer<typeof DeleteAdminOptionResponseSchema>
export const DeleteAdminOptionResponseJsonSchema = DeleteAdminOptionResponseSchema
export type DeleteAdminOptionResponseJson = z.infer<typeof DeleteAdminOptionResponseJsonSchema>
export const DeleteAdminOptionResponseJsonCodec = makeCloneCodec(DeleteAdminOptionResponseSchema, DeleteAdminOptionResponseJsonSchema)

// /api/admin/session

export const GetAdminSessionResponseSchema = AdminUserIdentitySchema
export type GetAdminSessionResponse = z.infer<typeof GetAdminSessionResponseSchema>
export const GetAdminSessionResponseJsonSchema = GetAdminSessionResponseSchema
export type GetAdminSessionResponseJson = z.infer<typeof GetAdminSessionResponseJsonSchema>
export const GetAdminSessionResponseJsonCodec = makeCloneCodec(GetAdminSessionResponseSchema, GetAdminSessionResponseJsonSchema)

export const PostAdminSessionResponseSchema = GetAdminSessionResponseSchema.pick({
  is_admin: true,
})
export type PostAdminSessionResponse = z.infer<typeof PostAdminSessionResponseSchema>
export const PostAdminSessionResponseJsonSchema = PostAdminSessionResponseSchema
export type PostAdminSessionResponseJson = z.infer<typeof PostAdminSessionResponseJsonSchema>
export const PostAdminSessionResponseJsonCodec = makeCloneCodec(PostAdminSessionResponseSchema, PostAdminSessionResponseJsonSchema)

// /api/admin/stats

export const GetAdminStatsResponseSchema = HomePageStatsSchema
export type GetAdminStatsResponse = z.infer<typeof GetAdminStatsResponseSchema>
export const GetAdminStatsResponseJsonSchema = GetAdminStatsResponseSchema.extend({
  total_visits_30_days: z.string(),
  total_visits_7_days: z.string(),
  visits_30_days: z.record(
    z.string(),
    z.string(),
  ),
})
export type GetAdminStatsResponseJson = z.infer<typeof GetAdminStatsResponseJsonSchema>
export const GetAdminStatsResponseJsonCodec = z.codec(GetAdminStatsResponseJsonSchema, GetAdminStatsResponseSchema, {
  encode: (value: GetAdminStatsResponse): GetAdminStatsResponseJson => {
    const result = {
      total_entities: value.total_entities,
      total_comments: value.total_comments,
      pending_entities: value.pending_entities,
      pending_comments: value.pending_comments,
      total_visits_30_days: String(value.total_visits_30_days),
      total_visits_7_days: String(value.total_visits_7_days),
      visits_30_days: {} as Record<string, string>,
    }
    Object.keys(value.visits_30_days).forEach((visit_date) => {
      result.visits_30_days[visit_date] = String(value.visits_30_days[visit_date]!)
    })
    return result
  },
  decode: (value: GetAdminStatsResponseJson): GetAdminStatsResponse => {
    const result = {
      total_entities: value.total_entities,
      total_comments: value.total_comments,
      pending_entities: value.pending_entities,
      pending_comments: value.pending_comments,
      total_visits_30_days: BigInt(value.total_visits_30_days),
      total_visits_7_days: BigInt(value.total_visits_7_days),
      visits_30_days: {} as Record<string, bigint>,
    }
    Object.keys(value.visits_30_days).forEach((visit_date) => {
      result.visits_30_days[visit_date] = BigInt(value.visits_30_days[visit_date]!)
    })
    return result
  },
})

export const GetAdminStatsCountCommentsEntitiesResponseSchema = CountResultSchema
export type GetAdminStatsCountCommentsEntitiesResponse = z.infer<typeof GetAdminStatsCountCommentsEntitiesResponseSchema>
export const GetAdminStatsCountCommentsEntitiesResponseJsonSchema = GetAdminStatsCountCommentsEntitiesResponseSchema
export type GetAdminStatsCountCommentsEntitiesResponseJson = z.infer<typeof GetAdminStatsCountCommentsEntitiesResponseJsonSchema>
export const GetAdminStatsCountCommentsEntitiesResponseJsonCodec = makeCloneCodec(GetAdminStatsCountCommentsEntitiesResponseSchema, GetAdminStatsCountCommentsEntitiesResponseJsonSchema)

// /api/admin/tags

export const GetAdminTagsResponseSchema = z.array(TagSchema)
export type GetAdminTagsResponse = z.infer<typeof GetAdminTagsResponseSchema>
export const GetAdminTagsResponseJsonSchema = GetAdminTagsResponseSchema
export type GetAdminTagsResponseJson = z.infer<typeof GetAdminTagsResponseJsonSchema>
export const GetAdminTagsResponseJsonCodec = makeCloneCodec(GetAdminTagsResponseSchema, GetAdminTagsResponseJsonSchema)

export const PostAdminTagResponseSchema = TagSchema
export type PostAdminTagResponse = z.infer<typeof PostAdminTagResponseSchema>
export const PostAdminTagResponseJsonSchema = PostAdminTagResponseSchema
export type PostAdminTagResponseJson = z.infer<typeof PostAdminTagResponseJsonSchema>
export const PostAdminTagResponseJsonCodec = makeCloneCodec(PostAdminTagResponseSchema, PostAdminTagResponseJsonSchema)

export const GetAdminTagResponseSchema = TagSchema
export type GetAdminTagResponse = z.infer<typeof GetAdminTagResponseSchema>
export const GetAdminTagResponseJsonSchema = GetAdminTagResponseSchema
export type GetAdminTagResponseJson = z.infer<typeof GetAdminTagResponseJsonSchema>
export const GetAdminTagResponseJsonCodec = makeCloneCodec(GetAdminTagResponseSchema, GetAdminTagResponseJsonSchema)

export const PutAdminTagResponseSchema = TagSchema
export type PutAdminTagResponse = z.infer<typeof PutAdminTagResponseSchema>
export const PutAdminTagResponseJsonSchema = PutAdminTagResponseSchema
export type PutAdminTagResponseJson = z.infer<typeof PutAdminTagResponseJsonSchema>
export const PutAdminTagResponseJsonCodec = makeCloneCodec(PutAdminTagResponseSchema, PutAdminTagResponseJsonSchema)
