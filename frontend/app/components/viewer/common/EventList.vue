<template>
  <div class="flex flex-col gap-1">
    <div class="self-end flex gap-1">
      <Button
        label="Tout déplier"
        size="small"
        outlined
        @click="openAllComments"
      >
        <template #icon>
          <AppIcon icon-name="expandAll" />
        </template>
      </Button>
      <Button
        label="Tout replier"
        size="small"
        outlined
        @click="closeAllComments"
      >
        <template #icon>
          <AppIcon icon-name="collapseAll" />
        </template>
      </Button>
    </div>
    <Accordion
      v-model:value="openComments"
      multiple
    >
      <template
        v-for="(event, index) in displayedEvents"
        :key="index"
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

function openAllComments() {
  openComments.value = displayedEvents.value.map((_, index) => index)
}

function closeAllComments() {
  openComments.value = []
}
</script>
