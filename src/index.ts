import type * as Hast from 'hast'
import type { Lang } from 'shiki'
import type { Plugin } from 'unified'
import { visit } from 'unist-util-visit'

declare type StringLiteralUnion<T extends U, U = string> = T | (U & {})

export type HastRenderer = (
  node: Hast.Element,
  lang?: StringLiteralUnion<Lang>,
) => Hast.Element

export interface Options {
  renderer: HastRenderer
}

const attacher: Plugin<[Options], Hast.Element, Hast.Element> = options => {
  const { renderer } = options

  return tree => {
    visit(tree, 'element', (node, _, parent) => {
      if (!parent || parent.tagName !== 'pre' || node.tagName !== 'code') {
        return
      }

      const lang = getLanguage(node)
      const code = renderer(node, lang ?? undefined)

      parent.properties = code.properties
      parent.children = code.children
    })
  }
}

const getLanguage = (node: Hast.Element): Lang | null => {
  if (!node.properties) {
    return null
  }

  const { className, dataLanguage } = node.properties

  if (typeof dataLanguage === 'string') {
    return dataLanguage as Lang
  }

  const classNames = Array.isArray(className) ? className : []

  for (const cls of classNames) {
    if (typeof cls === 'string' && cls.slice(0, 9) === 'language-') {
      return cls.slice(9).toLowerCase() as Lang
    }
  }

  return null
}

export default attacher
