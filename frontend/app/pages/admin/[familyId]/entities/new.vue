<template>
  <form
    class="mx-6"
    @submit.prevent="onSave"
  >
    <div class="flex flex-wrap gap-8">
      <div class="flex grow flex-col gap-4 max-w-[30rem] ">
        <AdminInputTextField
          id="display_name"
          v-model="editedEntity.display_name"
          :label="$t('page.admin.familyId.entities.new.displayName')"
        />
        <FormCategorySelect
          v-model="editedEntity.category_id"
          :categories="categories"
        />

        <FormDynamicField
          v-for="field in family.entity_form.fields
            .filter(field => field.categories == null || field.categories.includes(editedEntity.category_id))
            .toSorted((field_a, field_b) => field_a.form_weight - field_b.form_weight)"
          :key="field.key"
          v-model:field-content="(editedEntity.data as EntityOrCommentData)[field.key]"
          :form-field="(field as FormField)"
        />
      </div>

      <div class="flex flex-col grow gap-4 max-w-[30rem] ">
        <FormTagSelect
          v-model="editedEntity.tags"
          :tags="tags"
        />

        <AdminInputSwitchField
          id="hidden"
          v-model="editedEntity.hidden"
          :label="$t('page.admin.familyId.entities.new.hidden')"
          :helper-text="$t('page.admin.familyId.entities.new.hiddenHelperText')"
        />
        <AdminInputSwitchField
          id="moderated"
          v-model="editedEntity.moderated"
          :label="$t('page.admin.familyId.entities.new.moderated')"
          :helper-text="$t('page.admin.familyId.entities.new.moderatedHelperText')"
        />

        <AdminInputTextField
          id="moderation_notes"
          v-model="editedEntity.moderation_notes"
          :label="$t('page.admin.familyId.entities.new.moderationNotes')"
          text-length="long"
          optional
        />

        <FormAdresses
          v-model:locations="editedEntity.locations as UnprocessedLocation[]"
        />

        <span class="flex gap-1 justify-end">
          <NuxtLink :to="`/admin/${familyId}/${entitiesUrl}`">
            <Button
              :label="$t('page.admin.familyId.entities.new.cancel')"
              severity="secondary"
              :loading="processingRequest"
              :disabled="processingRequest"
            />
          </NuxtLink>
          <Button
            :label="$t('page.admin.familyId.entities.new.save')"
            type="submit"
            :loading="processingRequest"
            :disabled="processingRequest || !editedEntity.display_name || !editedEntity.category_id"
          />
        </span>
      </div>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { InitAdminLayout } from '~/layouts/admin-ui.vue'
import type { AdminNewOrUpdateEntity, EntityOrCommentData, FormField, UnprocessedLocation } from '~/lib'
import state from '~/lib/admin-state'

const { t } = useI18n()

definePageMeta({
  layout: 'admin-ui',
})

const familyId = useRoute().params.familyId as string
if (state.families == undefined)
  await state.fetchFamilies()
const family = state.familyRecord[familyId]!

// Fetch categories and tags if not already fetched
if (!state.categories) {
  await state.fetchCategories()
}
if (!state.tags) {
  await state.fetchTags()
}

const categories = computed(() => state.categories.filter(category => category.family_id == familyId))

const tags = state.tags

// Initialize editedEntity with default values for creation
const editedEntity: Ref<AdminNewOrUpdateEntity> = ref({
  category_id: '',
  data: {},
  display_name: '',
  hidden: false,
  locations: [],
  moderated: false,
  tags: [],
})

const processingRequest = ref(false)
const toast = useToast()
const entitiesUrl = useRoute().query.entitiesUrl

const initAdminLayout = inject<InitAdminLayout>('initAdminLayout')!
initAdminLayout(
  t('page.admin.familyId.entities.new.title'),
  'entity',
  [],
  [
    { label: `${family.title}`, url: '/admin/families' },
    { label: t('page.admin.familyId.entities.new.entitiesBreadcrumb'), url: `/admin/${familyId}/${entitiesUrl}` },
    { label: t('page.admin.familyId.entities.new.newEntityBreadcrumb'), url: `/admin/${familyId}/entities/new?=${entitiesUrl}` },
  ],
)

async function onSave() {
  processingRequest.value = true
  try {
    const { id } = await state.client.createEntity(editedEntity.value)
    navigateTo(`/admin/${familyId}/entities/${id}`)
    toast.add({
      severity: 'success',
      summary: t('page.admin.familyId.entities.new.success'),
      detail: t('page.admin.familyId.entities.new.createEntitySuccess'),
      life: 3000,
    })
  }
  catch {
    toast.add({
      severity: 'error',
      summary: t('page.admin.familyId.entities.new.error'),
      detail: t('page.admin.familyId.entities.new.createEntityError'),
      life: 3000,
    })
  }
  processingRequest.value = false
}
</script>
