<template>
  <form
    class="flex flex-col gap-4 max-w-[30rem] mx-6"
  >
    <AdminInputIconUpload
      :object-id="categoryId"
      object-type="categories"
    />
    <span class="flex gap-1 justify-end">
      <NuxtLink :to="`/admin/${familyId}/categories`">
        <Button
          :label="$t('page.admin.familyId.categories.newIconId.backToList')"
          severity="secondary"
        />
      </NuxtLink>
    </span>
  </form>
</template>

<script setup lang="ts">
import type { InitAdminLayout } from '~/layouts/admin-ui.vue'
import state from '~/lib/admin-state'

const { t } = useI18n()

definePageMeta({
  layout: 'admin-ui',
})

const familyId = useRoute().params.familyId as string
if (state.families == undefined)
  await state.fetchFamilies()
const familyTitle = state.familyRecord[familyId]!.title
const categoryId = useRoute().params.id as string

const fetchedCategory = await state.fetchCategory(categoryId)

const initAdminLayout = inject<InitAdminLayout>('initAdminLayout')!
initAdminLayout(
  t('page.admin.familyId.categories.newIconId.title', { category: fetchedCategory.title }),
  'category',
  [],
  [
    { label: `${familyTitle}`, url: '/admin/families' },
    { label: t('page.admin.familyId.categories.newIconId.categories'), url: `/admin/${familyId}/categories` },
    { label: t('page.admin.familyId.categories.newIconId.title', { category: fetchedCategory.title }), url: `/admin/${familyId}/categories/${categoryId}` },
  ],
)
</script>
