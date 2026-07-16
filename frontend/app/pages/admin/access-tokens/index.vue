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
          :placeholder="$t('page.admin.accessTokens.index.searchPlaceholder')"
        />
      </IconField>
      <MultiSelect
        v-model="state.tablesSelectedColumns[table_key]"
        :options="optionalColumns"
        option-label="label"
        option-value="key"
        display="chip"
        :placeholder="$t('page.admin.accessTokens.index.selectColumns')"
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
      :current-page-report-template="$t('page.admin.accessTokens.index.currentPageReport')"
      :value="accessTokens"
      striped-rows
      :rows="10"
      :rows-per-page-options="[5, 10, 20, 50]"
      removable-sort
      :global-filter-fields="['title', 'token']"
      filter-match-mode="contains"
    >
      <Column
        field="title"
        :header="$t('page.admin.accessTokens.index.column_title')"
        sortable
      />
      <Column
        v-if="state.tablesSelectedColumns[table_key]!.includes('token')"
        field="token"
        :header="$t('page.admin.accessTokens.index.column_token')"
      />
      <Column
        :header="$t('page.admin.accessTokens.index.column_active')"
        field="active"
        sortable
      >
        <template #body="slotProps">
          <Tag
            :value="slotProps.data.active ? $t('page.admin.accessTokens.index.yes') : $t('page.admin.accessTokens.index.no')"
            :severity="slotProps.data.active ? 'success' : 'danger'"
          />
        </template>
      </Column>

      <Column
        v-if="state.tablesSelectedColumns[table_key]!.includes('last_week_visits')"
        field="last_week_visits"
        :header="$t('page.admin.accessTokens.index.column_last_week_visits')"
        class="max-w-32 "
        sortable
      />

      <Column
        v-if="state.tablesSelectedColumns[table_key]!.includes('permissions_families_policy')"
        :header="$t('page.admin.accessTokens.index.column_permissions_families_policy')"
        :field="(data: any) => all_included(data.permissions.families_policy).toString()"
        sortable
      >
        <template #body="slotProps">
          <Tag
            :value="all_included(slotProps.data.permissions.families_policy) ? $t('page.admin.accessTokens.index.all') : $t('page.admin.accessTokens.index.partial')"
            :severity="all_included(slotProps.data.permissions.families_policy) ? 'success' : 'warning'"
          />
        </template>
      </Column>

      <Column
        v-if="state.tablesSelectedColumns[table_key]!.includes('permissions_categories_policy')"
        :header="$t('page.admin.accessTokens.index.column_permissions_categories_policy')"
        :field="(data: any) => all_included(data.permissions.categories_policy).toString()"
        sortable
      >
        <template #body="slotProps">
          <Tag
            :value="all_included(slotProps.data.permissions.categories_policy) ? $t('page.admin.accessTokens.index.all') : $t('page.admin.accessTokens.index.partial')"
            :severity="all_included(slotProps.data.permissions.categories_policy) ? 'success' : 'warning'"
          />
        </template>
      </Column>

      <Column
        v-if="state.tablesSelectedColumns[table_key]!.includes('permissions_tags_policy')"
        :header="$t('page.admin.accessTokens.index.column_permissions_tags_policy')"
        :field="data => all_included(data.permissions.tags_policy).toString()"
        sortable
      >
        <template #body="slotProps">
          <Tag
            :value="all_included(slotProps.data.permissions.tags_policy) ? $t('page.admin.accessTokens.index.all') : $t('page.admin.accessTokens.index.partial')"
            :severity="all_included(slotProps.data.permissions.tags_policy) ? 'success' : 'warning'"
          />
        </template>
      </Column>

      <Column
        v-if="state.tablesSelectedColumns[table_key]!.includes('permissions_can_access_comments')"
        :header="$t('page.admin.accessTokens.index.column_permissions_can_access_comments')"
        field="permissions.can_access_comments"
        sortable
      >
        <template #body="slotProps">
          <Tag
            :value="slotProps.data.permissions.can_access_comments ? $t('page.admin.accessTokens.index.yes') : $t('page.admin.accessTokens.index.no')"
            :severity="slotProps.data.permissions.can_access_comments ? 'success' : 'danger'"
          />
        </template>
      </Column>

      <Column>
        <template #body="slotProps">
          <Button
            outlined
            rounded
            class="mx-2"
            severity="success"
            @click="viewDetails(slotProps.data.id)"
          >
            <template #icon>
              <AppIcon icon-name="stats" />
            </template>
          </Button>

          <AdminEditDeleteButtons
            :id="slotProps.data.id"
            :model-name="$t('page.admin.accessTokens.index.modelName')"
            :name="slotProps.data.title"
            @delete="onDelete"
            @edit="id => navigateTo(`/admin/access-tokens/${id}`)"
          />
        </template>
      </Column>
    </DataTable>
  </div>
</template>

<script setup lang="ts">
import type { DataTableFilterMetaData } from 'primevue/datatable'
import type { InitAdminLayout } from '~/layouts/admin-ui.vue'
import type { AccessToken, PermissionPolicy } from '~/lib'
import state from '~/lib/admin-state'

const { t } = useI18n()

const optionalColumnsKeys = ['token', 'last_week_visits', 'permissions_families_policy',
  'permissions_categories_policy', 'permissions_tags_policy', 'permissions_can_access_comments']
const optionalColumns = optionalColumnsKeys.map(column_key => ({
  key: column_key,
  label: t('page.admin.accessTokens.index.column_' + column_key),
}))

const table_key = `dt-state-access-tokens`
const isSmallScreen = useMediaQuery('(max-width: 768px)')
const selectedColumKeys = isSmallScreen.value ? [] : ['last_week_visits']
state.registerTable(table_key, selectedColumKeys)

function all_included(permissionPolicy: PermissionPolicy) {
  return permissionPolicy.allow_all && !permissionPolicy.force_exclude.length
}

definePageMeta({
  layout: 'admin-ui',
})

const initAdminLayout = inject<InitAdminLayout>('initAdminLayout')!
initAdminLayout(
  t('page.admin.accessTokens.index.title'),
  'accessToken',
  [
    {
      icon: 'add',
      label: t('page.admin.accessTokens.index.newToken'),
      severity: 'success',
      url: `/admin/access-tokens/new`,
    },
  ],
  [
    { label: t('page.admin.accessTokens.index.title'), url: '/admin/access-tokens' },
  ],
)

// Initialize the ref with an empty array, then fetch to update access tokens asynchronously
const accessTokens: Ref<AccessToken[]> = ref([])
async function refreshTable() {
  accessTokens.value = await state.client.listAccessTokens()
}
refreshTable()

const toast = useToast()

async function onDelete(access_token_id: string, access_token_name: string, onDeleteDone: () => void) {
  try {
    await state.client.deleteAccessToken(access_token_id)
    toast.add({
      severity: 'success',
      summary: t('page.admin.accessTokens.index.success'),
      detail: t('page.admin.accessTokens.index.deleteTokenSuccess', { access_token_name }),
      life: 3000,
    })
    refreshTable()
  }
  catch {
    toast.add({
      severity: 'error',
      summary: t('page.admin.accessTokens.index.error'),
      detail: t('page.admin.accessTokens.index.deleteTokenError', { access_token_name }),
      life: 3000,
    })
  }
  onDeleteDone()
}

function viewDetails(access_token_id: string) {
  navigateTo(`/admin/access-tokens/details/${access_token_id}`)
}
</script>
