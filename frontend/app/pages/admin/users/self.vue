<template>
  <form
    class="flex flex-col gap-4 max-w-[30rem] mx-6"
    @submit.prevent="onSave"
  >
    <span class="font-medium">{{ $t('page.admin.users.self.username') }}: <span class="font-normal"> {{ state.username }} </span></span>

    <span class="font-medium">{{ $t('page.admin.users.self.state') }}: <span class="font-normal"> {{ state.is_admin ? $t('page.admin.users.self.stateAdmin') : $t('page.admin.users.self.stateModerator') }} </span></span>

    <AdminInputSwitchField
      id="editPassword"
      v-model="editPassword"
      :label="$t('page.admin.users.self.editPasswordLabel')"
    />

    <div
      :hidden="!editPassword"
      class="flex-col gap-4"
      :class="{ flex: editPassword }"
    >
      <label
        for="password"
        class="font-medium"
      >
        {{ $t('page.admin.users.self.newPasswordLabel') }}:
      </label>
      <Password
        v-model="newPassword"
        input-id="password"
        :disabled="!editPassword"
        toggle-mask
        class=" -mt-2"
        input-class="w-full"
        :invalid="editPassword && !isValidText(newPassword)"
      />
      <label
        for="passwordConfirm"
        class="font-medium"
      >
        {{ $t('page.admin.users.self.newPasswordConfirmLabel') }}:
      </label>
      <Password
        v-model="newPasswordConfirm"
        input-id="passwordConfirm"
        :disabled="!editPassword"
        toggle-mask
        class="-mt-2"
        input-class="w-full"
        :invalid="editPassword && newPassword!=newPasswordConfirm"
      />
    </div>

    <span class="flex gap-1 justify-end   ">
      <NuxtLink
        to="/admin/"
      >
        <Button
          :label="$t('page.admin.users.self.backButton')"
          severity="secondary"
          :loading="processingRequest"
          :disabled="processingRequest"
        />
      </NuxtLink>
      <Button
        v-if="editPassword"
        :label="$t('page.admin.users.self.saveButton')"
        type="submit"
        :loading="processingRequest"
        :disabled="processingRequest || (newPassword!=newPasswordConfirm || !isValidText(newPassword))"
      />
    </span>
  </form>
</template>

<script setup lang="ts">
import type { InitAdminLayout } from '~/layouts/admin-ui.vue'
import state from '~/lib/admin-state'
import { isValidText } from '~/lib/validation'

const editPassword = ref(false)
const newPassword = ref('')
const newPasswordConfirm = ref('')

const processingRequest = ref(false)
const toast = useToast()
const { t } = useI18n()

definePageMeta({
  layout: 'admin-ui',
})

const initAdminLayout = inject<InitAdminLayout>('initAdminLayout')!
initAdminLayout(
  t('page.admin.users.self.sectionName'),
  'user',
  [],
  [
    { label: t('page.admin.users.self.sectionName'), url: `/admin/users/self` },
  ],
)

async function onSave() {
  processingRequest.value = true
  try {
    await state.client.changeSelfPassword({ is_admin: state.is_admin!, name: state.username!, password: newPassword.value })
    editPassword.value = false
    toast.add({ severity: 'success', summary: t('page.admin.users.self.editPassword.success.summary'), detail: t('page.admin.users.self.editPassword.success.details'), life: 3000 })
  }
  catch {
    toast.add({ severity: 'error', summary: t('page.admin.users.self.editPassword.error.summary'), detail: t('page.admin.users.self.editPassword.error.details'), life: 3000 })
  }
  processingRequest.value = false
}
</script>
