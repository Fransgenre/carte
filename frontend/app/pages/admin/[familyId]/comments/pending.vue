<template>
  <div>
    <span class="flex gap-4 flex-wrap">
      <IconField icon-position="left">
        <InputIcon>
          <AppIcon
            icon-name="search"
            class="-mt-1"
          />
        </InputIcon>
        <InputText
          v-model="(state.tablesFilters[table_key]!['global'] as DataTableFilterMetaData).value"
          :placeholder="$t('page.admin.familyId.comments.pending.search')"
        />
      </IconField>
      <MultiSelect
        v-model="state.tablesSelectedColumns[table_key]"
        :options="optionalColumns"
        option-label="label"
        option-value="key"
        display="chip"
        :placeholder="$t('page.admin.familyId.comments.pending.selectColumns')"
        class="w-full md:w-80"
      />
    </span>
    <DataTable
      v-model:filters="state.tablesFilters[table_key]"
      paginator
      paginator-template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown CurrentPageReport"
      :current-page-report-template="$t('page.admin.familyId.comments.pending.currentPageReport')"
      state-storage="session"
      :state-key="table_key"
      data-key="id"
      :value="comments"
      striped-rows
      :rows="10"
      :rows-per-page-options="[5, 10, 20, 50]"
      removable-sort
      :global-filter-fields="['author', 'entity_display_name']"
      class=" "
    >
      <Column
        field="author"
        :header="$t('page.admin.familyId.comments.pending.column_author')"
        class="max-w-[25rem]"
        sortable
      />
      <Column
        field="entity_display_name"
        :header="$t('page.admin.familyId.comments.pending.column_entity_display_name')"
        class="max-w-[25rem]"
        sortable
      />

      <Column
        v-if="state.tablesSelectedColumns[table_key]!.includes('entity_category_id')"
        field="entity_category_id"
        :header="$t('page.admin.familyId.comments.pending.column_entity_category_id')"
        sortable
      >
        <template #body="slotProps">
          <CategoryTag :category="state.categoryRecord[slotProps.data.entity_category_id]!" />
        </template>
      </Column>

      <Column
        v-if="state.tablesSelectedColumns[table_key]!.includes('created_at')"
        field="created_at"
        :header="$t('page.admin.familyId.comments.pending.column_created_at')"
        sortable
      >
        <template #body="slotProps">
          {{ $d(new Date(slotProps.data.created_at), { dateStyle: 'short' }) }}
        </template>
      </Column>
      <Column
        v-if="state.tablesSelectedColumns[table_key]!.includes('updated_at')"
        field="updated_at"
        :header="$t('page.admin.familyId.comments.pending.column_updated_at')"
        sortable
      >
        <template #body="slotProps">
          {{ $d(new Date(slotProps.data.updated_at), { dateStyle: 'short' }) }}
        </template>
      </Column>
      <Column>
        <template #body="slotProps">
          <AdminEditDeleteButtons
            :id="slotProps.data.id"
            :model-name="$t('page.admin.familyId.comments.pending.modelName')"
            :name="slotProps.data.entity_display_name"
            @delete="onDelete"
            @edit="id => navigateTo(`/admin/${familyId}/comments/${id}`)"
          />
        </template>
      </Column>
    </DataTable>
  </div>
</template>

<script setup lang="ts">
import type { DataTableFilterMetaData } from 'primevue/datatable'
import type { InitAdminLayout } from '~/layouts/admin-ui.vue'
import type { AdminListedComment } from '~/lib'
import state from '~/lib/admin-state'

const { t } = useI18n()

const familyId = useRoute().params.familyId as string
if (state.families == null)
  await state.fetchFamilies()
if (state.categories == null)
  await state.fetchCategories()

const familyTitle = state.familyRecord[familyId]!.title

// Initialize the ref with an empty array, then fetch to update comments asynchronously
const comments: Ref<AdminListedComment[]> = ref([])
async function refreshTable() {
  comments.value = await state.client.listPendingComments()
  comments.value = comments.value.filter(comment => state.categoryRecord[comment.entity_category_id]!.family_id === familyId)
  state.getEntitiesCommentsCounts()
}
refreshTable()

// 'Catégorie', 'Créé le', 'Mis à jour le'
const optionalColumnsKeys = ['entity_category_id', 'created_at', 'updated_at']
const optionalColumns = optionalColumnsKeys.map(column_key => ({
  key: column_key,
  label: t('page.admin.familyId.comments.pending.column_' + column_key),
}))

const table_key = `dt-state-pending-comments-${familyId}`
const isSmallScreen = useMediaQuery('(max-width: 768px)')
const selectedColumKeys = isSmallScreen.value ? [] : ['entity_category_id', 'created_at']
state.registerTable(table_key, selectedColumKeys)

definePageMeta({
  layout: 'admin-ui',
})

const initAdminLayout = inject<InitAdminLayout>('initAdminLayout')!
initAdminLayout(
  t('page.admin.familyId.comments.pending.pendingComments'),
  'pendingComment',
  [
    {
      icon: 'add',
      label: t('page.admin.familyId.comments.pending.newComment'),
      severity: 'success',
      url: `/admin/${familyId}/comments/new`,
    },
  ],
  [
    { label: `${familyTitle}`, url: '/admin/families' },
    { label: t('page.admin.familyId.comments.pending.pendingCommentsShort'), url: `/admin/${familyId}/comments/pending` },
  ],
)

const toast = useToast()

async function onDelete(comment_id: string, comment_name: string, onDeleteDone: () => void) {
  try {
    await state.client.deleteComment(comment_id)
    toast.add({
      severity: 'success',
      summary: t('page.admin.familyId.comments.pending.success'),
      detail: t('page.admin.familyId.comments.pending.deleteSuccess', { comment_name }),
      life: 3000,
    })
    refreshTable()
  }
  catch {
    toast.add({
      severity: 'error',
      summary: t('page.admin.familyId.comments.pending.error'),
      detail: t('page.admin.familyId.comments.pending.deleteError', { comment_name }),
      life: 3000,
    })
  }
  onDeleteDone()
}
</script>
