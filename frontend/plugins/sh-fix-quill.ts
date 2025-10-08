import Quill from 'quill/core'
import type { Range } from 'quill/core'
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
  // Make Quill.getSemanticHTML() apply the html fixes if those are enabled
  const getSemanticHTML = Quill.prototype.getSemanticHTML
  Quill.prototype.getSemanticHTML = function (this: Quill, rangeOrIndex?: Range | number, length?: number) {
    let result: string
    if ('object' == typeof rangeOrIndex)
      result = (getSemanticHTML as { (this: Quill, range: Range): string }).call(this, rangeOrIndex)
    else
      result = (getSemanticHTML as { (this: Quill, index?: number, length?: number): string }).call(this, rangeOrIndex, length)

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
  Clipboard.prototype.onCopy = function (this: Clipboard, range: Range, isCut: boolean) {
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
