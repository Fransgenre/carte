<template>
  <Tabs value="0">
    <TabList>
      <Tab value="0">
        Général
      </Tab>
      <Tab value="1">
        Popup
      </Tab>
      <Tab value="2">
        Carte - Initialisation
      </Tab>
      <Tab value="3">
        Carte - Source
      </Tab>
      <Tab value="4">
        Carte - Cluster
      </Tab>
      <Tab value="5">
        Mode Sécurisé
      </Tab>
    </TabList>
    <TabPanels>
      <TabPanel value="0">
        <form
          class="flex flex-col gap-4 max-w-[30rem] mx-6"
          @submit.prevent="onSave('general', editedConfig.general)"
        >
          <AdminInputTextField
            id="title"
            v-model="editedConfig.general.title"
            label="Titre"
            :variant="hasBeenEdited('general', 'title')"
          />

          <AdminInputTextField
            id="subtitle"
            v-model="editedConfig.general.subtitle"
            label="Sous-titre"
            :variant="hasBeenEdited('general', 'subtitle')"
          />

          <AdminInputTextField
            id="information"
            v-model="editedConfig.general.information"
            label="Information"
            :variant="hasBeenEdited('general', 'information')"
            text-length="editor"
          />

          <AdminInputTextField
            id="logo_url"
            v-model="editedConfig.general.logo_url"
            optional
            label="URL du logo"
            :variant="hasBeenEdited('general', 'logo_url')"
            :invalid="!isOptionValid({ group: 'general', name: 'logo_url' })"
          />

          <AdminInputSwitchField
            id="redirect_url_enabled"
            v-model="customRedirection"
            label="Rediriger les tokens invalides vers une URL personnalisée"
          />

          <AdminInputTextField
            v-if="customRedirection"
            id="redirect_url"
            v-model="editedConfig.general.redirect_url"
            label="URL de redirection"
            :variant="hasBeenEdited('general', 'redirect_url')"
            :invalid="!editedConfig.general.redirect_url || !validator.isURL(editedConfig.general.redirect_url)"
          />

          <span class="flex gap-1 justify-end">
            <Button
              label="Annuler"
              severity="secondary"
              :disabled="processingRequest"
              @click="onCancel('general')"
            />
            <Button
              v-if="state.is_admin"
              label="Réinitialiser"
              :disabled="processingRequest"
              @click="onDelete('general')"
            />
            <Button
              v-if="state.is_admin"
              label="Sauvegarder"
              type="submit"
              :disabled="processingRequest || !isOptionGroupValid('general')"
            />
          </span>
        </form>
      </TabPanel>

      <TabPanel value="1">
        <form
          class="flex flex-col gap-4 max-w-[30rem] mx-6"
          @submit.prevent="onSave('init_popup', editedConfig.init_popup)"
        >
          <AdminInputSwitchField
            id="popup_enabled"
            v-model="popupEnabled"
            label="Afficher un popup au lancement de l'application"
          />

          <AdminInputTextField
            v-if="popupEnabled"
            id="popup"
            v-model="editedConfig.init_popup.popup"
            label="Popup d'accueil"
            :variant="hasBeenEdited('init_popup', 'popup')"
            text-length="editor"
          />

          <AdminInputSwitchField
            v-if="popupEnabled"
            id="popup_check_enabled"
            v-model="popupCheckboxEnabled"
            label="Mettre une case à cocher dans le popup d'accueil"
          />

          <AdminInputTextField
            v-if="popupEnabled && popupCheckboxEnabled"
            id="popup"
            v-model="editedConfig.init_popup.popup_check_text"
            label="Texte accompagnant la case à cocher de la popup d'accueil"
            :variant="hasBeenEdited('init_popup', 'popup_check_text')"
          />

          <span class="flex gap-1 justify-end">
            <Button
              label="Annuler"
              severity="secondary"
              :disabled="processingRequest"
              @click="onCancel('init_popup')"
            />
            <Button
              v-if="state.is_admin"
              label="Réinitialiser"
              :disabled="processingRequest"
              @click="onDelete('init_popup')"
            />
            <Button
              v-if="state.is_admin"
              label="Sauvegarder"
              type="submit"
              :disabled="processingRequest || !isOptionGroupValid('init_popup')"
            />
          </span>
        </form>
      </TabPanel>

      <TabPanel value="2">
        <form
          class="flex flex-col gap-4 max-w-[30rem] mx-6"
          @submit.prevent="onSave('cartography_init', editedConfig.cartography_init)"
        >
          <AdminInputNumberField
            id="center_lat"
            v-model="editedConfig.cartography_init.center_lat"
            label="Latitude du Centre"
            :variant="hasBeenEdited('cartography_init', 'center_lat')"
          />

          <AdminInputNumberField
            id="center_lng"
            v-model="editedConfig.cartography_init.center_lng"
            label="Longitude du Centre"
            :variant="hasBeenEdited('cartography_init', 'center_lng')"
          />

          <AdminInputNumberField
            id="zoom"
            v-model="editedConfig.cartography_init.zoom"
            label="Niveau de Zoom"
            :variant="hasBeenEdited('cartography_init', 'zoom')"
          />

          <span class="flex gap-1 justify-end">
            <Button
              label="Annuler"
              severity="secondary"
              :disabled="processingRequest"
              @click="onCancel('cartography_init')"
            />
            <Button
              v-if="state.is_admin"
              label="Réinitialiser"
              :disabled="processingRequest"
              @click="onDelete('cartography_init')"
            />
            <Button
              v-if="state.is_admin"
              label="Sauvegarder"
              type="submit"
              :disabled="processingRequest || !isOptionGroupValid('cartography_init')"
            />
          </span>
        </form>
      </TabPanel>

      <TabPanel value="3">
        <form
          class="flex flex-col gap-4 max-w-[30rem] mx-6"
          @submit.prevent="onSave('cartography_source', editedConfig.cartography_source)"
        >
          <AdminInputTextField
            id="light_map_url"
            v-model="editedConfig.cartography_source.light_map_url"
            label="URL des tuiles de carte, thème clair"
            :variant="hasBeenEdited('cartography_source', 'light_map_url')"
          />

          <AdminInputTextField
            id="light_map_attributions"
            v-model="editedConfig.cartography_source.light_map_attributions"
            label="Attributions pour les tuiles de carte, thème clair"
            :variant="hasBeenEdited('cartography_source', 'light_map_attributions')"
          />

          <AdminInputTextField
            id="dark_map_url"
            v-model="editedConfig.cartography_source.dark_map_url"
            label="URL des tuiles de carte, thème sombre"
            :variant="hasBeenEdited('cartography_source', 'dark_map_url')"
          />

          <AdminInputTextField
            id="dark_map_attributions"
            v-model="editedConfig.cartography_source.dark_map_attributions"
            label="Attributions pour les tuiles de carte, thème sombre"
            :variant="hasBeenEdited('cartography_source', 'dark_map_attributions')"
          />

          <span class="flex gap-1 justify-end">
            <Button
              label="Annuler"
              severity="secondary"
              :disabled="processingRequest"
              @click="onCancel('cartography_source')"
            />
            <Button
              v-if="state.is_admin"
              label="Réinitialiser"
              :disabled="processingRequest"
              @click="onDelete('cartography_source')"
            />
            <Button
              v-if="state.is_admin"
              label="Sauvegarder"
              type="submit"
              :disabled="processingRequest || !isOptionGroupValid('cartography_source')"
            />
          </span>
        </form>
      </TabPanel>

      <TabPanel value="4">
        <form
          class="flex flex-col gap-4 max-w-[30rem] mx-6"
          @submit.prevent="onSave('cartography_cluster', editedConfig.cartography_cluster)"
        >
          <AdminInputNumberField
            id="characteristic_distance"
            v-model="editedConfig.cartography_cluster.characteristic_distance"
            label="Distance caractéristique"
            :variant="hasBeenEdited('cartography_cluster', 'characteristic_distance')"
          />

          <AdminInputNumberField
            id="declustering_speed"
            v-model="editedConfig.cartography_cluster.declustering_speed"
            label="Vitesse de dégroupement"
            :variant="hasBeenEdited('cartography_cluster', 'declustering_speed')"
          />

          <AdminInputNumberField
            id="minimal_cluster_size"
            v-model="editedConfig.cartography_cluster.minimal_cluster_size"
            label="Taille minimale du cluster"
            :variant="hasBeenEdited('cartography_cluster', 'minimal_cluster_size')"
          />

          <span class="flex gap-1 justify-end">
            <Button
              label="Annuler"
              severity="secondary"
              :disabled="processingRequest"
              @click="onCancel('cartography_cluster')"
            />
            <Button
              v-if="state.is_admin"
              label="Réinitialiser"
              :disabled="processingRequest"
              @click="onDelete('cartography_cluster')"
            />
            <Button
              v-if="state.is_admin"
              label="Sauvegarder"
              type="submit"
              :disabled="processingRequest || !isOptionGroupValid('cartography_cluster')"
            />
          </span>
        </form>
      </TabPanel>

      <TabPanel value="5">
        <form
          class="flex flex-col gap-4 max-w-[30rem] mx-6"
          @submit.prevent="onSave('safe_mode', editedConfig.safe_mode)"
        >
          <AdminInputSwitchField
            id="safe_mode_enabled"
            v-model="editedConfig.safe_mode.enabled as boolean"
            label="Activer le mode sécurisé"
          />

          <AdminInputTextField
            v-if="editedConfig.safe_mode.enabled"
            id="hcaptcha_sitekey"
            v-model="editedConfig.safe_mode.hcaptcha_sitekey"
            label="Clé de Site hCaptcha"
            :variant="hasBeenEdited('safe_mode', 'hcaptcha_sitekey')"
          />

          <AdminInputTextField
            v-if="editedConfig.safe_mode.enabled"
            id="hcaptcha_secret"
            v-model="editedConfig.safe_mode.hcaptcha_secret"
            label="Clé Secrète hCaptcha"
            :variant="hasBeenEdited('safe_mode', 'hcaptcha_secret')"
          />

          <span class="flex gap-1 justify-end">
            <Button
              label="Annuler"
              severity="secondary"
              :disabled="processingRequest"
              @click="onCancel('safe_mode')"
            />
            <Button
              v-if="state.is_admin"
              label="Réinitialiser"
              :disabled="processingRequest"
              @click="onDelete('safe_mode')"
            />
            <Button
              v-if="state.is_admin"
              label="Sauvegarder"
              type="submit"
              :disabled="processingRequest || !isOptionGroupValid('safe_mode')"
            />
          </span>
        </form>
      </TabPanel>
    </TabPanels>
  </Tabs>
