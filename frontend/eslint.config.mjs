// @ts-check
import stylistic from '@stylistic/eslint-plugin'
import withNuxt from './.nuxt/eslint.config.mjs'
import vueI18n from '@intlify/eslint-plugin-vue-i18n'

export default withNuxt(
  {
    ignores: ['openapi.json'],
  },
  stylistic.configs['recommended'],
  ...vueI18n.configs.recommended,
  {
    rules: {
      'vue/max-attributes-per-line': ['error'],
    },
  },
  {
    rules: {
      '@intlify/vue-i18n/no-missing-keys-in-other-locales': ['error'],
      '@intlify/vue-i18n/no-raw-text': [
        'error',
        {
          attributes: {
            '/.+/': [
              'title',
              'label',
              'placeholder',
              'aria-label',
              'aria-placeholder',
              'aria-roledescription',
              'aria-valuetext',
            ],
            'input': ['placeholder'],
            'img': ['alt'],
            'AdminEditDeleteButtons': ['model-name'],
            'AdminFamiliesEditForm': ['kind-name'],
            'AdminFamiliesEditFormJson': ['kind-name'],
            'AdminInputSwitchField': ['helper-text'],
            'AdminInputTextField': ['helper-text'],
            'CategorySelect': ['helperText'],
            'ColorField': ['helperText'],
            'Column': ['header'],
            'DataTable': ['current-page-report-template'],
            'DatePicker': ['date-format'],
            'Dialog': ['header'],
            'MultiSelect': ['empty-filter-message'],
            'NumberField': ['helperText'],
            'SwitchField': ['helperText'],
            'Tag': ['value'],
            'TagSelect': ['helperText'],
            'TextField': ['helperText'],
          },
          ignorePattern: '^[-#:()&*,]+$',
        },
      ],
      '@intlify/vue-i18n/no-unused-keys': ['error'],
    },
    settings: {
      'vue-i18n': {
        localeDir: './i18n/locales/*.json', // extension is glob formatting!
        messageSyntaxVersion: '10.0.8',
      },
    },
  },
)
