// @ts-check
import stylistic from '@stylistic/eslint-plugin'
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(

  stylistic.configs['recommended'],

  {
    rules: {
      'vue/max-attributes-per-line': ['error'],
    },
  },

)
