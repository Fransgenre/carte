import * as z from 'zod'
import type { IDbLike } from '../lib/server-state'
import type { AuthenticableUser, NewOrUpdatedUser, User } from '../../shared/models/'
import { AuthenticableUserSchema, UserSchema } from '../../shared/models/'
import { hash_password, verify_password } from '../lib/scrypt'
import { ValidationAppError } from '../lib/errors'

export default class UserRepository {
  db: IDbLike

  constructor(db: IDbLike) {
    this.db = db
  }

  async get_users_count(): Promise<number> {
    const res = await this.db.one<{ count: unknown }>('SELECT COUNT(*) FROM users')
    return Number(
      z.bigint().parse(res.count),
    )
  }

  async create_user(user: NewOrUpdatedUser): Promise<User> {
    if (!user.name.length) throw new ValidationAppError('Name cannot be empty')
    const new_password = user.password
    if (new_password == undefined) throw new ValidationAppError('Password for new users is required')
    if (!new_password.length) throw new ValidationAppError('Password cannot be empty')
    const password_hash = await hash_password(new_password)
    if (password_hash == undefined) throw new ValidationAppError('Error hashing password')

    const res = await this.db.txIf(async (t) => {
      return await t.one<unknown>(`
        INSERT INTO users (name, password, is_admin)
        VALUES ($1, $2, $3)
        RETURNING
          id,
          name,
          is_admin,
          last_login
      `, [user.name, password_hash, user.is_admin])
    })

    return UserSchema.parse(res)
  }

  async update_user(given_id: string, updated_user: NewOrUpdatedUser): Promise<User> {
    if (!updated_user.name.length) throw new ValidationAppError('Name cannot be empty')
    let res: unknown

    if (updated_user.password != undefined && updated_user.password.length) {
      const password_hash = await hash_password(updated_user.password)
      if (password_hash == undefined) throw new ValidationAppError('Error hashing password')
      res = await this.db.txIf(async (t) => {
        return await t.one<unknown>(`
          UPDATE users
          SET name = $2, password = $3, is_admin = $4
          WHERE id = $1
          RETURNING
            id,
            name,
            is_admin,
            last_login
        `, [given_id, updated_user.name, password_hash, updated_user.is_admin])
      })
    }

    else {
      res = await this.db.txIf(async (t) => {
        return await t.one<unknown>(`
          UPDATE users
            SET name = $2, is_admin = $3
            WHERE id = $1
            RETURNING
              id,
              name,
              is_admin,
              last_login
        `, [given_id, updated_user.name, updated_user.is_admin])
      })
    }

    return UserSchema.parse(res)
  }

  async authenticate(given_name: string, given_password: string): Promise<User | undefined> {
    if (!given_name.length) throw new ValidationAppError('Name cannot be empty')
    if (!given_password.length) throw new ValidationAppError('Password cannot be empty')

    let user_result: AuthenticableUser | undefined
    try {
      const res = await this.db.oneOrNone<unknown>(`
        SELECT id, name, password, is_admin, last_login FROM users WHERE name = $1
      `, given_name)
      user_result = res != undefined ? AuthenticableUserSchema.parse(res) : undefined
    }
    catch (ex) {
      console.error(ex)
    }

    if (user_result == undefined) {
      // Hashing of the password is done even though the user was not found to reduce the risk of timing attacks
      await hash_password(given_password)
      return
    }

    const verified = await verify_password(given_password, user_result.password)
    if (!verified) return

    await this.db.txIf(async (t) => {
      await t.none('UPDATE users SET last_login = NOW() WHERE id = $1', user_result.id)
    })

    return UserSchema.parse(user_result)
  }

  async list_users(): Promise<User[]> {
    const res = await this.db.any<unknown>('SELECT id, name, is_admin, last_login FROM users')
    return res.map(r => UserSchema.parse(r))
  }

  async delete_user(given_id: string) {
    await this.db.txIf(async (t) => {
      await t.none('DELETE FROM users WHERE id = $1', given_id)
    })
  }

  async get_user(given_id: string): Promise<User> {
    const res = await this.db.one<unknown>('SELECT id, name, is_admin, last_login FROM users WHERE id = $1', given_id)
    return UserSchema.parse(res)
  }
}
