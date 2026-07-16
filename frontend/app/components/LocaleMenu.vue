<template>
  <Button
    v-bind="$attrs"
    severity="secondary"
    outlined
    aria-haspopup="true"
    aria-controls="localeMenu"
    @click="toggleLocaleMenu"
  >
    <template #icon>
      <AppIcon icon-name="i18n" />
    </template>
  </Button>

  <Menu
    id="localeMenu"
    ref="localeMenu"
    :model="items"
    :popup="true"
  />
</template>

<script setup lang="ts">
import type Menu from 'primevue/menu'
import type { MenuItem } from 'primevue/menuitem'

defineOptions({
  inheritAttrs: false,
})

const { t, locale: currentLocale, locales, setLocale } = useI18n()

const localeMenu = ref<InstanceType<typeof Menu> | null>(null)

function toggleLocaleMenu(event: Event) {
  localeMenu.value?.toggle(event)
}

const items = computed(() => [
  {
    label: t('cmp.localeMenu.chooseLanguage'),
    items: locales.value.map((locale): MenuItem => ({
      label: locale.name,
      disabled: currentLocale.value == locale.code,
      command: () => {
        setLocale(locale.code)
      },
    })),
  },
])
</script>
