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
          :placeholder="$t('page.admin.users.index.searchPlaceholder')"
        />
      </IconField>
      <MultiSelect
        v-model="state.tablesSelectedColumns[table_key]"
        :options="optionalColumns"
        option-label="label"
        option-value="key"
        display="chip"
        :placeholder="$t('page.admin.users.index.selectColumns')"
        class="w-full md:w-80"
      />
    </span>
    <DataTable
      v-model:filters="state.tablesFilters[table_key]"
      paginator
      paginator-template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown CurrentPageReport"
      :current-page-report-template="$t('page.admin.users.index.currentPageReport')"
      :value="users"
      striped-rows
      state-storage="session"
      :state-key="table_key"
      data-key="id"
      :rows="10"
      :rows-per-page-options="[10, 20, 50]"
      removable-sort
      :global-filter-fields="['name', 'id']"
    >
      <Column
        :header="$t('page.admin.users.index.column_name')"
        sortable
      >
        <template #body="slotProps">
          <div class="flex items-center justify-content-begin gap-2">
            <AdminUserAvatar
              :username="slotProps.data.name"
              size="normal"
            />
            {{ slotProps.data.name }}
          </div>
        </template>
      </Column>
      <Column
        v-if="state.tablesSelectedColumns[table_key]!.includes('is_admin')"
        :header="$t('page.admin.users.index.column_is_admin')"
        field="is_admin"
        sortable
      >
        <template #body="slotProps">
          <Tag
            :value="slotProps.data.is_admin ? $t('page.admin.users.index.admin') : $t('page.admin.users.index.moderator')"
            :severity="slotProps.data.is_admin ? 'success' : 'warning'"
          />
        </template>
      </Column>

      <Column
        v-if="state.tablesSelectedColumns[table_key]!.includes('last_login')"
        field="last_login"
        :header="$t('page.admin.users.index.column_last_login')"
      >
        <template #body="slotProps">
          {{ $d(new Date(slotProps.data.last_login), { dateStyle: 'short', timeStyle: 'medium' }) }}
        </template>
      </Column>

      <Column>
        <template #body="slotProps">
          <AdminEditDeleteButtons
            :id="slotProps.data.id"
            :model-name="$t('page.admin.users.index.modelName')"
            :name="slotProps.data.name"
            :prevent-delete="state.username == slotProps.data.name"
            @delete="onDelete"
            @edit="id => navigateTo(`/admin/users/${id}`)"
          />
        </template>
      </Column>
    </DataTable>
  </div>
</template>

<script setup lang="ts">
import type { DataTableFilterMetaData } from 'primevue/datatable'
import type { InitAdminLayout } from '~/layouts/admin-ui.vue'
import type { User } from '~/lib'
import state from '~/lib/admin-state'

const { t } = useI18n()

// 'Droits', 'Connection'
const optionalColumnsKeys = ['is_admin', 'last_login']
const optionalColumns = optionalColumnsKeys.map(column_key => ({
  key: column_key,
  label: t('page.admin.users.index.column_' + column_key),
}))

const table_key = `dt-users`
const isSmallScreen = useMediaQuery('(max-width: 768px)')
const selectedColumKeys = isSmallScreen.value ? [] : ['is_admin', 'last_login']
state.registerTable(table_key, selectedColumKeys)

definePageMeta({
  layout: 'admin-ui',
})

if (!state.is_admin)
  navigateTo('/admin/home')

const initAdminLayout = inject<InitAdminLayout>('initAdminLayout')!
initAdminLayout(
  t('page.admin.users.index.title'),
  'user',
  [
    {
      icon: 'add',
      label: t('page.admin.users.index.newUser'),
      severity: 'success',
      url: `/admin/users/new`,
    },
  ],
  [
    { label: t('page.admin.users.index.title'), url: '/admin/users' },
  ],
)

// Initialize the ref with an empty array, then fetch to update access tokens asynchronously
const users: Ref<User[]> = ref([])
async function refreshTable() {
  users.value = await state.client.listUsers()
}
refreshTable()

const toast = useToast()

async function onDelete(user_id: string, user_name: string, onDeleteDone: () => void) {
  try {
    await state.client.deleteUser(user_id)
    toast.add({
      severity: 'success',
      summary: t('page.admin.users.index.success'),
      detail: t('page.admin.users.index.deleteUserSuccess', { user_name }),
      life: 3000,
    })
    refreshTable()
  }
  catch {
    toast.add({
      severity: 'error',
      summary: t('page.admin.users.index.error'),
      detail: t('page.admin.users.index.deleteUserError', { user_name }),
      life: 3000,
    })
  }
  onDeleteDone()
}
</script>
