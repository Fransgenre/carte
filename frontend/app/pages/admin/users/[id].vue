<template>
  <form
    class="flex flex-col gap-4 max-w-[30rem] mx-6"
    @submit.prevent="onSave"
  >
    <AdminInputTextField
      id="username"
      v-model="user.name"
      :label="$t('page.admin.users.id.name')"
    />

    <AdminInputSwitchField
      id="userIsAdmin"
      v-model="user.is_admin"
      :label="$t('page.admin.users.id.isAdmin')"
      :disabled="state.username == user.name"
    />

    <AdminInputSwitchField
      v-if="!isNew"
      id="editPassword"
      v-model="editPassword"
      :label="$t('page.admin.users.id.editPassword')"
    />

    <div
      :hidden="!editPassword"
      class="flex-col gap-4"
      :class="{ flex: isNew || editPassword }"
    >
      <label for="password">
        {{ $t('page.admin.users.id.passwordLabel') }}
      </label>
      <Password
        v-model="newPassword"
        input-id="password"
        toggle-mask
        class="-mt-2"
        input-class="w-full"
        :invalid="editPassword && !isValidText(newPassword)"
      />
      <label for="passwordConfirm">
        {{ $t('page.admin.users.id.confirmPasswordLabel') }}
      </label>
      <Password
        v-model="newPasswordConfirm"
        input-id="passwordConfirm"
        toggle-mask
        class="-mt-2"
        input-class="w-full"
        :invalid="editPassword && newPassword!=newPasswordConfirm"
      />
    </div>

    <span class="flex gap-1 justify-end   ">
      <NuxtLink
        to="/admin/users"
      >
        <Button
          :label="$t('page.admin.users.id.cancel')"
          severity="secondary"
          :loading="processingRequest"
          :disabled="processingRequest"
        />
      </NuxtLink>
      <Button
        :label="$t('page.admin.users.id.save')"
        type="submit"
        :loading="processingRequest"
        :disabled="isDisabled()"
      />
    </span>
  </form>
</template>

<script setup lang="ts">
import type { InitAdminLayout } from '~/layouts/admin-ui.vue'
import type { NewOrUpdatedUser } from '~/lib'
import state from '~/lib/admin-state'
import { isValidText } from '~/lib/validation'

const { t } = useI18n()

if (!state.is_admin)
  navigateTo('/admin/home')

const userId = useRoute().params.id as string

const isNew = (userId === 'new')

const user = ref(isNew
  ? { name: '', is_admin: false }
  : await state.client.getUser(userId),
)

const editPassword = ref(isNew)
const newPassword = ref('')
const newPasswordConfirm = ref('')

const processingRequest = ref(false)
const toast = useToast()

definePageMeta({
  layout: 'admin-ui',
})

function isDisabled() {
  return processingRequest.value
    || (editPassword.value && (newPassword.value != newPasswordConfirm.value || !isValidText(newPassword.value)))
    || !isValidText(user.value.name)
}

const initAdminLayout = inject<InitAdminLayout>('initAdminLayout')!
initAdminLayout(
  isNew
    ? t('page.admin.users.id.newUserTitle')
    : t('page.admin.users.id.editUserTitle', { name: user.value.name }),
  'user',
  [],
  [
    { label: t('page.admin.users.id.users'), url: '/admin/users' },
    (isNew
      ? { label: t('page.admin.users.id.newUserTitle'), url: '/admin/users/new' }
      : { label: t('page.admin.users.id.editUserTitle', { name: user.value.name }), url: `/admin/users/${userId}` }
    ),
  ],
)

async function onSave() {
  processingRequest.value = true
  try {
    const newUser: NewOrUpdatedUser = {
      is_admin: user.value.is_admin, name: user.value.name }

    if (editPassword.value || isNew) {
      if ((newPassword.value != newPasswordConfirm.value || !newPassword.value))
        throw new Error('Empty or non-matching password')

      newUser['password'] = newPassword.value
    }

    if (isNew) {
      await state.client.createUser(newUser)
      navigateTo('/admin/users')
      toast.add({
        severity: 'success',
        summary: t('page.admin.users.id.success'),
        detail: t('page.admin.users.id.editUserSuccess'),
        life: 3000,
      })
    }
    else {
      await state.client.updateUser(userId, newUser)

      if (state.username == user.value.name) {
        state.logout()
      }

      navigateTo('/admin/users')
      toast.add({
        severity: 'success',
        summary: t('page.admin.users.id.success'),
        detail: t('page.admin.users.id.editUserSuccess'),
        life: 3000,
      })
    }
  }
  catch {
    toast.add({
      severity: 'error',
      summary: t('page.admin.users.id.error'),
      detail: t('page.admin.users.id.editUserError'),
      life: 3000,
    })
  }
  processingRequest.value = false
}
</script>
