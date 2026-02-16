<template>
  <Fieldset
    v-for="field in fieldsToDisplay()"
    :key="field.key"
    :legend="field.display_name"
  >
    <div
      v-if="(field.field_type == 'SingleLineText' || field.field_type == 'MultiLineText')"
      class="text-field"
    >
      <div v-if="isUrlField(field.key)">
        <a
          :href="getKeyValue(field.key)"
          target="_blank"
          rel="noopener noreferrer"
          class="underline text-blue-500 cursor-pointer"
        >
          {{ extractHostnameFromUrl(getKeyValue(field.key)) }}
        </a>
      </div>

      <!-- eslint-disable vue/no-v-html -->
      <p
        v-else
        v-html="getDataAsEscapedString(field.key)"
      />
    </div>

    <div v-else-if="field.field_type == 'RichText'">
      <p
        class="rich-text-content"
        v-html="getDataAsEscapedString(field.key)"
      />
    </div>

    <div v-else-if="field.field_type == 'Date'">
      <p>
        {{ new Date(getKeyValue(field.key)).toLocaleDateString() }}
      </p>
    </div>

    <div v-else-if="field.field_type == 'Number'">
      <p>
        {{ getKeyValue(field.key) }}
      </p>
    </div>

    <div v-else-if="field.field_type == 'Boolean'">
      <p>
        {{ getKeyValue(field.key) ? '✅ Oui' : '❌ Non' }}
      </p>
    </div>

    <div v-else-if="field.field_type == 'EnumSingleOption'">
      <p>
        {{ getValueForEnum(field.key, getKeyValue(field.key)) }}
      </p>
    </div>

    <div v-else-if="field.field_type == 'EnumMultiOption'">
      <Tag
        v-for="value in getKeyValue(field.key)"
        :key="value"
        class="mr-1 mb-1"
      >
        {{ getValueForEnum(field.key, value) }}
      </Tag>
    </div>

    <div v-else-if="field.field_type == 'DiscreteScore'">
      <ViewerCommonScoreJauge
        :score="getKeyValue(field.key)"
      />
    </div>

    <div v-else-if="field.field_type == 'EventList'">
      <ViewerCommonEventList :events="getSortedEventList(field.key)" />
    </div>
  </Fieldset>
</template>

<script setup>
import { purify_strict } from '~/lib/dompurify'

// eslint-disable-next-line vue/require-prop-types
const props = defineProps(['fields', 'data'])

function getSortedEventList(fieldKey) {
  return getKeyValue(fieldKey).map(e => eventWithMetadata(e, fieldKey)).sort((a, b) => {
    if (a.date == null && b.date == null) return 0
    if (a.date == null) return 1
    if (b.date == null) return -1
    return a.date - b.date
  })
}

function eventWithMetadata(event, fieldKey) {
  const field = props.fields.find(f => f.key === fieldKey)
  const field_type_metadata = field.field_type_metadata
  const current_metadata = field_type_metadata?.event_types?.find(m => m.value === event.type)

  return {
    ...event,
    date: event?.date ? new Date(event.date) : null,
    title: current_metadata?.label,
    severity: eventColorToSeverity(current_metadata?.color),
  }
}

function eventColorToSeverity(color) {
  switch (color) {
    case 'neutral':
      return 'secondary'
    case 'success':
      return 'success'
    case 'fail':
      return 'danger'
    case 'warning':
      return 'warning'
    default:
      return 'secondary'
  }
}

function isUrlField(key) {
  const field = props.fields.find(f => f.key === key)
  return field.field_type_metadata?.format === 'url'
}

function getDataAsEscapedString(key) {
  const txt = props.data[key] ?? ''
  return purify_strict(txt)
}

function extractHostnameFromUrl(url) {
  try {
    const u = new URL(url)
    const hostname = u.hostname
    return hostname.startsWith('www.') ? hostname.substring(4) : hostname
  }
  catch {
    return url
  }
}

function hasRealValue(value) {
  if (value === undefined || value === null) return false
  if (typeof value == 'string') return value.trim() != ''
  if (typeof value == 'number') return !Number.isNaN(value)
  if (Array.isArray(value)) return value.length > 0
  return true
}

function fieldsToDisplay() {
  const fields = props.fields.slice()
    .sort((a, b) => a.display_weight - b.display_weight)
    .filter(f => hasKey(f.key))
    .filter(f => hasRealValue(getKeyValue(f.key)))
    .filter(f => !(
      f.field_type === 'EnumSingleOption'
      && f.field_type_metadata?.options.find(o => o.value == getKeyValue(f.key))?.hidden),
    )

  return fields
}

function getKeyValue(key) {
  return props.data[key]
}

function getValueForEnum(key, value) {
  const field = props.fields.find(f => f.key === key)
  return field.field_type_metadata.options.find(o => o.value === value)?.label
}

function hasKey(key) {
  return props.data[key] !== undefined
    && props.data[key] !== null
}
</script>

<style scoped>
  .text-field p {
    white-space: pre-wrap;
  }
</style>
