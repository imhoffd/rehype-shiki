import { visit } from 'unist-util-visit'

/**
 * @see https://github.com/mapbox/rehype-prism/blob/main/index.js
 */
function attacher(options = {}) {
  const { renderer } = options

  return function transformer(tree) {
    visit(tree, 'element', visitor)

    function visitor(node, _index, parent) {
      if (!parent || parent.tagName !== 'pre' || node.tagName !== 'code') {
        return
      }

      const lang = getLanguage(node)
      const code = renderer(node, lang)

      parent.properties = code.properties
      parent.children = code.children
    }
  }
}

function getLanguage(node) {
  const dataLanguage = node.properties.dataLanguage

  if (dataLanguage != null) {
    return dataLanguage
  }

  const className = node.properties.className || []

  for (const classListItem of className) {
    if (classListItem.slice(0, 9) === 'language-') {
      return classListItem.slice(9).toLowerCase()
    }
  }

  return null
}

export default attacher
