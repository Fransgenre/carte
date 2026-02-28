<template>
  <Select
    :id="`${id}_select`"
    :model-value="modelValue?.type"
    :options="types"
    option-label="label"
    option-value="value"
    :placeholder="typeLabel ?? `Type du message${!optional ? ' *' : ''}`"
    :variant="typeVariant ? 'filled': 'outlined'"
    :invalid="hasEditedType && !optional && !modelValue?.type"
    @update:model-value="(value: AdmonitionType | undefined) => onTypeUpdate(value)"
  />
  <Textarea
    :id="id"
    :model-value="modelValue?.text"
    :placeholder="contentLabel ?? `Contenu du message${!optional ? ' *' : ''}`"
    :variant="contentVariant ? 'filled': 'outlined'"
    :invalid="hasEditedText && !optional && (modelValue?.text == undefined || modelValue.text == '')"
    @update:model-value="(value: string) => onTextUpdate(value)"
  />
</template>

<script setup lang="ts">
import type { AdmonitionType } from '~/lib'

type AdmonitionFieldModel = {
  type: AdmonitionType | null | undefined
  text: string | null | undefined
}

const types = [
  { label: 'Message neutre', value: 'neutral' },
  { label: 'Message d\'information', value: 'info' },
  { label: 'Message de succès', value: 'success' },
  { label: 'Message critique', value: 'fail' },
  { label: 'Message d\'avertissement', value: 'warning' },
]

const props = defineProps<{
  id: string
  contentLabel?: string
  typeLabel?: string
  modelValue: AdmonitionFieldModel | undefined
  optional?: boolean
  contentVariant?: boolean
  typeVariant?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [AdmonitionFieldModel]
}>()

const hasEditedType = ref(false)
function onTypeUpdate(value?: AdmonitionType) {
  hasEditedType.value = true
  emit('update:modelValue', { text: props.modelValue?.text, type: value })
}

const hasEditedText = ref(false)
function onTextUpdate(value: string) {
  hasEditedText.value = true
  emit('update:modelValue', { text: value, type: props.modelValue?.type })
}
</script>