</template>

<script setup lang="ts">
import validator from 'validator'
import type { InitAdminLayout } from '~/layouts/admin-ui.vue'
import type { ConfigurationOption, SafeHavenOptions } from '~/lib'
import state from '~/lib/admin-state'
import { isValidNumber, isValidRichText, isValidText, isValidUrl } from '~/lib/validation'

await state.fetchConfig()
let fetchedConfig = state.options
const editedConfig: Ref<SafeHavenOptions> = ref(JSON.parse(JSON.stringify(fetchedConfig))) // deep copy

const processingRequest = ref(false)
const toast = useToast()

const popupEnabled = ref(!!editedConfig.value.init_popup.popup)
const popupCheckboxEnabled = ref(!!editedConfig.value.init_popup.popup_check_text)
const customRedirection = ref(!!editedConfig.value.general.redirect_url)

watch(popupEnabled, (value) => {
  if (value) {
    editedConfig.value.init_popup.popup = ''
  }
  else {
    editedConfig.value.init_popup.popup = null
    popupCheckboxEnabled.value = false
  }
})

watch(popupCheckboxEnabled, (value) => {
  if (value) {
    editedConfig.value.init_popup.popup_check_text = ''
  }
  else {
    editedConfig.value.init_popup.popup_check_text = null
  }
})

