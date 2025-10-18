<template>
  <div class="map_container">
    <ol-map
      ref="mapRef"
      class="map"
      :load-tiles-while-animating="true"
      :load-tiles-while-interacting="true"
      @singleclick="(event: MapBrowserEvent) => emits('update:modelValue', event.coordinate)"
    >
      <ol-view
        projection="EPSG:3857"
      />

      <ol-tile-layer>
        <ol-source-osm />
      </ol-tile-layer>

      <ol-overlay
        v-if="props.modelValue"
        :position="props.modelValue"
        :stop-event="true"
      >
        <ViewerMapMarker
          :callback-item="null"
          :width="24"
          :height="38"
          :highlighted="false"
          :border-color="props.borderColor"
          :fill-color="props.fillColor"
          :icon-hash="props.iconHash"
        />
      </ol-overlay>
    </ol-map>
  </div>
</template>

<script setup lang="ts">
import type { MapBrowserEvent } from 'ol'
import type Map from 'ol/Map'
import type { Coordinate } from 'ol/coordinate'

const props = defineProps<{
  modelValue: Coordinate | undefined
  center: Coordinate
  zoom: number
  borderColor?: string | undefined
  fillColor?: string | undefined
  iconHash?: string | null | undefined
}>()

const emits = defineEmits<{
  'update:modelValue': [Coordinate]
}>()

const mapRef = ref<{ map: Map }>()

onMounted(resetZoom)
watch([
  () => props.zoom,
], () => resetZoom(true))

function resetZoom(animated: boolean = false) {
  const map = mapRef.value?.map
  if (!map) return
  const view = map.getView()

  view.setMinZoom(Math.min(2, props.zoom))
  view.setMaxZoom(Math.max(20, props.zoom))
  if (animated)
    view.animate({ zoom: props.zoom })
  else
    view.setZoom(props.zoom)
}

onMounted(resetCenter)
watch([
  () => props.center,
  () => props.modelValue,
], () => resetCenter(true))

function resetCenter(animated: boolean = false) {
  const map = mapRef.value?.map
  if (!map) return
  const view = map.getView()

  if (animated)
    view.animate({ center: props.modelValue || props.center })
  else
    view.setCenter(props.modelValue || props.center)
}
</script>

<style scoped>
.map_container,
.map {
  width: 100%;
  height: 100%;
}
</style>
