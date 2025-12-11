<template>
  <div>
    <form @submit.prevent="searchNominatim">
      <InputGroup class="mb-6 mt-2">
        <InputText
          v-model="search"
          placeholder="Rechercher une adresse"
        />
        <Button
          v-tooltip.bottom="'Lancer la recherche'"
          aria-label="Lancer la recherche"
          severity="primary"
          type="submit"
        >
          <template #icon>
            <AppIcon icon-name="search" />
          </template>
        </Button>
      </InputGroup>
    </form>

    <div v-if="searched && !nominatimResult">
      <Message severity="error">
        Aucun résultat trouvé
      </Message>
    </div>
    <div v-else-if="nominatimResult">
      <small class="text-secondary block mb-1">{{ nominatimResult.display_name }}</small>
    </div>

    <div v-if="coordinate">
      <CoordinatePickerMap
        class="!h-80"
        :center="transformedCenter"
        :zoom="14"
        :model-value="transformedCoordinate"
        @update:model-value="value => onMapClick(value)"
      />
      <small class="text-secondary text-center block mt-1">Cliquer sur la carte pour déplacer le point au bon endroit si nécessaire.</small>
    </div>

    <div v-if="coordinate">
      <AdminInputTextField
        id="address_name"
        v-model="name"
        class="mt-6"
        label="Intitulé complet de l'adresse"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Coordinate } from 'ol/coordinate'
import { transform } from 'ol/proj'
import type { UnprocessedLocation } from '~/lib'
import { freeFormSearch } from '~/lib/nominatim'
import type { Result } from '~/lib/nominatim'

const props = defineProps<{
  modelValue: UnprocessedLocation | undefined
}>()

const emits = defineEmits<{
  'update:modelValue': [UnprocessedLocation | undefined]
}>()

const search = ref('')
const nominatimResult = ref<Result | undefined>()
const searched = ref(false)
const coordinate = ref<Coordinate | undefined>(props.modelValue ? [props.modelValue.long, props.modelValue.lat] : undefined)
const name = ref<string>(props.modelValue ? props.modelValue.plain_text : '')

const transformedCoordinate = computed(() => {
  if (!coordinate.value) return undefined

  return transform([
    coordinate.value[0], coordinate.value[1],
  ], 'EPSG:4326', 'EPSG:3857')
})

const transformedCenter = computed(() => transformedCoordinate.value || [0, 0])

async function searchNominatim() {
  const query = search.value
  const results = await freeFormSearch(query)
  searched.value = true

  if (results[0]) {
    nominatimResult.value = results[0]
    coordinate.value = [results[0].lon, results[0].lat]
    name.value = query
  }
  else {
    nominatimResult.value = undefined
    coordinate.value = undefined
    name.value = ''
  }
}

function onMapClick(c: Coordinate) {
  coordinate.value = transform(c, 'EPSG:3857', 'EPSG:4326')
}

watch([
  () => coordinate.value,
  () => name.value,
], () => {
  if (coordinate.value && name.value.trim() != '')
    emits('update:modelValue', { lat: coordinate.value[1]!, long: coordinate.value[0]!, plain_text: name.value.trim() })
  else
    emits('update:modelValue', undefined)
})
</script>
