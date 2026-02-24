import type { NewOrUpdateTag, Tag } from '~~/shared/models'
import type { IDbLike } from '../lib/server-state'
import { TagSchema } from '~~/shared/models'
import { ValidationAppError } from '../lib/errors'

export default class TagRepository {
  db: IDbLike

  constructor(db: IDbLike) {
    this.db = db
  }

  async create_tag(tag: NewOrUpdateTag): Promise<Tag> {
    const res = await this.db.txIf(async (t) => {
      return await t.one<unknown>(`
        INSERT INTO tags (title, is_filter, is_primary_filter,
          filter_description, default_filter_status, fill_color, border_color)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, title, is_filter, is_primary_filter, filter_description,
          default_filter_status, version, fill_color, border_color
      `, [tag.title, tag.is_filter, tag.is_primary_filter, tag.filter_description, tag.default_filter_status, tag.fill_color, tag.border_color])
    })
    return TagSchema.parse(res)
  }

  async update_tag(given_id: string, tag: NewOrUpdateTag): Promise<Tag> {
    if (tag.version == undefined) throw new ValidationAppError('Version is required')
    const res = await this.db.txIf(async (t) => {
      return await t.one<unknown>(`
        UPDATE tags
        SET title = $2, is_filter = $3, is_primary_filter = $4, filter_description = $5,
          default_filter_status = $6, version = $7, fill_color = $8, border_color = $9
        WHERE id = $1
        RETURNING id, title, is_filter, is_primary_filter, filter_description,
          default_filter_status, version, fill_color, border_color
      `, [given_id, tag.title, tag.is_filter, tag.is_primary_filter, tag.filter_description, tag.default_filter_status, tag.version, tag.fill_color, tag.border_color])
    })
    return TagSchema.parse(res)
  }

  async delete_tag(given_id: string) {
    await this.db.txIf(async (t) => {
      await t.none('DELETE FROM tags WHERE id = $1', given_id)
    })
  }

  async get_tag(given_id: string): Promise<Tag> {
    const res = await this.db.one<unknown>(`
      SELECT id, title, is_filter, is_primary_filter, filter_description,
        default_filter_status, version, fill_color, border_color
      FROM tags
      WHERE id = $1
    `, given_id)
    return TagSchema.parse(res)
  }

  async list_tags(): Promise<Tag[]> {
    const res = await this.db.any<unknown>(`
      SELECT id, title, is_filter, is_primary_filter, filter_description,
        default_filter_status, version, fill_color, border_color
      FROM tags
    `)
    return res.map(r => TagSchema.parse(r))
  }

  async list_tags_except(excluded_ids: string[]): Promise<Tag[]> {
    const res = await this.db.any<unknown>(`
      SELECT id, title, is_filter, is_primary_filter, filter_description,
        default_filter_status, version, fill_color, border_color
      FROM tags
      WHERE NOT (id = ANY($1::uuid[]))
    `, [excluded_ids])
    return res.map(r => TagSchema.parse(r))
  }
}
