<template>
  <div class="flex flex-col gap-2">
    <label for="tag_id">Tags</label>
    <div class="flex flex-wrap gap-1">
      <DisplayedTag
        v-for="tag_id in sortedModelValue"
        :key="tag_id"
        :tag="tagRecord[tag_id]"
      />
    </div>

    <MultiSelect
      id="tag_id"
      filter
      empty-filter-message="Aucun résultat trouvé"
      :model-value="sortedModelValue"
      :options="tags"
      placeholder="Sélectionner des tags"
      option-value="id"
      option-label="title"
      @update:model-value="updateValue"
    >
      <template #option="slotProps">
        <DisplayedTag :tag="slotProps.option" />
      </template>
    </MultiSelect>
    <small v-if="props.helperText">{{ props.helperText }}</small>
  </div>
</template>

<script setup lang="ts">
import type { Tag, TagRecord } from '~/lib'

const props = defineProps<{
  modelValue: string[] | undefined | null
  tags: Tag[]
  helperText?: string
}>()

const emit = defineEmits(['update:modelValue'])

function updateValue(value: string[] | undefined | null) {
  emit('update:modelValue', value)
}

const tagRecord = computed(() => {
  return props.tags.reduce((tags, tag) => {
    tags[tag.id] = tag
    return tags
  }, {} as TagRecord)
})

const sortedModelValue = computed(() => {
  const record = tagRecord.value
  if (props.modelValue === null || props.modelValue === undefined) return props.modelValue
  return [...props.modelValue].sort((a, b) => {
    const tagA = record[a], tagB = record[b]
    if (!tagA) return 1
    if (!tagB) return -1
    return tagA.title.localeCompare(tagB.title)
  })
})
</script>
