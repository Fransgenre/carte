<template>
  <Tabs v-model:value="tabValue">
    <TabList>
      <Tab value="0">
        {{ $t('page.admin.families.id.entities.visualEditor') }}
      </Tab>
      <Tab value="1">
        {{ $t('page.admin.families.id.entities.advancedEditor') }}
      </Tab>
    </TabList>
    <TabPanels>
      <TabPanel value="0">
        <p class="text-muted-color">
          {{ $t('page.admin.families.id.entities.firstPageExplanation') }}
        </p>

        <AdminFamiliesEditForm
          :original-form-fields="fetchedFamily.entity_form.fields"
          :categories="categories"
          :on-save-callback="onSave"
          class="-ml-4"
          kind="entity"
          :kind-name="$t('page.admin.families.id.entities.kindName')"
        />
      </TabPanel>
      <TabPanel value="1">
        <AdminFamiliesEditFormJson
          :original-form-fields="fetchedFamily.entity_form.fields"
          :on-sync-callback="onSynchronise"
          kind="entity"
          :kind-name="$t('page.admin.families.id.entities.kindName')"
        />
      </TabPanel>
    </TabPanels>
  </Tabs>
</template>

<script setup lang="ts">
import type { InitAdminLayout } from '~/layouts/admin-ui.vue'
import type { FormField } from '~/lib'
import state from '~/lib/admin-state'

const { t } = useI18n()

definePageMeta({
  layout: 'admin-ui',
})

if (!state.is_admin)
  navigateTo('/admin/home')

const id = useRoute().params.id as string
const tabValue = ref('0')

const fetchedFamily = await state.fetchFamily(id)
await state.fetchCategories()
const categories = state.categories.filter(category => category.family_id == fetchedFamily.id)

const initAdminLayout = inject<InitAdminLayout>('initAdminLayout')!
initAdminLayout(
  t('page.admin.families.id.entities.title', { title: fetchedFamily.title }),
  'family',
  [],
  [
    { label: t('page.admin.families.id.entities.families'), url: '/admin/families' },
    { label: t('page.admin.families.id.entities.title', { title: fetchedFamily.title }), url: `/admin/families/${id}/general` },
  ],
)

async function onSave(newFormFields: FormField[]): Promise<{ error: Error | undefined }> {
  try {
    fetchedFamily.entity_form.fields = newFormFields
    await state.client.updateFamily(id, fetchedFamily)
    navigateTo('/admin/families')
    return { error: undefined }
  }
  catch (error) {
    return { error: error as Error }
  }
}

async function onSynchronise(newFormFields: FormField[]): Promise<{ error: Error | undefined }> {
  try {
    fetchedFamily.entity_form.fields = newFormFields
    tabValue.value = '0' // Switch back to the visual editor tab after synchronization
    return { error: undefined }
  }
  catch (error) {
    return { error: error as Error }
  }
}
</script>
