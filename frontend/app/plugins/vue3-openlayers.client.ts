import OpenLayersMap from 'vue3-openlayers'
import { defineNuxtPlugin } from '#app'
import 'ol/ol.css'
import 'vue3-openlayers/vue3-openlayers.css'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(OpenLayersMap)
})
