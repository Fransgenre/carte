<template>
  <div>
    <span class="flex gap-6 items-end mb-4 flex-wrap">
      <form @submit.prevent="refreshTable">
        <InputGroup class="h-10">
          <InputText
            v-model="state.tablesQueryParams[table_key]!.search_query"
            :placeholder="$t('page.admin.familyId.entities.index.searchPlaceholder')"
          />

          <Button
            type="button"
            severity="warn"
            :label="$t('page.admin.familyId.entities.index.filtersLabel')"
            @click="(event: Event) => filters_overlay?.toggle(event)"
          >
            <template #icon>
              <AppIcon
                class="mr-1"
                icon-name="filter"
              />
            </template>
          </Button>

          <Button type="submit">
            <template #icon>
              <AppIcon icon-name="search" />
            </template>
          </Button>
        </InputGroup>
      </form>
      <MultiSelect
        v-model="state.tablesSelectedColumns[table_key]"
        :options="optionalColumns"
        option-label="label"
        option-value="key"
        display="chip"
        :placeholder="$t('page.admin.familyId.entities.index.selectColumns')"
        class="w-full md:w-80 h-10"
      />
    </span>

    <DataTable
      :key="tableKeyRefresh"
      :rows="state.tablesQueryParams[table_key]!.pageSize"
      :first="firstRow"
      lazy
      paginator
      paginator-template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown CurrentPageReport"
      :current-page-report-template="$t('page.admin.familyId.entities.index.currentPageReport')"
      data-key="id"
      :value="currentEntitiesResults?.entities"
      :total-records="currentEntitiesResults?.total_results"
      striped-rows
      :rows-per-page-options="[5, 10, 20, 50]"
      removable-sort
      @page="onPage"
    >
      <Column
        field="display_name"
        :header="$t('page.admin.familyId.entities.index.column_display_name')"
        class="max-w-[25rem]"
      />
      <Column
        v-if="state.tablesSelectedColumns[table_key]!.includes('category_id')"
        field="category_id"
        :header="$t('page.admin.familyId.entities.index.column_category_id')"
      >
        <template #body="slotProps">
          <CategoryTag :category="state.categoryRecord[slotProps.data.category_id]!" />
        </template>
      </Column>
      <Column
        v-if="state.tablesSelectedColumns[table_key]!.includes('tags')"
        field="tags"
        :header="$t('page.admin.familyId.entities.index.column_tags')"
        class="max-w-72"
      >
        <template #body="slotProps">
          <DisplayedTag
            v-for="tag_id in slotProps.data.tags_ids.slice(0, max_tags_displayed)"
            :key="tag_id"
            :tag="state.tagRecord[tag_id]!"
            class="m-1"
          />
          <Badge
            v-if="slotProps.data.tags_ids.length > max_tags_displayed"
            ref="opener"
            :value="`+${slotProps.data.tags_ids.length - max_tags_displayed}`"
            severity="info"
            @mouseover="(event: Event) => {
              tooltip_excess_tags = slotProps.data.tags_ids.slice(max_tags_displayed)
              tags_tooltip!.show(event)
            }"
            @mouseleave="() => tags_tooltip!.hide()"
          />
        </template>
      </Column>
      <Column
        v-if="state.tablesSelectedColumns[table_key]!.includes('hidden')"
        field="hidden"
        :header="$t('page.admin.familyId.entities.index.column_hidden')"
      >
        <template #body="slotProps">
          <Tag
            :value="slotProps.data.hidden ? $t('page.admin.familyId.entities.index.hidden') : $t('page.admin.familyId.entities.index.visible')"
            :severity="slotProps.data.hidden ? 'error' : 'success'"
          />
        </template>
      </Column>
      <Column>
        <template #body="slotProps">
          <AdminEditDeleteButtons
            :id="slotProps.data.entity_id"
            :model-name="$t('page.admin.familyId.entities.index.modelName')"
            :name="slotProps.data.display_name"
            @delete="onDelete"
            @edit="id => navigateTo(`/admin/${familyId}/entities/${id}?entitiesUrl=entities`)"
          />
        </template>
      </Column>
    </DataTable>

    <Popover
      ref="tags_tooltip"
    >
      <DisplayedTag
        v-for="tag_id in tooltip_excess_tags"
        :key="tag_id"
        :tag="state.tagRecord[tag_id]!"
        class="m-1"
      />
    </Popover>

    <Popover ref="filters_overlay">
      <ViewerFilterConfig
        v-model:filtering-tags="state.tablesQueryParams[table_key]!.tagFilteringList!"
        v-model:filtering-categories="state.tablesQueryParams[table_key]!.categoryFilteringList!"
        v-model:filtering-enums="state.tablesQueryParams[table_key]!.enumsFilteringList!"
        class="w-[25rem] md:w-[30rem]"
        @filters-changed="refreshTable"
      />
    </Popover>
  </div>
</template>

<script setup lang="ts">
import type { PageState } from 'primevue/paginator'
import DisplayedTag from '~/components/DisplayedTag.vue'
import type { InitAdminLayout } from '~/layouts/admin-ui.vue'
import type { AdminPaginatedCachedEntities } from '~/lib'
import state from '~/lib/admin-state'

const { t } = useI18n()
const tableKeyRefresh = ref(0)
const max_tags_displayed = 2
const familyId = useRoute().params.familyId as string
if (state.families == null) {
  await state.fetchFamilies()
}
if (state.categories == null) {
  await state.fetchCategories()
}
if (state.tags == null) {
  await state.fetchTags()
}

