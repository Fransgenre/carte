import Editor from 'quill/core/editor'
import Keyboard from 'quill/modules/keyboard'
import { defineNuxtPlugin } from '#app'

const KEYCODE_TAB = 9
const KEYNAME_TAB = 'Tab'

/**
 * This custom plugin fixes various behaviours of the rich text editor of the Quill library, used internally by PrimeVue's Editor
 */
export default defineNuxtPlugin(() => {
  // Fix the generated HTML code
  const getHTML = Editor.prototype.getHTML
  Editor.prototype.getHTML = function (this: Editor, index: number, length: number) {
    let html = getHTML.call(this, index, length)

    // Fix empty <p></p> returned by the editor for empty line feeds
    html = fixEmptyParagraphsAsLineFeeds(html)

    // Undo the editor replacing spaces by non-breaking spaces (&nbsp;)
    // (see https://github.com/slab/quill/issues/4509)
    html = convertNbspToSpace(html)

    return html
  }

  // Prevent the editor from blocking Tab navigation for indentation
  // (see https://github.com/Fransgenre/carte/issues/7)
  removeTabBindings()
})

function fixEmptyParagraphsAsLineFeeds(html: string) {
  return html.replace(
    /<p><\/p>/g, '<p><br></p>',
  )
}

function convertNbspToSpace(html: string) {
  return html.replace(
    /&nbsp;/g, ' ',
  ).replace(
    /\u00A0/g, ' ',
  )
}

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
