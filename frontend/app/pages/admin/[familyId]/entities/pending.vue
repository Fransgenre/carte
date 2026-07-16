<template>
  <div>
    <span class="flex gap-4 flex-wrap">
      <IconField
        icon-position="left"
      >
        <InputIcon>
          <AppIcon
            icon-name="search"
            class="-mt-1"
          />
        </InputIcon>
        <InputText
          v-model="(state.tablesFilters[table_key]!['global'] as DataTableFilterMetaData).value"
          :placeholder="$t('page.admin.familyId.entities.pending.searchPlaceholder')"
        />
      </IconField>
      <MultiSelect
        v-model="state.tablesSelectedColumns[table_key]"
        :options="optionalColumns"
        option-label="label"
        option-value="key"
        display="chip"
        :placeholder="$t('page.admin.familyId.entities.pending.selectColumns')"
        class="w-full md:w-80"
      />
    </span>
    <DataTable
      v-model:filters="state.tablesFilters[table_key]"
      paginator
      paginator-template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown CurrentPageReport"
      :current-page-report-template="$t('page.admin.familyId.entities.pending.currentPageReport')"
      state-storage="session"
      :state-key="table_key"
      data-key="id"
      :value="entities"
      striped-rows
      :rows="10"
      :rows-per-page-options="[5, 10, 20, 50]"
      removable-sort
      :global-filter-fields="['display_name']"
      class=" "
    >
      <Column
        field="display_name"
        :header="$t('page.admin.familyId.entities.pending.column_display_name')"
        class="max-w-[25rem]"
        sortable
      />

      <Column
        v-if="state.tablesSelectedColumns[table_key]!.includes('category_id')"
        field="category_id"
        :header="$t('page.admin.familyId.entities.pending.column_category_id')"
        sortable
      >
        <template #body="slotProps">
          <CategoryTag :category="state.categoryRecord[slotProps.data.category_id]!" />
        </template>
      </Column>

      <Column
        v-if="state.tablesSelectedColumns[table_key]!.includes('created_at')"
        field="created_at"
        :header="$t('page.admin.familyId.entities.pending.column_created_at')"
        sortable
      >
        <template #body="slotProps">
          {{ $d(new Date(slotProps.data.created_at), { dateStyle: 'short' }) }}
        </template>
      </Column>
      <Column
        v-if="state.tablesSelectedColumns[table_key]!.includes('updated_at')"
        field="updated_at"
        :header="$t('page.admin.familyId.entities.pending.column_updated_at')"
        sortable
      >
        <template #body="slotProps">
          {{ $d(new Date(slotProps.data.updated_at), { dateStyle: 'short' }) }}
        </template>
      </Column>

      <Column
        v-if="state.tablesSelectedColumns[table_key]!.includes('hidden')"
        field="hidden"
        :header="$t('page.admin.familyId.entities.pending.column_hidden')"
      >
        <template #body="slotProps">
          <Tag
            :value="slotProps.data.hidden ? $t('page.admin.familyId.entities.pending.hidden') : $t('page.admin.familyId.entities.pending.visible')"
            :severity="slotProps.data.hidden ? 'error' : 'success'"
          />
        </template>
      </Column>
      <Column>
        <template #body="slotProps">
          <AdminEditDeleteButtons
            :id="slotProps.data.id"
            :model-name="$t('page.admin.familyId.entities.pending.modelName')"
            :name="slotProps.data.display_name"
            @delete="onDelete"
            @edit="id => navigateTo(`/admin/${familyId}/entities/${id}?entitiesUrl=entities/pending`)"
          />
        </template>
      </Column>
    </DataTable>
  </div>
</template>

<script setup lang="ts">
import type { DataTableFilterMetaData } from 'primevue/datatable'
import type { InitAdminLayout } from '~/layouts/admin-ui.vue'
import type { AdminListedEntity } from '~/lib'
import state from '~/lib/admin-state'

const { t } = useI18n()

const familyId = useRoute().params.familyId as string
if (state.families == null)
  await state.fetchFamilies()
if (state.categories == null)
  await state.fetchCategories()

const familyTitle = state.familyRecord[familyId]!.title

// Initialize the ref with an empty array, then fetch to update entities asynchronously
const entities: Ref<AdminListedEntity[]> = ref([])
async function refreshTable() {
  entities.value = await state.client.listPendingEntities()
  entities.value = entities.value.filter(entity => state.categoryRecord[entity.category_id]!.family_id == familyId)
  state.getEntitiesCommentsCounts()
}
refreshTable()

// 'Catégorie', 'Créée le', 'Mise à jour le', 'Visibilité'
const optionalColumnsKeys = ['category_id', 'created_at', 'updated_at', 'hidden']
const optionalColumns = optionalColumnsKeys.map(column_key => ({
  key: column_key,
  label: t('page.admin.familyId.entities.pending.column_' + column_key),
}))

const table_key = `dt-state-pending-entities-${familyId}`
const isSmallScreen = useMediaQuery('(max-width: 768px)')
const selectedColumKeys = isSmallScreen.value ? [] : ['category_id', 'created_at']
state.registerTable(table_key, selectedColumKeys)

definePageMeta({
  layout: 'admin-ui',
})

const initAdminLayout = inject<InitAdminLayout>('initAdminLayout')!
initAdminLayout(
  t('page.admin.familyId.entities.pending.title'),
  'pendingEntity',
  [
    {
      icon: 'add',
      label: t('page.admin.familyId.entities.pending.newEntity'),
      severity: 'success',
      url: `/admin/${familyId}/entities/new?entitiesUrl=entities/pending`,
    },
  ],
  [
    { label: `${familyTitle}`, url: '/admin/families' },
    { label: t('page.admin.familyId.entities.pending.breadcrumb'), url: `/admin/${familyId}/entities/pending` },
  ],
)

const toast = useToast()

async function onDelete(entity_id: string, entity_name: string, onDeleteDone: () => void) {
  try {
    await state.client.deleteEntity(entity_id)
    toast.add({
      severity: 'success',
      summary: t('page.admin.familyId.entities.pending.success'),
      detail: t('page.admin.familyId.entities.pending.deleteEntitySuccess', { entity_name }),
      life: 3000,
    })
    refreshTable()
  }
  catch {
    toast.add({
      severity: 'error',
      summary: t('page.admin.familyId.entities.pending.error'),
      detail: t('page.admin.familyId.entities.pending.deleteEntityError', { entity_name }),
      life: 3000,
    })
  }
  onDeleteDone()
}
</script>
