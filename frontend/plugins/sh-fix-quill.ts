import Editor from 'quill/core/editor'
import Clipboard from 'quill/modules/clipboard'
import Keyboard from 'quill/modules/keyboard'
import { defineNuxtPlugin } from '#app'

const KEYCODE_TAB = 9
const KEYNAME_TAB = 'Tab'

/**
 * This custom plugin fixes various behaviours of the rich text editor of the Quill library, used internally by PrimeVue's Editor
 */
export default defineNuxtPlugin(() => {
  // Fix the generated HTML code
  fixGeneratedHtml()

  // Prevent the editor from blocking Tab navigation for indentation
  // (see https://github.com/Fransgenre/carte/issues/7)
  removeTabBindings()
})

let htmlFixesEnabled = true

function fixGeneratedHtml() {
  // Make Editor.getHTML() apply the html fixes if those are enabled
  const getHTML = Editor.prototype.getHTML
  Editor.prototype.getHTML = function (this: Editor, index, length) {
    let result = getHTML.call(this, index, length)

    if (htmlFixesEnabled) {
      // Fix empty <p></p> returned by the editor for empty line feeds
      result = fixEmptyParagraphsAsLineFeeds(result)

      // Undo the editor replacing spaces by non-breaking spaces (&nbsp;)
      // (see https://github.com/slab/quill/issues/4509)
      result = convertNbspToSpace(result)
    }

    return result
  }

  // Disable the html fixes when Clipboard.onCopy() is called
  const onCopy = Clipboard.prototype.onCopy
  Clipboard.prototype.onCopy = function (this: Clipboard, range, isCut) {
    let result
    try {
      htmlFixesEnabled = false
      result = onCopy.call(this, range, isCut)
    }
    finally {
      htmlFixesEnabled = true
    }
    return result
  }
}

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
