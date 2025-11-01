/**
 * Default API route handler, which will be called for any unhandled API route
 */
export default defineEventHandler((): never => {
  throw createError({
    statusCode: 404,
    statusMessage: 'Endpoint Not Found',
  })
})
