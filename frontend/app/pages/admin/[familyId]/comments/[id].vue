<template>
  <form
    class="flex flex-wrap gap-8 mx-6"
    @submit.prevent="onSave"
  >
    <div class="flex grow flex-col gap-4 max-w-[30rem]">
      <AdminInputTextField
        id="author"
        v-model="editedComment.author"
        :label="$t('page.admin.familyId.comments.id.author')"
        :variant="hasBeenEdited('author')"
      />

      <div class="flex flex-col gap-2">
        <label for="comment_text">{{ $t('page.admin.familyId.comments.id.commentText') }} <RequiredIndicator /></label>
        <ViewerRichTextEditor
          id="comment_text"
          v-model="editedComment.text"
          :label="$t('page.admin.familyId.comments.id.commentText')"
        />
      </div>

      <FormDynamicField
        v-for="field in family.comment_form.fields
          .filter(field => field.categories == null || field.categories.includes(parentEntityToDisplay!.category_id))
          .toSorted((field_a, field_b) => field_a.form_weight - field_b.form_weight)"
        :key="field.key"
        v-model:field-content="(editedComment.data as EntityOrCommentData)[field.key]"
        :form-field="(field as FormField)"
      />
    </div>

    <div class="flex flex-col grow gap-4 max-w-[30rem]">
      <span v-if="!isNew">
        {{ $t('page.admin.familyId.comments.id.createdAt', { date: $d(new Date(fetchedComment!.created_at), {
          dateStyle: 'long',
          timeStyle: 'short',
        }) }) }},
        {{ $t('page.admin.familyId.comments.id.updatedAt', { date: $d(new Date(fetchedComment!.updated_at), {
          dateStyle: 'long',
          timeStyle: 'short',
        }) }) }}
      </span>
      <span>
        {{ $t('page.admin.familyId.comments.id.attachedTo', { entity: parentEntityToDisplay?.display_name }) }}
        <CategoryTag
          v-if="parentEntityToDisplay?.category_id"
          :category="state.categoryRecord[parentEntityToDisplay!.category_id]!"
        />

      </span>
      <Button
        :label="$t('page.admin.familyId.comments.id.changeEntity')"
        outlined
        @click="entitySelectVisible=true"
      />
      <Button
        v-if="urlEntityId || fetchedComment?.entity_id"
        v-slot="slotProps"
        as-child
        outlined
        class="w-full"
      >
        <NuxtLink
          :to="entityLink"
          :class="[slotProps.class, 'p-button-label']"
          target="_blank"
        >
          <AppIcon icon-name="externalLink" />
          {{ $t('page.admin.familyId.comments.id.goToEntity') }}
        </NuxtLink>
      </Button>
      <AdminInputEntitySelect
        v-model:visible="entitySelectVisible"
        :title="$t('page.admin.familyId.comments.id.entityChangeTitle')"
        :categories="categories"
        :tags="tags"
        :family-id="familyId"
        :previous-entity-id="editedComment.entity_id"
        @save_entity="entity => {
          editedComment.entity_id = entity.entity_id
          editedComment.entity_category_id = entity.category_id
          parentEntityToDisplay = entity
        }"
      />

      <AdminInputSwitchField
        id="moderated"
        v-model="editedComment.moderated"
        :label="$t('page.admin.familyId.comments.id.moderated')"
        :helper-text="$t('page.admin.familyId.comments.id.moderatedHelperText')"
      />
      <span class="flex gap-1 justify-end">
        <NuxtLink :to="returnUrl">
          <Button
            :label="$t('page.admin.familyId.comments.id.cancel')"
            severity="secondary"
            :disabled="processingRequest"
            :loading="processingRequest"
          />
        </NuxtLink>
        <Button
          :label="$t('page.admin.familyId.comments.id.save')"
          type="submit"
          :loading="processingRequest"
          :disabled="processingRequest || !editedComment.author || !editedComment.text || !editedComment.entity_id"
        />
      </span>
    </div>
  </form>
</template>

