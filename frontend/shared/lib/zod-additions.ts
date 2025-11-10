import * as z from 'zod'

export function makeSelfCodec<I extends z.ZodType, O extends z.ZodType>(schemaIn: I, schemaOut: O): z.ZodCodec<I, O> {
  return z.codec(schemaIn, schemaOut, {
    encode: value => schemaIn.parse(value) as never,
    decode: value => schemaOut.parse(value) as never,
  })
}

export function makeCloneCodec<I extends z.ZodType, O extends z.ZodType>(schemaIn: I, schemaOut: O): z.ZodCodec<I, O> {
  return z.codec(schemaIn, schemaOut, {
    encode: value => schemaIn.parse(structuredClone(value)) as never,
    decode: value => schemaOut.parse(structuredClone(value)) as never,
  })
}