const family = state.familyRecord[familyId]!
const familyTitle = family.title

const filters_overlay = useTemplateRef('filters_overlay')
const tags_tooltip = useTemplateRef('tags_tooltip')
const tooltip_excess_tags: Ref<undefined | string[]> = ref(undefined)

const firstRow = ref(0)

// 'Catégorie', 'Tags', 'Visibilité'
const optionalColumnsKeys = ['category_id', 'tags', 'hidden']
const optionalColumns = optionalColumnsKeys.map(column_key => ({
  key: column_key,
  label: t('page.admin.familyId.entities.index.column_' + column_key),
}))

const table_key = `dt-state-entities-${familyId}`
const isSmallScreen = useMediaQuery('(max-width: 768px)')
const selectedColumKeys = isSmallScreen.value ? [] : ['category_id', 'tags', 'hidden']
state.registerTable(table_key, selectedColumKeys)

if (!(table_key in state.tablesQueryParams)) {
  state.tablesQueryParams[table_key] = {
    search_query: '',
    currentPage: 1,
    pageSize: 20,
    categoryFilteringList: state.categories
      .filter(category => category.family_id == familyId)
      .map(category => ({ ...category, active: true })),
    tagFilteringList: state.tags.map(tag => ({ ...tag, active: null })),
    enumsFilteringList: family.entity_form.fields
      .filter(f => f.indexed && (f.field_type === 'EnumMultiOption' || f.field_type === 'EnumSingleOption'))
      .map((f) => {
        return {
          key: f.key,
          title: f.display_name,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          values: (f.field_type_metadata as any).options.map((v: any) => {
            return {
              label: v.label,
              value: v.value,
            }
          }),
          active: [],
        }
      }),
  }
}
else {
  firstRow.value = (state.tablesQueryParams[table_key]!.currentPage - 1) * state.tablesQueryParams[table_key]!.pageSize
}

let forceFullRefresh = false

watch(() => [
  state.tablesQueryParams[table_key]!.search_query,
  state.tablesQueryParams[table_key]!.categoryFilteringList!.map(c => c.active),
  state.tablesQueryParams[table_key]!.tagFilteringList!.map(t => t.active),
  state.tablesQueryParams[table_key]!.enumsFilteringList!.map(e => e.active),
], () => {
  forceFullRefresh = true
},
{ flush: 'sync' })

const currentEntitiesResults: Ref<AdminPaginatedCachedEntities | null> = ref(null)
async function refreshTable() {
  if (forceFullRefresh) {
    state.tablesQueryParams[table_key]!.currentPage = 1
    firstRow.value = 0
    tableKeyRefresh.value++
    forceFullRefresh = false
  }

  currentEntitiesResults.value = await state.client.searchEntities(
    { page: state.tablesQueryParams[table_key]!.currentPage, page_size: state.tablesQueryParams[table_key]!.pageSize },
    {
      search: state.tablesQueryParams[table_key]!.search_query,
      family: familyId,
      active_categories_ids: state.tablesQueryParams[table_key]!.categoryFilteringList!.filter(t => t.active).map(t => t.id),
      required_tags_ids: state.tablesQueryParams[table_key]!.tagFilteringList!.filter(t => t.active).map(t => t.id),
      excluded_tags_ids: state.tablesQueryParams[table_key]!.tagFilteringList!.filter(t => t.active === false).map(t => t.id),
      enums_constraints: Object
        .fromEntries(
          state.tablesQueryParams[table_key]!.enumsFilteringList!
            .filter(f => f.active.length > 0)
            .map(f => [f.key, f.active]),
        ),
    },
  )
  currentEntitiesResults.value.entities.forEach((entity) => {
    entity.tags_ids.sort((a, b) => {
      const tagA = state.tagRecord[a], tagB = state.tagRecord[b]
      if (!tagA) return 1
      if (!tagB) return -1
      return tagA.title.localeCompare(tagB.title)
    })
  })
}

await refreshTable()

async function onPage(event: PageState) {
  state.tablesQueryParams[table_key]!.currentPage = event.page + 1
  state.tablesQueryParams[table_key]!.pageSize = event.rows
  await refreshTable()
}

definePageMeta({
  layout: 'admin-ui',
})

const initAdminLayout = inject<InitAdminLayout>('initAdminLayout')!
initAdminLayout(
  t('page.admin.familyId.entities.index.title'),
  'entity',
  [
    {
      icon: 'add',
      label: t('page.admin.familyId.entities.index.newEntity'),
      severity: 'success',
      url: `/admin/${familyId}/entities/new?entitiesUrl=entities`,
    },
  ],
  [
    { label: `${familyTitle}`, url: '/admin/families' },
    { label: t('page.admin.familyId.entities.index.title'), url: `/admin/${familyId}/entities` },
  ],
)

const toast = useToast()

async function onDelete(entity_id: string, entity_name: string, onDeleteDone: () => void) {
  try {
    await state.client.deleteEntity(entity_id)
    toast.add({
      severity: 'success',
      summary: t('page.admin.familyId.entities.index.success'),
      detail: t('page.admin.familyId.entities.index.deleteEntitySuccess', { entity_name }),
      life: 3000,
    })
    refreshTable()
  }
  catch {
    toast.add({
      severity: 'error',
      summary: t('page.admin.familyId.entities.index.error'),
      detail: t('page.admin.familyId.entities.index.deleteEntityError', { entity_name }),
      life: 3000,
    })
  }
  onDeleteDone()
}
</script>
