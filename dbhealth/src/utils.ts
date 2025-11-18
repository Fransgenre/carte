import * as z from 'zod'
import type { ZodError } from 'zod'

export function describeParseError<T>(error: ZodError<T>): string[] {
  return error.issues.map(issue => `${issue.path} : ${issue.message}`)
}

export const MultiPolygonSchema = z.array(z.array(z.tuple([z.float64(), z.float64()])))

export type MultiPolygon = z.infer<typeof MultiPolygonSchema>
