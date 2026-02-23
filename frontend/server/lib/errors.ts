import type { NuxtError } from '#app'
import type { EventHandler, EventHandlerRequest, H3Event } from 'h3'
import process from 'node:process'
import pgPromise from 'pg-promise'
import * as z from 'zod'

export enum AppErrorStatuses {
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  INTERNAL_SERVER_ERROR = 500,
}

export enum AppErrorCodes {
  POOL_ERROR = 'pool_error',
  USER_NOT_FOUND = 'user_not_found',
  TOKEN_VALIDATION_ERROR = 'token_validation_error',
  VALIDATION_ERROR = 'validation_error',
  NOT_FOUND = 'not_found',
  DATABASE_ERROR = 'database_error',
  PARSER_ERROR = 'parser_error',
  UNAUTHORIZED = 'unauthorized',
  INVALID_PAGINATION = 'invalid_pagination',
  INTERNAL_ERROR = 'internal_error',
  FORBIDDEN = 'forbidden',
}

export type AppError = Error & {
  status_code: AppErrorStatuses
  error_code: AppErrorCodes
  toNuxtError: () => NuxtError
}

export function isAppError(value: unknown): value is AppError {
  if (value == undefined) return false
  if (!(value instanceof Error)) return false
  const record = value as Error & Record<string, unknown>
  if (typeof record.status_code != 'number') return false
  if (typeof record.error_code != 'string') return false
  if (typeof record.toNuxtError != 'function') return false
  return true
}

export abstract class AppErrorBase extends Error implements AppError {
  status_code: AppErrorStatuses
  error_code: AppErrorCodes

  constructor(message: string = 'An error has occured', status_code: AppErrorStatuses = AppErrorStatuses.INTERNAL_SERVER_ERROR, error_code: AppErrorCodes = AppErrorCodes.INTERNAL_ERROR) {
    super (message)
    Object.setPrototypeOf(this, new.target.prototype)
    this.name = new.target.name
    this.status_code = status_code
    this.error_code = error_code
  }

  toNuxtError() {
    const error = createError(this)
    error.statusCode = this.status_code
    error.statusMessage = this.error_code
    return error
  }
}

export class PoolAppError extends AppErrorBase {
  constructor(message: string = 'A pool error occured') {
    super(message, AppErrorStatuses.INTERNAL_SERVER_ERROR, AppErrorCodes.POOL_ERROR)
    this.name = 'PoolAppError'
  }
}

export class BadUsernameOrPasswordAppError extends AppErrorBase {
  constructor(message: string = 'Invalid username or password') {
    super(message, AppErrorStatuses.NOT_FOUND, AppErrorCodes.USER_NOT_FOUND)
    this.name = 'BadUsernameOrPasswordAppError'
  }
}

export class TokenValidationAppError extends AppErrorBase {
  constructor(message: string = 'Invalid token') {
    super(message, AppErrorStatuses.UNAUTHORIZED, AppErrorCodes.TOKEN_VALIDATION_ERROR)
    this.name = 'TokenValidationAppError'
  }
}

export class ValidationAppError extends AppErrorBase {
  constructor(message: string = 'Validation failed') {
    super(message, AppErrorStatuses.BAD_REQUEST, AppErrorCodes.VALIDATION_ERROR)
    this.name = 'ValidationAppError'
  }
}

export class NotFoundAppError extends AppErrorBase {
  constructor(message: string = 'Not found') {
    super(message, AppErrorStatuses.NOT_FOUND, AppErrorCodes.NOT_FOUND)
    this.name = 'NotFoundAppError'
  }
}

export class DatabaseAppError extends AppErrorBase {
  constructor(message: string = 'Database error') {
    super(message, AppErrorStatuses.INTERNAL_SERVER_ERROR, AppErrorCodes.DATABASE_ERROR)
    this.name = 'DatabaseAppError'
  }
}

export class ParserAppError extends AppErrorBase {
  constructor(message: string = 'Parse failed') {
    super(message, AppErrorStatuses.INTERNAL_SERVER_ERROR, AppErrorCodes.PARSER_ERROR)
    this.name = 'ValidationAppError'
  }
}

export class UnauthorizedAppError extends AppErrorBase {
  constructor(message: string = 'Autorisation error') {
    super(message, AppErrorStatuses.UNAUTHORIZED, AppErrorCodes.UNAUTHORIZED)
    this.name = 'UnauthorizedAppError'
  }
}

