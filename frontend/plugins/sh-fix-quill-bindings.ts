import Keyboard from 'quill/modules/keyboard'
import { defineNuxtPlugin } from '#app'

const KEYCODE_TAB = 9
const KEYNAME_TAB = 'Tab'

/**
 * This custom plugin fixes various key bindings used by the RichTextEditor of the Quill library, used internally by PrimeVue
 */
export default defineNuxtPlugin(() => {
  // Prevent the RichTextEditor from blocking Tab navigation for indentation
  // (see https://github.com/Fransgenre/carte/issues/7)
  removeTabBindings()
})

function removeTabBindings() {
  Object.keys(
    Keyboard.DEFAULTS.bindings,
  ).reduce(
    (acc: string[], name: string) => {
      const binding = Keyboard.DEFAULTS.bindings[name]

      let isTab = false
      if (KEYNAME_TAB == binding) isTab = true
      else if (KEYCODE_TAB == binding) isTab = true
      else if ('object' == typeof binding) {
        const key = binding.key
        if (KEYNAME_TAB == key) isTab = true
        else if (KEYCODE_TAB == key) isTab = true
        else if (Array.isArray(key)) {
          isTab = key.some(value => KEYNAME_TAB == value)
        }
      }

      if (isTab) acc.push(name)
      return acc
    },
    [],
  ).forEach((name) => {
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete Keyboard.DEFAULTS.bindings[name]
  })
}
