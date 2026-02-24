import type { IDbLike } from '../lib/server-state'
import type { Icon } from '~~/shared/models'
import { IconSchema } from '~~/shared/models'

export default class IconRepository {
  db: IDbLike

  constructor(db: IDbLike) {
    this.db = db
  }

  async get_icon(hash: string): Promise<Icon> {
    const res = await this.db.one<unknown>('SELECT data, http_mime_type FROM icons WHERE hash = $1', hash)
    return IconSchema.parse(res)
  }

  async delete_for_family(family_id: string): Promise<void> {
    await this.db.txIf(async (t) => {
      await t.none('DELETE FROM icons WHERE id = (SELECT icon_id FROM families WHERE id = $1)', family_id)
    })
  }

  async delete_for_category(category_id: string): Promise<void> {
    await this.db.txIf(async (t) => {
      await t.none('DELETE FROM icons WHERE id = (SELECT icon_id FROM categories WHERE id = $1)', category_id)
    })
  }

  async upsert_family(family_id: string, data: Buffer, http_mime_type: string): Promise<void> {
    await this.db.txIf(async (t) => {
      await t.none('SELECT upsert_row_icon($1, $2, $3, $4)', [family_id, data, http_mime_type, 'families'])
    })
  }

  async upsert_category(category_id: string, data: Buffer, http_mime_type: string): Promise<void> {
    await this.db.txIf(async (t) => {
      await t.none('SELECT upsert_row_icon($1, $2, $3, $4)', [category_id, data, http_mime_type, 'categories'])
    })
  }
}
