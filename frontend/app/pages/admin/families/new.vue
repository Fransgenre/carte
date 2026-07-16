<template>
  <form
    class="flex flex-col gap-4 max-w-[30rem] mx-6"
    @submit.prevent="onSave"
  >
    <AdminInputTextField
      id="title"
      v-model="editedFamily.title"
      :label="$t('page.admin.families.new.familyName')"
    />

    <AdminInputTextField
      id="entity_form_title"
      v-model="editedFamily.entity_form.title"
      :label="$t('page.admin.families.new.entityFormTitle')"
    />

    <AdminInputTextField
      id="comment_form_title"
      v-model="editedFamily.comment_form.title"
      :label="$t('page.admin.families.new.commentFormTitle')"
    />

    <span class="flex items-center gap-2">
      <Select
        id="sort_order"
        v-model="editedFamily.sort_order"
        :options="Array.from({ length: state.families.length + 1 }, (_, i) => i + 1)"
        class="w-full md:w-56"
      />
      <label for="sort_order">{{ $t('page.admin.families.new.sortOrder') }}</label>
    </span>

    <span class="flex gap-1 justify-end">
      <NuxtLink to="/admin/families">
        <Button
          :label="$t('page.admin.families.new.cancel')"
          severity="secondary"
          :loading="processingRequest"
          :disabled="processingRequest"
        />
      </NuxtLink>
      <Button
        :label="$t('page.admin.families.new.save')"
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

if (state.families == undefined)
  await state.fetchFamilies()

const editedFamily: Ref<NewOrUpdateFamily> = ref({
  comment_form: {
    fields: [],
    title: '',
  },
  entity_form: {
    fields: [],
    title: '',
  },
  sort_order: state.families.length,
  title: '',
})

const processingRequest = ref(false)
const toast = useToast()

const initAdminLayout = inject<InitAdminLayout>('initAdminLayout')!
initAdminLayout(
  t('page.admin.families.new.title'),
  'family',
  [],
  [
    { label: t('page.admin.families.new.families'), url: '/admin/families' },
    { label: t('page.admin.families.new.title'), url: '/admin/families/new' },
  ],
)

async function onSave() {
  processingRequest.value = true
  try {
    const { id } = await state.client.createFamily(editedFamily.value)
    navigateTo(`/admin/families/new-icon-${id}`)
    toast.add({
      severity: 'success',
      summary: t('page.admin.families.new.success'),
      detail: t('page.admin.families.new.createFamilySuccess'),
      life: 3000,
    })
  }
  catch {
    toast.add({
      severity: 'error',
      summary: t('page.admin.families.new.error'),
      detail: t('page.admin.families.new.createFamilyError'),
      life: 3000,
    })
  }
  processingRequest.value = false
}
</script>
