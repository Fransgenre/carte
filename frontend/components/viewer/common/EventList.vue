<template>
  <div class="flex flex-col gap-1">
    <div class="self-end flex gap-1">
      <ToggleButton
        on-label="Tout replier"
        off-label="Tout déplier"
        :model-value="openComments.length !== 0"
        @update:model-value="toggleComments"
      >
        <template #icon="{ value }">
          <AppIcon :icon-name="value ? 'collapseAll' : 'expandAll'" />
        </template>
      </ToggleButton>
    </div>
    <Accordion
      v-model:value="openComments"
      multiple
    >
      <template
        v-for="(event, index) in displayedEvents"
        :key="event"
      >
        <AccordionPanel
          :value="index"
        >
          <AccordionHeader>
            <Tag
              :severity="event.severity"
              :value="event.title && event.title.length ? event.title : 'Evènement inconnu'"
            />
          </AccordionHeader>

          <AccordionContent>
            <p>
              <strong>Date :</strong> {{ event.date ? event.date.toLocaleDateString() : 'Date inconnue' }}
            </p>

            <p v-if="event.details && event.details.length > 0">
              <strong>Commentaire :</strong>
              <br>
              {{ event.details }}
            </p>
          </AccordionContent>
        </AccordionPanel>
      </template>
    </Accordion>
  </div>
</template>

<script lang="ts" setup>
import type { TagProps } from 'primevue/tag'

type EventProp = { date: Date, severity: TagProps['severity'], title: string, details: string }

const props = defineProps<{ events: EventProp[] }>()

const displayedEvents = computed(() => props.events.filter(e => !isEventEmpty(e)))

function isEventEmpty(eventAndMetadata: EventProp) {
  return !(eventAndMetadata.date || eventAndMetadata.title?.length || eventAndMetadata.details?.length)
}

const openComments = ref<number[]>([])

function toggleComments() {
  if (openComments.value.length) {
    openComments.value = []
  }
  else {
    openComments.value = displayedEvents.value.map((_, index) => index)
  }
}
</script>
