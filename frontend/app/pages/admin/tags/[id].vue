<template>
  <form
    class="flex flex-col gap-4 max-w-[30rem] mx-6"
    @submit.prevent="onSave"
  >
    <AdminInputTextField
      id="title"
      v-model="editedTag.title"
      :label="$t('page.admin.tags.id.tagTitle')"
      :variant="hasBeenEdited('title')"
    />

    <AdminInputSwitchField
      id="is_filter"
      v-model="editedTag.is_filter"
      :label="$t('page.admin.tags.id.isFilter')"
    />

    <AdminInputSwitchField
      v-if="editedTag.is_filter"
      id="default_filter_status"
      v-model="editedTag.default_filter_status"
      :label="$t('page.admin.tags.id.defaultFilterStatus')"
      :helper-text="$t('page.admin.tags.id.defaultFilterStatusHelperText')"
    />

    <AdminInputSwitchField
      v-if="editedTag.is_filter"
      id="is_filter"
      v-model="editedTag.is_primary_filter"
      :label="$t('page.admin.tags.id.isPrimaryFilter')"
      :helper-text="$t('page.admin.tags.id.isPrimaryFilterHelperText')"
    />

    <AdminInputTextField
      v-if="editedTag.is_filter && editedTag.is_primary_filter"
      id="filter_description"
      v-model="editedTag.filter_description"
      :label="$t('page.admin.tags.id.filterDescription')"
      :variant="hasBeenEdited('filter_description')"
      :helper-text="$t('page.admin.tags.id.filterDescriptionHelperText')"
    />

    <AdminInputColorField
      id="border_color"
      v-model="editedTag.border_color"
      :label="$t('page.admin.tags.id.borderColor')"
      :variant="hasBeenEdited('border_color')"
    />

    <AdminInputColorField
      id="fill_color"
      v-model="editedTag.fill_color"
      :label="$t('page.admin.tags.id.fillColor')"
      :variant="hasBeenEdited('fill_color')"
    />

    <span class="flex gap-1 justify-end">
      <NuxtLink to="/admin/tags">
        <Button
          :label="$t('page.admin.tags.id.cancel')"
          severity="secondary"
          :loading="processingRequest"
          :disabled="processingRequest"
        />
      </NuxtLink>
      <Button
        :label="$t('page.admin.tags.id.save')"
        type="submit"
        :loading="processingRequest"
        :disabled="isDisabled()"
      />
    </span>
  </form>
</template>

<script setup lang="ts">
import type { InitAdminLayout } from '~/layouts/admin-ui.vue'
import type { NewOrUpdateTag } from '~/lib'
import state from '~/lib/admin-state'
import { isValidHexColor, isValidText } from '~/lib/validation'

const { t } = useI18n()

definePageMeta({
  layout: 'admin-ui',
})

const tagId = useRoute().params.id as string

const isNew = (tagId === 'new')
const fetchedTag = isNew ? null : await state.fetchTag(tagId)
const editedTag: Ref<NewOrUpdateTag> = ref(isNew
  ? {
      title: '',
      is_filter: true,
      is_primary_filter: false,
      default_filter_status: true,
      filter_description: '',
      border_color: '#deb9c9',
      fill_color: '#824261',
    }
  : JSON.parse(JSON.stringify(fetchedTag)),
)

const processingRequest = ref(false)
const toast = useToast()

function isDisabled() {
  return processingRequest.value
    || !isValidText(editedTag.value.title)
    || (editedTag.value.is_primary_filter && !isValidText(editedTag.value.filter_description))
    || !isValidHexColor(editedTag.value.border_color)
    || !isValidHexColor(editedTag.value.fill_color)
}

const initAdminLayout = inject<InitAdminLayout>('initAdminLayout')!
initAdminLayout(
  isNew ? t('page.admin.tags.id.newTagTitle') : t('page.admin.tags.id.editTagTitle', { title: fetchedTag!.title }),
  'tag',
  [],
  isNew
    ? [
        { label: t('page.admin.tags.id.tags'), url: '/admin/tags' },
        { label: t('page.admin.tags.id.newTagTitle'), url: `/admin/tags/new` },
      ]
    : [
        { label: t('page.admin.tags.id.tags'), url: '/admin/tags' },
        { label: t('page.admin.tags.id.editTagTitle', { title: fetchedTag!.title }), url: `/admin/tags/${tagId}` },
      ],
)

function hasBeenEdited(field: keyof NewOrUpdateTag) {
  return isNew
    ? false
    : editedTag.value[field] !== fetchedTag![field]
}

async function onSave() {
  try {
    processingRequest.value = true
    if (isNew) {
      await state.createTag(editedTag.value)
      toast.add({
        severity: 'success',
        summary: t('page.admin.tags.id.success'),
        detail: t('page.admin.tags.id.createTagSuccess'),
        life: 3000,
      })
    }
    else {
      await state.updateTag(tagId, editedTag.value)
      toast.add({
        severity: 'success',
        summary: t('page.admin.tags.id.success'),
        detail: t('page.admin.tags.id.editTagSuccess'),
        life: 3000,
      })
    }
    navigateTo('/admin/tags')
  }
  catch (error) {
    console.error(error)
    toast.add({
      severity: 'error',
      summary: t('page.admin.tags.id.error'),
      detail: (isNew ? t('page.admin.tags.id.createTagError') : t('page.admin.tags.id.editTagError')),
      life: 3000,
    })
  }

  processingRequest.value = false
}
</script>
