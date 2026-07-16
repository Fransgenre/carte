<template>
  <Toolbar
    ref="navbarRef"
    class="admin-navbar mb-2 coco-text top-0 left-0 fixed w-full"
  >
    <template #start>
      <div class="flex items-center">
        <Button
          outlined
          severity="secondary"
          small
          class="!p-1 !mr-2"
          style="color: white; border-color: white"
          @click="
            () => {
              emit('toggleSidebar');
            }
          "
        >
          <template #default>
            <AppIcon
              icon-name="menu"
              size="24px"
            />
          </template>
        </Button>

        <NuxtLink
          to="/admin"
          class="ml-1"
        >
          <img
            height="40"
            width="40"
            :alt="$t('cmp.admin.navbar.safehaven')"
            :src="safehaven_logo"
          >
        </NuxtLink>
        <div class="navbar-text pl-4">
          <div class="my-0 text-lg font-extrabold">
            {{ $t('cmp.admin.navbar.safehaven') }}
          </div>
          <div class="text-xs italic">
            {{ state.options.general.title }}
          </div>
        </div>
      </div>
    </template>

    <template #center />

    <template #end>
      <Button
        severity="secondary"
        outlined
        style="color: white; border-color: white"
        @click="toggleDarkMode()"
      >
        <template #icon>
          <AppIcon icon-name="lightDark" />
        </template>
      </Button>

      <LocaleMenu
        class="ml-2"
        style="color: white; border-color: white;"
      />

      <Button
        rounded
        severity="secondary"
        class="p-0 mx-2"
        aria-haspopup="true"
        aria-controls="accountMenu"
        @click="toggleAccountMenu"
      >
        <template #default>
          <AdminUserAvatar
            :username="state.username ?? $t('cmp.admin.navbar.loggedOut')"
            size="normal"
          />
        </template>
      </Button>

      <Menu
        id="accountMenu"
        ref="accountMenu"
        :model="items"
        :popup="true"
      />
    </template>
  </Toolbar>
</template>

<script setup lang="ts">
import state from '~/lib/admin-state'
import safehaven_logo from '~/assets/logo_square_white.svg'

const emit = defineEmits(['toggleSidebar'])
const darkMode = useDarkMode()
const { t } = useI18n()

const accountMenu = useTemplateRef('accountMenu')
const navbarRef: Ref<HTMLElement | null> = ref(null)

try {
  await state.check_login()
  await state.fetchConfig()
}
catch {
  // Do nothing
}

const items = [
  {
    label: state.username!,
    items: [
      {
        label: t('cmp.admin.navbar.myAccount'),
        command: () => {
          navigateTo('/admin/users/self')
        },
      },
      {
        label: t('cmp.admin.navbar.logout'),
        command: () => {
          state.logout()
        },
      },
    ],
  },
]

function toggleAccountMenu(event: Event) {
  accountMenu.value?.toggle(event)
}

function toggleDarkMode() {
  darkMode.toggle()
}
</script>

<style>
.admin-navbar {
  background-color: #e86ba7 !important;
  border-radius: 0 !important;
  border-left-width: 0 !important;
  border-right-width: 0 !important;
  border-top-width: 0 !important;
  z-index: 1000 !important;
}

.navbar-text {
  color: white;
}
</style>