watch(customRedirection, (value) => {
  if (value) {
    editedConfig.value.general.redirect_url = ''
  }
  else {
    editedConfig.value.general.redirect_url = null
  }
})

function hasBeenEdited<T extends keyof SafeHavenOptions>(field: T, subField?: keyof SafeHavenOptions[T]) {
  if (subField) {
    return editedConfig.value[field][subField] !== fetchedConfig[field][subField]
  }
  return editedConfig.value[field] !== fetchedConfig[field]
}

definePageMeta({
  layout: 'admin-ui',
})

const initAdminLayout = inject<InitAdminLayout>('initAdminLayout')!
initAdminLayout(
  'Édition de la configuration',
  'user',
  [],
  [
    { label: 'Configuration', url: '/admin/config' },
  ],
)

// Define the OptionValidation type as a union of specific group-name pairs
type OptionValidation
  = { group: 'general', name: keyof SafeHavenOptions['general'] }
    | { group: 'init_popup', name: keyof SafeHavenOptions['init_popup'] }
    | { group: 'safe_mode', name: keyof SafeHavenOptions['safe_mode'] }
    | { group: 'cartography_init', name: keyof SafeHavenOptions['cartography_init'] }
    | { group: 'cartography_source', name: keyof SafeHavenOptions['cartography_source'] }
    | { group: 'cartography_cluster', name: keyof SafeHavenOptions['cartography_cluster'] }

