<template>
  <div>
    <span class="flex gap-4 flex-wrap">
      <IconField
        icon-position="left"
      >
        <InputIcon><AppIcon
          icon-name="search"
          class="-mt-1"
        /></InputIcon>
        <InputText
          v-model="(state.tablesFilters[table_key]!['global'] as DataTableFilterMetaData).value"
          :placeholder="$t('page.admin.tags.index.searchPlaceholder')"
        />
      </IconField>
      <MultiSelect
        v-model="state.tablesSelectedColumns[table_key]"
        :options="optionalColumns"
        option-label="label"
        option-value="key"
        display="chip"
        :placeholder="$t('page.admin.tags.index.selectColumns')"
        class="w-full md:w-80"
      />
    </span>
    <DataTable
      v-model:filters="state.tablesFilters[table_key]"
      state-storage="session"
      :state-key="table_key"
      data-key="id"
      paginator
      paginator-template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown CurrentPageReport"
      :current-page-report-template="$t('page.admin.tags.index.currentPageReport')"
      :value="tags"
      striped-rows
      :rows="10"
      :rows-per-page-options="[5, 10, 20, 50]"
      removable-sort
      :global-filter-fields="['title', 'filter_description']"
      class=" "
    >
      <Column
        field="title"
        :header="$t('page.admin.tags.index.column_title')"
        sortable
      >
        <template #body="slotProps">
          <DisplayedTag :tag="slotProps.data" />
        </template>
      </Column>
      <Column
        v-if="state.tablesSelectedColumns[table_key]!.includes('is_filter')"
        field="is_filter"
        :header="$t('page.admin.tags.index.column_is_filter')"
        sortable
      >
        <template #body="slotProps">
          <Tag
            :value="slotProps.data.is_filter ? $t('page.admin.tags.index.filtering') : $t('page.admin.tags.index.nonFiltering')"
            :severity="slotProps.data.is_filter ? 'success' : 'warning'"
          />
        </template>
      </Column>

      <Column
        v-if="state.tablesSelectedColumns[table_key]!.includes('default_filter_status')"
        :header="$t('page.admin.tags.index.column_default_filter_status')"
        field="default_filter_status"
        sortable
      >
        <template #body="slotProps">
          <Tag
            :value="slotProps.data.is_filter ? (slotProps.data.default_filter_status ? $t('page.admin.tags.index.included') : $t('page.admin.tags.index.excluded')) : $t('page.admin.tags.index.nonFiltering')"
            :severity="slotProps.data.is_filter ? (slotProps.data.default_filter_status ? 'success' : 'danger') : 'warning'"
          />
        </template>
      </Column>

      <Column
        v-if="state.tablesSelectedColumns[table_key]!.includes('filter_description')"
        :header="$t('page.admin.tags.index.column_filter_description')"
        field="filter_description"
        sortable
      />

      <Column>
        <template #body="slotProps">
          <AdminEditDeleteButtons
            :id="slotProps.data.id"
            :model-name="$t('page.admin.tags.index.modelName')"
            :name="slotProps.data.title"
            @delete="onDelete"
            @edit="id => navigateTo(`/admin/tags/${id}`)"
          />
        </template>
      </Column>
    </DataTable>
  </div>
</template>

<script setup lang="ts">
import type { DataTableFilterMetaData } from 'primevue/datatable'
import type { InitAdminLayout } from '~/layouts/admin-ui.vue'
import type { Tag } from '~/lib'
import state from '~/lib/admin-state'

const { t } = useI18n()

// 'Filtrage', 'Valeur de filtre par défaut', 'Description de filtre'
const optionalColumnsKeys = ['is_filter', 'default_filter_status', 'filter_description']
const optionalColumns = optionalColumnsKeys.map(column_key => ({
  key: column_key,
  label: t('page.admin.tags.index.column_' + column_key),
}))

const table_key = `dt-state-tags`
const isSmallScreen = useMediaQuery('(max-width: 768px)')
const selectedColumKeys = isSmallScreen.value ? [] : ['is_filter', 'default_filter_status']
state.registerTable(table_key, selectedColumKeys)

definePageMeta({
  layout: 'admin-ui',
})

const initAdminLayout = inject<InitAdminLayout>('initAdminLayout')!
initAdminLayout(
  t('page.admin.tags.index.title'),
  'tag',
  [
    {
      icon: 'add',
      label: t('page.admin.tags.index.newTag'),
      severity: 'success',
      url: `/admin/tags/new`,
    },
  ],
  [
    { label: t('page.admin.tags.index.title'), url: '/admin/tags' },
  ],
)

// Initialize the ref with an empty array, then fetch to update access tokens asynchronously
const tags: Ref<Tag[]> = ref([])
async function refreshTable() {
  await state.fetchTags()
  tags.value = state.tags
}
refreshTable()

const toast = useToast()

async function onDelete(tag_id: string, tag_name: string, onDeleteDone: () => void) {
  try {
    await state.client.deleteTag(tag_id)
    toast.add({
      severity: 'success',
      summary: t('page.admin.tags.index.success'),
      detail: t('page.admin.tags.index.deleteTagSuccess', { tag_name }),
      life: 3000,
    })
    refreshTable()
  }
  catch {
    toast.add({
      severity: 'error',
      summary: t('page.admin.tags.index.error'),
      detail: t('page.admin.tags.index.deleteTagError', { tag_name }),
      life: 3000,
    })
  }
  onDeleteDone()
}
</script>
