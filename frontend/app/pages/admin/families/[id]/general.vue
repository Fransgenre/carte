<template>
  <form
    class="flex flex-col gap-4 max-w-[30rem] mx-6"
    @submit.prevent="onSave"
  >
    <AdminInputTextField
      id="title"
      v-model="editedFamily.title"
      :label="$t('page.admin.families.id.general.familyName')"
      :variant="hasBeenEdited('title')"
    />

    <AdminInputTextField
      id="entity_form_title"
      v-model="editedFamily.entity_form.title"
      :label="$t('page.admin.families.id.general.entityFormTitle')"
      :variant="editedFamily.entity_form.title !== fetchedFamily.entity_form.title"
    />

    <AdminInputTextField
      id="entity_form_title"
      v-model="editedFamily.entity_form.help"
      :label="$t('page.admin.families.id.general.entityFormHelp')"
      :variant="editedFamily.entity_form.help !== fetchedFamily.entity_form.help"
      text-length="long"
    />

    <AdminInputTextField
      id="comment_form_title"
      v-model="editedFamily.comment_form.title"
      :label="$t('page.admin.families.id.general.commentFormTitle')"
      :variant="editedFamily.comment_form.title !== fetchedFamily.comment_form.title"
    />

    <AdminInputTextField
      id="comment_form_help"
      v-model="editedFamily.comment_form.help"
      :label="$t('page.admin.families.id.general.commentFormHelp')"
      :variant="editedFamily.comment_form.help !== fetchedFamily.comment_form.help"
      text-length="long"
    />

    <span class="flex items-center gap-2">
      <Select
        id="sort_order"
        v-model="editedFamily.sort_order"
        :options="Array.from({ length: state.families.length }, (_, i) => i + 1)"
        class="w-full md:w-56"
      />
      <label for="sort_order">{{ $t('page.admin.families.id.general.sortOrder') }}</label>
    </span>

    <AdminInputIconUpload
      :object-id="id"
      object-type="families"
    />
    <span class="flex gap-1 justify-end">
      <NuxtLink to="/admin/families">
        <Button
          :label="$t('page.admin.families.id.general.cancel')"
          severity="secondary"
          :loading="processingRequest"
          :disabled="processingRequest"
        />
      </NuxtLink>
      <Button
        :label="$t('page.admin.families.id.general.save')"
        type="submit"
        :loading="processingRequest"
        :disabled="processingRequest || !editedFamily.title || !editedFamily.comment_form.title || !editedFamily.entity_form.title"
      />
    </span>
  </form>
</template>

<script setup lang="ts">
import type { InitAdminLayout } from '~/layouts/admin-ui.vue'
import type { NewOrUpdateFamily } from '~/lib'
import state from '~/lib/admin-state'

const { t } = useI18n()

definePageMeta({
  layout: 'admin-ui',
})

if (!state.is_admin)
  navigateTo('/admin/home')

const id = useRoute().params.id as string

const fetchedFamily = await state.client.getFamily(id)
const editedFamily: Ref<NewOrUpdateFamily> = ref(JSON.parse(JSON.stringify(fetchedFamily))) // deep copy

const processingRequest = ref(false)
const toast = useToast()

const initAdminLayout = inject<InitAdminLayout>('initAdminLayout')!
initAdminLayout(
  t('page.admin.families.id.general.title', { title: fetchedFamily.title }),
  'family',
  [],
  [
    { label: t('page.admin.families.id.general.families'), url: '/admin/families' },
    { label: t('page.admin.families.id.general.title', { title: fetchedFamily.title }), url: `/admin/families/${id}/general` },
  ],
)

function hasBeenEdited(field: keyof NewOrUpdateFamily) {
  return editedFamily.value[field] !== fetchedFamily[field]
}

async function onSave() {
  processingRequest.value = true
  try {
    await state.client.updateFamily(id, editedFamily.value)
    navigateTo('/admin/families')
    toast.add({
      severity: 'success',
      summary: t('page.admin.families.id.general.success'),
      detail: t('page.admin.families.id.general.editFamilySuccess'),
      life: 3000,
    })
  }
  catch {
    toast.add({
      severity: 'error',
      summary: t('page.admin.families.id.general.error'),
      detail: t('page.admin.families.id.general.editFamilyError'),
      life: 3000,
    })
  }
  processingRequest.value = false
}
</script>
