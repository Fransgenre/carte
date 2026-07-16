<template>
  <form
    class="flex flex-col gap-4 max-w-[30rem] mx-6"
    @submit.prevent="onSave"
  >
    <AdminInputTextField
      id="title"
      v-model="editedAccessToken.title"
      :label="$t('page.admin.accessTokens.id.title')"
      :variant="hasBeenEdited('title')"
    />

    <div class="flex items-center gap-2">
      <AdminInputTextField
        id="token"
        v-model="editedAccessToken.token"
        :label="$t('page.admin.accessTokens.id.token')"
        :variant="hasBeenEdited('token')"
        class="flex-1"
        :helper-text="$t('page.admin.accessTokens.id.tokenHelperText')"
      />

      <Button
        outlined
        rounded
        type="button"
        class="mx-2"
        :aria-label="$t('page.admin.accessTokens.id.generateUuid')"
        style="align-self: flex-start; margin-top: 2rem;"
        @click="generateUUID"
      >
        <template #icon>
          <AppIcon icon-name="dice" />
        </template>
      </Button>
    </div>

    <AdminInputSwitchField
      id="active"
      v-model="editedAccessToken.active"
      :label="$t('page.admin.accessTokens.id.active')"
    />

    <Divider class="!my-2" />

    <AdminInputSwitchField
      id="list_entities"
      v-model="editedAccessToken.permissions.can_list_entities"
      :label="$t('page.admin.accessTokens.id.canListEntities')"
      :helper-text="$t('page.admin.accessTokens.id.canListEntitiesHelperText')"
    />

    <AdminInputSwitchField
      id="access_entities"
      v-model="editedAccessToken.permissions.can_access_entity"
      :label="$t('page.admin.accessTokens.id.canAccessEntities')"
      :disabled="!editedAccessToken.permissions.can_list_entities"
    />

    <AdminInputSwitchField
      id="add_entity"
      v-model="editedAccessToken.permissions.can_add_entity"
      :label="$t('page.admin.accessTokens.id.canAddEntities')"
    />

    <AdminInputSwitchField
      id="access_comments"
      v-model="editedAccessToken.permissions.can_access_comments"
      :label="$t('page.admin.accessTokens.id.canAccessComments')"
      :disabled="!editedAccessToken.permissions.can_access_entity"
    />

    <AdminInputSwitchField
      id="add_comment"
      v-model="editedAccessToken.permissions.can_add_comment"
      :label="$t('page.admin.accessTokens.id.canAddComments')"
      :disabled="!editedAccessToken.permissions.can_list_entities && !editedAccessToken.permissions.can_add_entity"
    />

    <Divider class="!my-2" />

    <AdminInputSwitchField
      id="list_entities"
      v-model="editedAccessToken.permissions.can_list_without_query"
      :label="$t('page.admin.accessTokens.id.canListWithoutQuery')"
      :helper-text="$t('page.admin.accessTokens.id.canListWithoutQueryHelperText')"
    />

    <AdminInputSwitchField
      id="list_entities"
      v-model="editedAccessToken.permissions.can_list_with_filters"
      :label="$t('page.admin.accessTokens.id.canListWithFilters')"
    />

    <AdminInputSwitchField
      id="list_entities"
      v-model="editedAccessToken.permissions.can_list_with_enum_constraints"
      :label="$t('page.admin.accessTokens.id.canListWithEnumConstraints')"
    />

    <Divider class="!my-2" />

    <AdminInputPolicyPermissionField
      v-model="editedAccessToken.permissions.families_policy"
      :policy-name="'families_policy'"
      :label="$t('page.admin.accessTokens.id.families')"
      :options="families"
    />

    <Divider class="!my-2" />

    <AdminInputPolicyPermissionField
      v-model="editedAccessToken.permissions.categories_policy"
      :policy-name="'categories_policy'"
      :label="$t('page.admin.accessTokens.id.categories')"
      :options="categories"
    />

    <Divider class="!my-2" />

    <AdminInputPolicyPermissionField
      v-model="editedAccessToken.permissions.tags_policy"
      :policy-name="'tags_policy'"
      :label="$t('page.admin.accessTokens.id.tags')"
      :options="tags"
    />

    <Divider class="!my-2" />

    <AdminInputSwitchField
      id="geographic_restriction"
      v-model="geographicRestrictionsOn"
      :label="$t('page.admin.accessTokens.id.geographicRestriction')"
    />
    <span>
      <Button
        v-if="geographicRestrictionsOn"
        :label="$t('page.admin.accessTokens.id.saveGeographicRestriction')"
        @click="() => polygonDrawer!.show()"
      />
    </span>
    <PolygonDrawer
      v-if="geographicRestrictionsOn"
      ref="polygonDrawer"
      v-model:polygon-list="editedAccessToken.permissions.geographic_restrictions as [number, number][][]"
      :max-polygons="3"
    />

    <span class="flex gap-1 justify-end">
      <NuxtLink to="/admin/access-tokens">
        <Button
          :label="$t('page.admin.accessTokens.id.cancel')"
          severity="secondary"
          :loading="processingRequest"
          :disabled="processingRequest"
        />
      </NuxtLink>
      <Button
        :label="$t('page.admin.accessTokens.id.save')"
        type="submit"
        :loading="processingRequest"
        :disabled="isDisabled()"
      />
    </span>
  </form>
</template>

<script setup lang="ts">
import type { InitAdminLayout } from '~/layouts/admin-ui.vue'
import type { NewOrUpdateAccessToken, Permissions } from '~/lib'
import state from '~/lib/admin-state'
import { isValidText } from '~/lib/validation'
import type PolygonDrawerComponent from '~/components/PolygonDrawer.vue'

