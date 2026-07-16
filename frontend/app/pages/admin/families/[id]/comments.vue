<template>
  <Tabs v-model:value="tabValue">
    <TabList>
      <Tab value="0">
        {{ $t('page.admin.families.id.comments.visualEditor') }}
      </Tab>
      <Tab value="1">
        {{ $t('page.admin.families.id.comments.advancedEditor') }}
      </Tab>
    </TabList>
    <TabPanels>
      <TabPanel value="0">
        <p class="text-muted-color">
          {{ $t('page.admin.families.id.comments.firstPageExplanation') }}
        </p>

        <AdminFamiliesEditForm
          :original-form-fields="fetchedFamily.comment_form.fields"
          :categories="categories"
          :on-save-callback="onSave"
          class="-ml-4"
          kind="comment"
          :kind-name="$t('page.admin.families.id.comments.kindName')"
        />
      </TabPanel>
      <TabPanel value="1">
        <AdminFamiliesEditFormJson
          :original-form-fields="fetchedFamily.comment_form.fields"
          :on-sync-callback="onSynchronise"
          kind="comment"
          :kind-name="$t('page.admin.families.id.comments.kindName')"
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
  t('page.admin.families.id.comments.title', { title: fetchedFamily.title }),
  'family',
  [],
  [
    { label: t('page.admin.families.id.comments.families'), url: '/admin/families' },
    { label: t('page.admin.families.id.comments.title', { title: fetchedFamily.title }), url: `/admin/families/${id}/comments` },
  ],
)

async function onSave(newFormFields: FormField[]): Promise<{ error: Error | undefined }> {
  try {
    fetchedFamily.comment_form.fields = newFormFields
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
    fetchedFamily.comment_form.fields = newFormFields
    tabValue.value = '0' // Switch back to the visual editor tab after synchronization
    return { error: undefined }
  }
  catch (error) {
    return { error: error as Error }
  }
}
</script>
