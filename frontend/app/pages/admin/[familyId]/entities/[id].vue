<template>
  <div
    class="mx-6"
  >
    <Tabs value="0">
      <TabList>
        <Tab
          value="0"
        >
          {{ $t('page.admin.familyId.entities.id.contentsAndModeration') }}
        </Tab>
        <Tab
          value="1"
        >
          {{ $t('page.admin.familyId.entities.id.relationships') }}
        </Tab>
        <Tab
          value="2"
        >
          <template v-if="!hasLoadedComments">
            {{ $t('page.admin.familyId.entities.id.comments') }}
          </template>
          <template v-else>
            {{ $t('page.admin.familyId.entities.id.commentsNumber', { count: entityComments.length }) }}
          </template>
        </Tab>
      </TabList>

      <TabPanels>
        <TabPanel value="0">
          <form
            class="flex flex-wrap gap-8"
            @submit.prevent="onSave"
          >
            <div class="flex grow flex-col gap-4 max-w-[30rem]">
              <AdminInputTextField
                id="display_name"
                v-model="editedEntity.display_name"
                :label="$t('page.admin.familyId.entities.id.displayName')"
                :variant="hasBeenEdited('display_name')"
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

            <div class="flex flex-col grow gap-4 max-w-[30rem]">
              {{ $t('page.admin.familyId.entities.id.createdAt', { date: $d(new Date(fetchedEntity.created_at), {
                dateStyle: 'long',
                timeStyle: 'short',
              }) }) }},
              {{ $t('page.admin.familyId.entities.id.updatedAt', { date: $d(new Date(fetchedEntity.updated_at), {
                dateStyle: 'long',
                timeStyle: 'short',
              }) }) }}
              <FormTagSelect
                v-model="editedEntity.tags"
                :tags="tags"
              />

              <AdminInputSwitchField
                id="hidden"
                v-model="editedEntity.hidden"
                :label="$t('page.admin.familyId.entities.id.hidden')"
                :helper-text="$t('page.admin.familyId.entities.id.hiddenHelperText')"
              />
              <AdminInputSwitchField
                id="moderated"
                v-model="editedEntity.moderated"
                :label="$t('page.admin.familyId.entities.id.moderated')"
                :helper-text="$t('page.admin.familyId.entities.id.moderatedHelperText')"
              />

              <AdminInputTextField
                id="moderation_notes"
                v-model="editedEntity.moderation_notes"
                :label="$t('page.admin.familyId.entities.id.moderationNotes')"
                text-length="long"
                optional
              />

              <!-- modif pour ajout affichage id de l'entité + option pour copier l'id facilement -->
              <p class="flex flex-col items-start gap-1">
                <strong>{{ $t('page.admin.familyId.entities.id.entityId') }}</strong>
                <span class="flex items-center gap-2">
                  <label class="px-2 py-1 rounded text-sm select-text">{{ entityId }}</label>
                  <Button
                    outlined
                    rounded
                    type="button"
                    :title="$t('page.admin.familyId.entities.id.copyEntityId')"
                    class="mx-2"
                    :aria-label="$t('page.admin.familyId.entities.id.copyEntityId')"
                    @click="copyEntityId"
                  >
                    <template #icon>
                      <AppIcon icon-name="copy" />
                    </template>
                  </Button>
                </span>
              </p>

              <FormAdresses
                v-model:locations="editedEntity.locations as UnprocessedLocation[]"
              />

              <span class="flex gap-1 justify-end">
                <NuxtLink :to="`/admin/${familyId}/${entitiesUrl}`">
                  <Button
                    :label="$t('page.admin.familyId.entities.id.cancel')"
                    severity="secondary"
                    :loading="processingRequest"
                    :disabled="processingRequest"
                  />
                </NuxtLink>
                <Button
                  :label="$t('page.admin.familyId.entities.id.save')"
                  type="submit"
                  :loading="processingRequest"
                  :disabled="processingRequest || !editedEntity.display_name || !editedEntity.category_id"
                />
              </span>
            </div>
          </form>
        </TabPanel>

        <TabPanel value="1">
          <AdminEntityKinshipTable
            :main-entity="fetchedEntity"
            :categories="categories"
            :tags="tags"
            :family-id="familyId"
            @update-kinship="async () => fetchedEntity = (await state.client.getEntity(entityId, family!.entity_form.fields))"
          />
        </TabPanel>

        <TabPanel value="2">
          <Message
            v-if="entityComments.length == 0"
            severity="warn"
          >
            {{ $t('page.admin.familyId.entities.id.noComments') }}
          </Message>
          <CommentsDisplayer
            v-else
            style="max-width: 60rem;"
            :comment-form-fields="family.comment_form.fields"
            :comments="entityComments"
            :public="false"
            :entity-category-id="editedEntity.category_id"
            @delete="onCommentDelete"
            @edit="commentId => navigateTo(`/admin/${familyId}/comments/${commentId}?urlEntityId=${entityId}`)"
          />
          <Button
            :label="$t('page.admin.familyId.entities.id.newComment')"
            rounded
            outlined
            class="ml-3 mt-3"
            @click="navigateTo(`/admin/${familyId}/comments/new?urlEntityId=${entityId}`)"
          >
            <template #default>
              <div class="flex items-center">
                <AppIcon
                  class="-ml-1 mr-1"
                  icon-name="commentAdd"
                />
                {{ $t('page.admin.familyId.entities.id.addComment') }}
              </div>
            </template>
          </Button>
        </TabPanel>
      </TabPanels>
    </Tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { InitAdminLayout } from '~/layouts/admin-ui.vue'
