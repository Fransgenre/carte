<template>
  <Message
    :severity="severity"
  >
    <template #container>
      <div class="p-message-content flex justify-start items-center gap-4">
        <div
          v-if="iconName != undefined"
          class="p-message-icon"
        >
          <AppIcon :icon-name="iconName" />
        </div>
        <div class="p-message-text flex-1">
          {{ admonition.text }}
        </div>
      </div>
    </template>
  </Message>
</template>

<script setup lang="ts">
import type { Admonition } from '~/lib'

const props = defineProps<{
  admonition: Admonition
}>()

const severity = computed(() => {
  switch (props.admonition.type) {
    case 'neutral':
      return 'secondary'
    case 'info':
      return 'info'
    case 'success':
      return 'success'
    case 'warning':
      return 'warn'
    case 'fail':
      return 'error'
    default:
      return 'secondary'
  }
})

const iconName = computed(() => {
  switch (props.admonition.type) {
    case 'neutral':
      return 'information'
    case 'info':
      return 'informationCircle'
    case 'success':
      return 'checkCircle'
    case 'warning':
      return 'warning'
    case 'fail':
      return 'alertCircle'
    default:
      return 'information'
  }
})
</script>