<script setup lang="ts">
import type { LocationQueryValue } from 'vue-router'
import type { InitAdminLayout } from '~/layouts/admin-ui.vue'
import type { AdminNewOrUpdateComment, AdminComment, EntityOrCommentData, FormField } from '~/lib'
import state from '~/lib/admin-state'

const { t } = useI18n()

definePageMeta({
  layout: 'admin-ui',
})

const familyId = useRoute().params.familyId as string
if (state.families == undefined)
  await state.fetchFamilies()
if (state.categories == undefined)
  await state.fetchCategories()
if (state.tags == undefined)
  await state.fetchTags()

const family = state.familyRecord[familyId]!
const commentId = useRoute().params.id as string
const isNew = (commentId === 'new')

const urlEntityId = useRoute().query.urlEntityId as LocationQueryValue | undefined

const entityLink = computed(() => `/admin/${familyId}/entities/${editedComment.value.entity_id}`)
const returnUrl = computed(() => urlEntityId == null ? `/admin/${familyId}/comments/pending` : `${entityLink.value}?comments`)

const fetchedComment: AdminComment | null = isNew ? null : await state.client.getComment(commentId, family!.comment_form.fields)

const parentEntityToDisplay = ref<{ category_id: string, display_name: string }>()
if (fetchedComment) {
  parentEntityToDisplay.value = { category_id: fetchedComment.entity_category_id, display_name: fetchedComment.entity_display_name }
}
else if (urlEntityId) {
  const fetchedParent = await state.client.getEntity(urlEntityId as string, family!.entity_form.fields)
  parentEntityToDisplay.value = { category_id: fetchedParent.category_id, display_name: fetchedParent.display_name }
}
else {
  parentEntityToDisplay.value = { category_id: '', display_name: '' }
}

const editedComment: Ref<AdminNewOrUpdateComment> = isNew
  ? ref({
      author: '',
      data: {},
      entity_id: urlEntityId ?? '',
      entity_category_id: parentEntityToDisplay.value.category_id,
      moderated: false,
      text: '',
      version: 1,
    })
  : ref(structuredClone(fetchedComment!)) // deep copy

const processingRequest = ref(false)
const toast = useToast()

const categories = computed(() => state.categories.filter(category => category.family_id == familyId))

const tags = state.tags

const entitySelectVisible = ref(false)

const initAdminLayout = inject<InitAdminLayout>('initAdminLayout')!
initAdminLayout(
  isNew ? t('page.admin.familyId.comments.id.newCommentTitle') : t('page.admin.familyId.comments.id.editCommentTitle', { author: fetchedComment!.author }),
  'comment',
  [],
  [
    { label: `${family.title}`, url: '/admin/families' },
    { label: urlEntityId
      ? t('page.admin.familyId.comments.id.entityCommentsBreadcrumb', { entity: parentEntityToDisplay.value.display_name })
      : t('page.admin.familyId.comments.id.pendingCommentsBreadcrumb'), url: returnUrl.value },
    isNew
      ? { label: t('page.admin.familyId.comments.id.newCommentBreadcrumb'), url: `/admin/${familyId}/comments/new` }
      : { label: t('page.admin.familyId.comments.id.editCommentBreadcrumb'), url: `/admin/${familyId}/comments/${commentId}` },
  ],
)

function hasBeenEdited(field: keyof AdminNewOrUpdateComment) {
  return isNew ? false : editedComment.value[field] !== fetchedComment![field]
}

async function onSave() {
  processingRequest.value = true
  try {
    if (isNew) {
      await state.client.createComment(editedComment.value)
    }
    else {
      await state.client.updateComment(commentId, editedComment.value)
    }
    navigateTo(returnUrl.value)
    toast.add({
      severity: 'success',
      summary: t('page.admin.familyId.comments.id.success'),
      detail: t('page.admin.familyId.comments.id.editSuccess'),
      life: 3000,
    })
  }
  catch {
    toast.add({
      severity: 'error',
      summary: t('page.admin.familyId.comments.id.error'),
      detail: t('page.admin.familyId.comments.id.editError'),
      life: 3000,
    })
  }
  processingRequest.value = false
}
</script>