import type { AdminComment, AdminNewOrUpdateEntity, EntityOrCommentData, FormField, UnprocessedLocation } from '~/lib'
import state from '~/lib/admin-state'

const { t } = useI18n()

definePageMeta({
  layout: 'admin-ui',
})

const familyId = useRoute().params.familyId as string
const entityId = useRoute().params.id as string
if (state.families == undefined) {
  await state.fetchFamilies()
}
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

const fetchedEntity = ref(await state.client.getEntity(entityId, family!.entity_form.fields))

const entityComments = ref<AdminComment[]>([])
const hasLoadedComments = ref(false)
async function refreshComments() {
  hasLoadedComments.value = false
  entityComments.value = await state.client.listEntityComments(entityId, family.comment_form.fields)
  hasLoadedComments.value = true
}
refreshComments()

// Deep copy
const editedEntity: Ref<AdminNewOrUpdateEntity> = ref(structuredClone(toRaw(fetchedEntity.value)))

const processingRequest = ref(false)
const toast = useToast()
const entitiesUrl = useRoute().query.entitiesUrl ?? 'entities'

const initAdminLayout = inject<InitAdminLayout>('initAdminLayout')!
initAdminLayout(
  t('page.admin.familyId.entities.id.title', { entity: fetchedEntity.value.display_name }),
  'entity',
  [],
  [
    { label: `${family.title}`, url: '/admin/families' },
    { label: t('page.admin.familyId.entities.id.entitiesBreadcrumb'), url: `/admin/${familyId}/${entitiesUrl}` },
    { label: t('page.admin.familyId.entities.id.title', { entity: fetchedEntity.value.display_name }), url: `/admin/${familyId}/entities/${entityId}?=${entitiesUrl}` },
  ],
)

function hasBeenEdited(field: keyof AdminNewOrUpdateEntity) {
  return editedEntity.value[field] !== fetchedEntity.value[field]
}

async function onSave() {
  processingRequest.value = true
  try {
    await state.client.updateEntity(entityId, editedEntity.value)
    navigateTo(`/admin/${familyId}/${entitiesUrl}`)
    toast.add({
      severity: 'success',
      summary: t('page.admin.familyId.entities.id.success'),
      detail: t('page.admin.familyId.entities.id.editSuccess'),
      life: 3000,
    })
  }
  catch {
    toast.add({
      severity: 'error',
      summary: t('page.admin.familyId.entities.id.error'),
      detail: t('page.admin.familyId.entities.id.editError'),
      life: 3000,
    })
  }
  processingRequest.value = false
  state.getEntitiesCommentsCounts()
}

async function onCommentDelete(comment_id: string, comment_author: string, onDeleteDone: () => void) {
  try {
    await state.client.deleteComment(comment_id)
    toast.add({
      severity: 'success',
      summary: t('page.admin.familyId.entities.id.success'),
      detail: t('page.admin.familyId.entities.id.deleteCommentSuccess', { comment_author }),
      life: 3000,
    })
    refreshComments()
  }
  catch {
    toast.add({
      severity: 'error',
      summary: t('page.admin.familyId.entities.id.error'),
      detail: t('page.admin.familyId.entities.id.deleteCommentError', { comment_author }),
      life: 3000,
    })
  }
  onDeleteDone()
}

// script pour copie id entité
function copyEntityId() {
  navigator.clipboard.writeText(entityId)
  toast.add({
    severity: 'success',
    summary: t('page.admin.familyId.entities.id.copied'),
    detail: t('page.admin.familyId.entities.id.copiedDetails'),
    life: 2000,
  })
}
</script>