// Function to validate individual options based on the group and name properties
function isOptionValid(option: OptionValidation): boolean {
  const config = editedConfig.value
  switch (option.group) {
    case 'general':
      switch (option.name) {
        case 'title':
        case 'subtitle':
          return isValidText(config.general[option.name])
        case 'information':
          return isValidRichText(config.general[option.name])
        case 'logo_url':
          return !config.general[option.name] || isValidUrl(config.general[option.name])
        case 'redirect_url':
          return config.general[option.name] === null || isValidUrl(config.general[option.name])
      }
      break

    case 'init_popup':
      switch (option.name) {
        case 'popup':
          return config.init_popup[option.name] === null || isValidText(config.init_popup[option.name])
        case 'popup_check_text':
          return config.init_popup[option.name] === null || isValidText(config.init_popup[option.name])
      }
      break

    case 'safe_mode':
      switch (option.name) {
        case 'enabled':
          return config.safe_mode[option.name] != null
        case 'hcaptcha_sitekey':
        case 'hcaptcha_secret':
          return !config.safe_mode.enabled || isValidText(config.safe_mode[option.name])
      }
      break

    case 'cartography_init':
      switch (option.name) {
        case 'center_lat':
          return isValidNumber(config.cartography_init[option.name], { min: -90, max: 90 })
        case 'center_lng':
          return isValidNumber(config.cartography_init[option.name], { min: -180, max: 180 })
        case 'zoom':
          return isValidNumber(config.cartography_init[option.name], { min: 1, max: 30 })
      }
      break

    case 'cartography_source':
      switch (option.name) {
        case 'light_map_url':
        case 'dark_map_url':
          return isValidUrl(config.cartography_source[option.name])
        case 'light_map_attributions':
        case 'dark_map_attributions':
          return isValidText(config.cartography_source[option.name])
      }
      break

    case 'cartography_cluster':
      switch (option.name) {
        case 'characteristic_distance':
          return isValidNumber(config.cartography_cluster[option.name])
        case 'declustering_speed':
          return isValidNumber(config.cartography_cluster[option.name])
        case 'minimal_cluster_size':
          return isValidNumber(config.cartography_cluster[option.name], { min: 0 })
      }
      break
  }
}

function isOptionGroupValid(group: OptionValidation['group']): boolean {
  switch (group) {
    case 'general':
      return (Object.keys(editedConfig.value.general) as Array<keyof SafeHavenOptions['general']>)
        .every(name => isOptionValid({ group: 'general', name }))

    case 'init_popup':
      return (Object.keys(editedConfig.value.init_popup) as Array<keyof SafeHavenOptions['init_popup']>)
        .every(name => isOptionValid({ group: 'init_popup', name }))

    case 'safe_mode':
      return (Object.keys(editedConfig.value.safe_mode) as Array<keyof SafeHavenOptions['safe_mode']>)
        .every(name => isOptionValid({ group: 'safe_mode', name }))

    case 'cartography_init':
      return (Object.keys(editedConfig.value.cartography_init) as Array<keyof SafeHavenOptions['cartography_init']>)
        .every(name => isOptionValid({ group: 'cartography_init', name }))

    case 'cartography_source':
      return (Object.keys(editedConfig.value.cartography_source) as Array<keyof SafeHavenOptions['cartography_source']>)
        .every(name => isOptionValid({ group: 'cartography_source', name }))

    case 'cartography_cluster':
      return (Object.keys(editedConfig.value.cartography_cluster) as Array<keyof SafeHavenOptions['cartography_cluster']>)
        .every(name => isOptionValid({ group: 'cartography_cluster', name }))
  }
}

async function onSave(name: keyof SafeHavenOptions, config: ConfigurationOption) {
  processingRequest.value = true
  try {
    await state.client.updateConfig(name, config)
    fetchedConfig = state.options
    toast.add({ severity: 'success', summary: 'Succès', detail: 'Groupe d\'options sauvegardé avec succès', life: 3000 })
  }
  catch {
    toast.add({ severity: 'error', summary: 'Erreur', detail: 'Erreur de sauvegarde du groupe d\'options', life: 3000 })
  }
  processingRequest.value = false
}

async function onDelete(name: keyof SafeHavenOptions) {
  processingRequest.value = true
  try {
    await state.client.deleteConfig(name)
    fetchedConfig = state.options
    editedConfig.value[name] = JSON.parse(JSON.stringify(fetchedConfig))[name]
    toast.add({ severity: 'success', summary: 'Succès', detail: 'Groupe d\'options réinitialisé avec succès', life: 3000 })
  }
  catch {
    toast.add({ severity: 'error', summary: 'Erreur', detail: 'Erreur de réinitialisation du groupe d\'options', life: 3000 })
  }
  processingRequest.value = false
}

async function onCancel(name: keyof SafeHavenOptions) {
  editedConfig.value[name] = JSON.parse(JSON.stringify(fetchedConfig))[name]
}
</script>