export class InvalidPaginationAppError extends AppErrorBase {
  constructor(message: string = 'Invalid pagination') {
    super(message, AppErrorStatuses.BAD_REQUEST, AppErrorCodes.INVALID_PAGINATION)
    this.name = 'InvalidPaginationAppError'
  }
}

export class InternalServerAppError extends AppErrorBase {
  constructor(message: string = 'Internal server error') {
    super(message, AppErrorStatuses.INTERNAL_SERVER_ERROR, AppErrorCodes.INTERNAL_ERROR)
    this.name = 'InternalServerAppError'
  }
}

export class ForbiddenAppError extends AppErrorBase {
  constructor(message: string = 'Forbidden') {
    super(message, AppErrorStatuses.FORBIDDEN, AppErrorCodes.FORBIDDEN)
    this.name = 'ForbiddenAppError'
  }
}

export function defineEventHandlerWithAppError<T extends EventHandlerRequest, D>(fn: EventHandler<T, D>): EventHandler<T, D> {
  return defineEventHandler<T>(event => tryWithAppError(fn, event))
}

export function defineEventHandlerWithAppErrorAsync<T extends EventHandlerRequest, D>(fn: EventHandler<T, D>): EventHandler<T, D> {
  return defineEventHandler<T>(async event => await tryWithAppErrorAsync(fn, event))
}

export function tryWithAppError<T extends EventHandlerRequest, D>(fn: EventHandler<T, D>, event: H3Event<T>): D {
  try {
    return fn(event)
  }
  catch (ex) {
    throw createNuxtError(ex)
  }
}

export async function tryWithAppErrorAsync<T extends EventHandlerRequest, D>(fn: EventHandler<T, D>, event: H3Event<T>): Promise<D> {
  try {
    return await fn(event)
  }
  catch (ex) {
    throw createNuxtError(ex)
  }
}

function createNuxtError(ex: unknown) {
  let error: AppError | undefined

  if (isAppError(ex)) error = ex

  else if (ex == undefined) {
    error = new InternalServerAppError()
    console.log('Unhandled undefined error')
  }

  else if (ex instanceof pgPromise.errors.QueryResultError) {
    switch (ex.code) {
      case pgPromise.errors.queryResultErrorCode.noData:
        error = new NotFoundAppError()
        break
      case pgPromise.errors.queryResultErrorCode.notEmpty:
      case pgPromise.errors.queryResultErrorCode.multiple:
      default:
        error = new DatabaseAppError()
    }
    error.stack = ex.stack
    error.cause = ex.cause
    console.log(ex)
  }

  else if (
    ex instanceof pgPromise.errors.ParameterizedQueryError
    || ex instanceof pgPromise.errors.PreparedStatementError
    || ex instanceof pgPromise.errors.QueryFileError
  ) {
    error = new DatabaseAppError()
    error.stack = ex.stack
    error.cause = ex.cause
    console.log(ex)
  }

  else if (ex instanceof z.core.$ZodError) {
    error = new ParserAppError(ex.issues[0]?.message)
    error.stack = ex.stack
    error.cause = ex.cause
    console.log(ex)
  }

  else if (ex instanceof Error) {
    error = new InternalServerAppError(ex.message)
    error.cause = ex.cause
    error.stack = ex.stack
    console.log(ex)
  }

  else if (typeof ex == 'string') {
    error = new InternalServerAppError(ex)
    console.log('Unhandled error ', ex)
  }

  else {
    error = new InternalServerAppError()
    console.log('Unhandled error ', ex)
  }

  return error.toNuxtError()
}

export function tryWithKillProcess<T>(fn: () => T): T {
  try {
    return fn()
  }
  catch (ex) {
    try {
      if (ex == undefined)
        console.error('Undefined error')
      else
        console.error(ex)
    }
    catch {
      // Empty
    }
    process.kill(process.pid)
    throw ex
  }
}

export async function tryWithKillProcessAsync<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn()
  }
  catch (ex) {
    try {
      if (ex == undefined)
        console.error('Undefined error')
      else
        console.error(ex)
    }
    catch {
      // Empty
    }
    process.kill(process.pid)
    throw ex
  }
}
