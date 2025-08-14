<template>
  <div class="h-full flex flex-col">
    <ViewerNavbar
      :token="token"
      :show-map-button="false"
      :show-search-button="true"
      @filters-changed="refreshMap"
      @location-chosen="goToGpsCoordinates"
      @entity-chosen="goToEntity"
    />
    <div
      ref="containerRef"
      class="h-full"
    >
      <ViewerMap
        ref="mapRef"
        class="h-full"
        :center="state.startCenter()"
        :zoom="state.startZoom()!"
        :entities="state.entities"
        :clusters="state.clusters"
        @entity-click="(e: DisplayableCachedEntity) => state.selectedCachedEntity(e)"
      />
    </div>

    <Drawer
      v-model:visible="state.hasActiveEntity"
      :modal="false"
      :dismissable="false"
      :style="fitContainer()"
      position="left"
      class="!w-full sm:!w-[30rem]"
      :pt="{ mask: '!w-full sm:!w-auto', pcCloseButton: 'shrink-0' }"
    >
      <template #header>
        <div
          v-if="state.activeEntity"
          class="flex items-center justify-start gap-2"
        >
          <CategoryTag
            :category="state.activeEntity!.category"
          />
          <div class="grow font-bold text-lg m-0">
            {{ state.activeEntity!.entity.display_name }}
          </div>
          <div class="grow" />
        </div>
      </template>
      <ViewerCommentAddForm
        v-if="state.permissions?.can_add_comment"
        :family="state.activeEntity!.family"
        :entity="state.activeEntity!.entity"
      />
      <ViewerCommonEntityDisplayer
        v-if="state.activeEntity"
        :entity="state.activeEntity!"
        :categories="state.categories"
        @entity-selected="displayEntityId"
      />
    </Drawer>

    <StartPopup />

    <Toast />
  </div>
</template>

<script setup lang="ts">
import type { Coordinate } from 'ol/coordinate'
import type { DisplayableCachedEntity, ViewerSearchedCachedEntity } from '~/lib'
import state from '~/lib/viewer-state'
import ViewerMap from '~/components/viewer/Map.vue'

const toast = useToast()

// Init state with url token
const route = useRoute()
const token = route.params.token as string
try {
  await state.bootstrapWithToken(token)
  if (!state.permissions?.can_access_entity)
    throw 'Unauthorized'
}
catch {
  toast.add({
    severity: 'error',
    summary: 'Erreur',
    detail: 'Impossible de charger la carte',
    life: 3000,
  })
  if (state.redirectUrl) {
    window.location.href = state.redirectUrl
  }
  else {
    throw createError({
      statusCode: 404,
      statusMessage: 'Page Not Found',
      fatal: true,
    })
  }
}

// Center and display the given entity or location using the given zoom level if provided in the url query
onMounted(async () => {
  let customStartCenter: Coordinate | undefined = undefined
  if (route.query.lat && route.query.lon) {
    if (typeof route.query.lat == 'string' && typeof route.query.lon == 'string') {
      const lat = Number(route.query.lat), lon = Number(route.query.lon)
      const isLat = ! Number.isNaN(lat) && lat >= -90 && lat <= 90
      const isLon = ! Number.isNaN(lon) && lon >= -180 || lon <= 180
      if (isLat && isLon) customStartCenter = [lon, lat]
    }
  }

  let customStartZoom: number | undefined = undefined
  if (route.query.zoom) {
    if (typeof route.query.zoom == 'string') {
      const zoom = parseInt(route.query.zoom, 10)
      if (! Number.isNaN(zoom) && zoom >= 0 && zoom <= 19) customStartZoom = zoom
    }
  }

  let customStartEntityId: string | undefined = undefined
  if (route.query.ent) {
    if (typeof route.query.ent == 'string') {
      const entityId = route.query.ent
      customStartEntityId = entityId
    }
  }

  if (customStartEntityId) {
    // Custom entity provided, try to display it
    await displayEntityId(customStartEntityId)
    const entity = state.activeEntity?.entity

    if (entity?.id == customStartEntityId) {
      // The entity is loaded and its infos are displayed
      // It might be invisible on the map depending on the current family and filter settings so we might have to change them

      // Ensure the right family is selected
      state.activeFamily = state.families.find((family) => family.id == entity.family_id) || state.activeFamily

      // Ensure the right category is displayed
      state.filteringCategories.forEach((category) => {
        if (category.id == entity.category_id) category.active = true
      })

      // Ensure the right tags are displayed
      state.filteringTags.forEach((tag) => {
        if (entity.tags.includes(tag.id)) tag.active = null
      })
    }
    
    if (entity?.id == customStartEntityId && entity?.locations.length) {
      // The entity is loaded, its infos are displayed and it has a location
      // Go to the entity location optionally using the given zoom
      goToGpsCoordinates([entity.locations[0].long, entity.locations[0].lat], customStartZoom)
    }
    else if(customStartCenter) {
      // Either the entity isn't loaded or it doesn't have a location, fallback to the custom location (and optional zoom) provided
      goToGpsCoordinates(customStartCenter, customStartZoom)
    }
  }

  else if(customStartCenter) {
    // Custom location provided, go to it, optionally using the given zoom
    goToGpsCoordinates(customStartCenter, customStartZoom)
  }
})

const mapRef = ref<typeof ViewerMap>()

// Compute the dynamic positioning of the sidebar
const containerRef = ref<HTMLElement | null>(null)
function fitContainer() {
  if (containerRef.value) {
    const height = `${containerRef.value.clientHeight}px`
    const top = containerRef.value.getBoundingClientRect().top + 'px'
    return { height, top, position: 'absolute' }
  }
  return {} // Return default/fallback styles if needed
}

function goToGpsCoordinates(coordinates: Coordinate, zoom=13) {
  mapRef.value?.goToGpsCoordinates(coordinates, zoom)
}

async function refreshMap() {
  await mapRef.value?.forceRefresh()
}

async function displayEntityId(entityId: string) {
  try {
    await state.selectEntity(entityId)
  }
  catch {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: `Impossible de charger l'entité sélectionnée`,
      life: 3000,
    })
  }
}

async function goToEntity(entity: ViewerSearchedCachedEntity, zoom=14) {
  try {
    await state.selectEntity(entity.entity_id)
  }
  catch {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: `Impossible de charger l'entité sélectionnée`,
      life: 3000,
    })
  }
  if (entity.locations.length > 0) {
    const location = entity.locations[0]

    mapRef.value?.goToWebMercatorCoordinates([
      location.x,
      location.y,
    ], zoom)
  }
}
</script>
