<template>
  <div class="flex flex-col gap-1">
    <div class="self-end flex gap-1">
      <Button
        :label="$t('cmp.viewer.common.eventList.openAllComments')"
        size="small"
        outlined
        @click="openAllComments"
      >
        <template #icon>
          <AppIcon icon-name="expandAll" />
        </template>
      </Button>
      <Button
        :label="$t('cmp.viewer.common.eventList.closeAllComments')"
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
              <strong>{{ $t('cmp.viewer.common.eventList.date') }} :</strong> {{ event.date ? $d(event.date, { dateStyle: 'short' }) : $t('cmp.viewer.common.eventList.noDate') }}
            </p>

            <p v-if="event.details && event.details.length > 0">
              <strong>{{ $t('cmp.viewer.common.eventList.comment') }} :</strong>
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