const { t } = useI18n()

definePageMeta({
  layout: 'admin-ui',
})

const accessTokenId = useRoute().params.id as string
const isNew = (accessTokenId === 'new')

const fetchedAccessToken = isNew ? null : await state.client.getAccessToken(accessTokenId)
const editedAccessToken: Ref<NewOrUpdateAccessToken> = ref(
  isNew
    ? {
        active: true,
        permissions: {
          can_list_entities: true,
          can_access_entity: true,
          can_add_entity: true,
          can_access_comments: true,
          can_add_comment: true,
          can_list_without_query: true,
          can_list_with_enum_constraints: true,
          can_list_with_filters: true,
          categories_policy: {
            allow_all: true,
            allow_list: [],
            force_exclude: [],
          },
          families_policy: {
            allow_all: true,
            allow_list: [],
            force_exclude: [],
          },
          tags_policy: {
            allow_all: true,
            allow_list: [],
            force_exclude: [],
          },
          geographic_restrictions: null,
        },
        title: '',
        token: '',
      }
    : JSON.parse(JSON.stringify(fetchedAccessToken)),
)

const families = state.families
const categories = await state.client.listCategories()
const tags = await state.client.listTags()

const polygonDrawer = ref<InstanceType<typeof PolygonDrawerComponent>>()
const geographicRestrictionsOn = ref(editedAccessToken.value.permissions.geographic_restrictions != null)
watch(geographicRestrictionsOn, (newValue) => {
  if (newValue)
    editedAccessToken.value.permissions.geographic_restrictions = []
  else
    editedAccessToken.value.permissions.geographic_restrictions = null
})

const processingRequest = ref(false)
const toast = useToast()

watch(
  () => editedAccessToken.value.permissions.can_add_entity,
  (newVal) => {
    if (!newVal) {
      editedAccessToken.value.permissions.can_add_comment &&= editedAccessToken.value.permissions.can_list_entities
    }
  },
)

watch(
  () => editedAccessToken.value.permissions.can_list_entities,
  (newVal) => {
    if (!newVal) {
      editedAccessToken.value.permissions.can_access_entity = false
      editedAccessToken.value.permissions.can_list_with_filters = false
      editedAccessToken.value.permissions.can_list_without_query = false
      editedAccessToken.value.permissions.can_list_with_enum_constraints = false
      editedAccessToken.value.permissions.can_add_comment &&= editedAccessToken.value.permissions.can_add_entity
    }
  },
)

watch(
  () => editedAccessToken.value.permissions.can_access_entity,
  (newVal) => {
    if (!newVal) {
      editedAccessToken.value.permissions.can_access_comments = false
    }
  },
)

const initAdminLayout = inject<InitAdminLayout>('initAdminLayout')!
initAdminLayout(
  isNew ? t('page.admin.accessTokens.id.newTokenTitle') : t('page.admin.accessTokens.id.editTokenTitle', { title: fetchedAccessToken!.title }),
  'accessToken',
  [],
  [
    { label: t('page.admin.accessTokens.id.breadCrumb'), url: '/admin/access-tokens' },
    (
      isNew
        ? { label: t('page.admin.accessTokens.id.newTokenTitle'), url: `/admin/access-tokens/new` }
        : { label: t('page.admin.accessTokens.id.editTokenTitle', { title: fetchedAccessToken!.title }), url: `/admin/access-tokens/${accessTokenId}` }
    ),
  ],
)

function isDisabled() {
  return processingRequest.value
    || !isValidText(editedAccessToken.value.title)
    || !isValidText(editedAccessToken.value.token)
    || (
      editedAccessToken.value.permissions.geographic_restrictions != null
      && editedAccessToken.value.permissions.geographic_restrictions.length == 0
    )
}

function hasBeenEdited(field: keyof NewOrUpdateAccessToken) {
  return isNew ? false : editedAccessToken.value[field] !== fetchedAccessToken![field]
}

async function onSave() {
  processingRequest.value = true
  try {
    updatePolicies(editedAccessToken.value.permissions)

    if (isNew) {
      await state.client.createAccessToken(editedAccessToken.value)
      toast.add({
        severity: 'success',
        summary: t('page.admin.accessTokens.id.success'),
        detail: t('page.admin.accessTokens.id.createTokenSuccess'),
        life: 3000,
      })
    }
    else {
      await state.client.updateAccessToken(accessTokenId, editedAccessToken.value)
      toast.add({
        severity: 'success',
        summary: t('page.admin.accessTokens.id.success'),
        detail: t('page.admin.accessTokens.id.editTokenSuccess'),
        life: 3000,
      })
    }

    navigateTo('/admin/access-tokens')
  }
  catch {
    toast.add({
      severity: 'error',
      summary: t('page.admin.accessTokens.id.error'),
      detail: t('page.admin.accessTokens.id.editTokenError'),
      life: 3000,
    })
  }
  processingRequest.value = false
}

function updatePolicies(permissions: Permissions) {
  for (const policy of ['families_policy', 'categories_policy', 'tags_policy'] as ('families_policy' | 'categories_policy' | 'tags_policy')[]) {
    if (permissions[policy].allow_all) {
      permissions[policy].allow_list = []
    }
    else {
      permissions[policy].force_exclude = []
    }
  }
}

// ajout fonction génération UUID
function generateUUID() {
  editedAccessToken.value.token = crypto.randomUUID()
}
</script>
