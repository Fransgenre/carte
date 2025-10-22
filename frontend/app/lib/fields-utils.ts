import type { EntityOrCommentData, EntityOrCommentEvent, FieldContentMap, FormField } from '~/lib'

export function getFieldData(data: unknown, field: FormField) {
  switch (field.field_type) {
    case 'SingleLineText': return getSingleLineTextFieldData(data)
    case 'MultiLineText': return getMultiLineTextFieldData(data)
    case 'RichText': return getRichTextFieldData(data)
    case 'Number': return getNumberFieldData(data)
    case 'Boolean': return getBooleanFieldData(data)
    case 'DiscreteScore': return getDiscreteScoreFieldData(data)
    case 'Date': return getDateFieldData(data)
    case 'EnumSingleOption': return getEnumSingleOptionFieldData(data)
    case 'EnumMultiOption': return getEnumMultiOptionFieldData(data)
    case 'EventList': return getEventListFieldData(data)
  }
}

export function getSingleLineTextFieldData(data: unknown): FieldContentMap['SingleLineText'] | undefined {
  return coerceToString(data)
}

export function getMultiLineTextFieldData(data: unknown): FieldContentMap['MultiLineText'] | undefined {
  return coerceToString(data)
}

export function getRichTextFieldData(data: unknown): FieldContentMap['RichText'] | undefined {
  return coerceToString(data)
}

export function getNumberFieldData(data: unknown): FieldContentMap['Number'] | undefined {
  return coerceToNumber(data)
}

export function getBooleanFieldData(data: unknown): FieldContentMap['Boolean'] | undefined {
  return coerceToBoolean(data)
}

export function getDiscreteScoreFieldData(data: unknown): FieldContentMap['DiscreteScore'] | undefined {
  return coerceToNumber(data)
}

export function getDateFieldData(data: unknown): FieldContentMap['Date'] | undefined {
  return coerceToDate(data)
}

export function getEnumSingleOptionFieldData(data: unknown): FieldContentMap['EnumSingleOption'] | undefined {
  return coerceToString(data)
}

export function getEnumMultiOptionFieldData(data: unknown): FieldContentMap['EnumMultiOption'] | undefined {
  return coerceToStringArray(data)
}

export function getEventListFieldData(data: unknown): FieldContentMap['EventList'] | undefined {
  return coerceToEntityOrCommentEventArray(data)
}

function coerceToString(data: unknown): string | undefined {
  if (data == undefined) return undefined
  if (Array.isArray(data)) return coerceToString(data[0])
  if (typeof data == 'string' || typeof data == 'number' || typeof data == 'bigint' || typeof data == 'boolean') return `${data}`
}

function coerceToNumber(data: unknown): number | undefined {
  if (data == undefined) return undefined
  if (Array.isArray(data)) return coerceToNumber(data[0])
  if (typeof data == 'string' || typeof data == 'number' || typeof data == 'bigint' || typeof data == 'boolean') {
    const number = Number(data)
    if (Number.isFinite(number)) return number
  }
}

function coerceToBoolean(data: unknown): boolean | undefined {
  if (data == undefined) return undefined
  if (Array.isArray(data)) return coerceToBoolean(data[0])
  if (typeof data == 'string') return !['false', '', '0'].includes(data)
  if (typeof data == 'number' || typeof data == 'bigint' || typeof data == 'boolean') return Boolean(data)
}

function coerceToDate(data: unknown): Date | undefined {
  if (data == undefined) return undefined
  if (Array.isArray(data)) return coerceToDate(data[0])
  if (typeof data == 'string' || typeof data == 'number' || data instanceof Date) {
    const date = new Date(data)
    if (Number.isFinite(date.getTime())) return date
  }
}

function coerceToEntityOrCommentEvent(data: unknown): EntityOrCommentEvent | undefined {
  if (data == undefined) return undefined
  if (Array.isArray(data)) return coerceToEntityOrCommentEvent(data[0])
  if (typeof data == 'object') {
    const record = data as Record<string, unknown>
    const date = coerceToDate(record.date)
    const type = coerceToString(record.type)
    const details = coerceToString(record.details)
    return { ...structuredClone(data), date, type, details }
  }
}

function coerceToStringArray(data: unknown): string[] | undefined {
  if (data == undefined) return undefined
  if (Array.isArray(data)) {
    return data.reduce((acc: string[], value: unknown) => {
      const string = coerceToString(value)
      acc.push(string ?? `${value}`)
      return acc
    }, [])
  }
  const string = coerceToString(data)
  if (string != undefined) return [string]
}

function coerceToEntityOrCommentEventArray(data: unknown): EntityOrCommentEvent[] | undefined {
  if (data == undefined) return undefined
  if (Array.isArray(data)) {
    return data.reduce((acc: EntityOrCommentEvent[], value: unknown) => {
      const event = coerceToEntityOrCommentEvent(value)
      if (event != undefined) {
        acc.push(event)
      }
      else {
        if (value == undefined || typeof value != 'object')
          acc.push({ date: undefined, type: undefined, details: undefined })
        else
          acc.push({ ...structuredClone(value), date: undefined, type: undefined, details: undefined })
      }
      return acc
    }, [])
  }
  const event = coerceToEntityOrCommentEvent(data)
  if (event != undefined) return [event]
}

export function getFieldsData(data: unknown, fields: FormField[]): EntityOrCommentData | undefined | null {
  if (data === undefined) return undefined
  if (data === null) return null
  if (typeof data == 'object') {
    const record = data as Record<string, unknown>
    return Object.keys(record).reduce((acc: EntityOrCommentData, key: string) => {
      const value = record[key]
      const field = fields.find(f => f.key == key)
      const safeValue = field ? getFieldData(value, field) : undefined
      if (safeValue != undefined) {
        // The field exists and has a safe value, use it
        acc[key] = safeValue
      }
      else {
        // Either the field does not exist, either it does not have a safe value
        // Keep the unsafe value anyway, in order not to lose anything
        if (value == undefined || typeof value != 'object')
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          acc[key] = value as any
        else
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          acc[key] = structuredClone(value) as any
      }
      return acc
    }, {})
  }
}

type HasData = { data: unknown }

export function formatEntityFieldsData<T extends HasData>(entity: T, entityFields: FormField[]): T {
  entity.data = getEntityFieldsData(entity, entityFields)
  return entity
}

export function getEntityFieldsData<T extends HasData>(entity: T, entityFields: FormField[]) {
  return getFieldsData(entity.data, entityFields)
}

export function formatCommentFieldsData<T extends HasData>(comment: T, commentFields: FormField[]): T {
  comment.data = getCommentFieldsData(comment, commentFields)
  return comment
}

export function getCommentFieldsData<T extends HasData>(comment: T, commentFields: FormField[]) {
  return getFieldsData(comment.data, commentFields)
}

export function formatCommentsFieldsData<T extends HasData>(comments: Array<T>, commentFields: FormField[]): Array<T> {
  comments.forEach(comment => comment.data = getCommentFieldsData(comment, commentFields))
  return comments
}
