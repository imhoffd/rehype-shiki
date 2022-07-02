import type * as Hast from 'hast'
import type { Highlighter } from 'shiki'
import type { Plugin } from 'unified'
import { visit } from 'unist-util-visit'

import preNodeToShiki from './preNodeToShiki.js'

export interface Options {
  highlighter: Highlighter
}

const attacher: Plugin<[Options], Hast.Element, Hast.Element> = ({
  highlighter,
}) => {
  return tree => {
    visit(tree, 'element', (node, _, parent) => {
      if (!parent || parent.tagName !== 'pre' || node.tagName !== 'code') {
        return
      }

      const pre = preNodeToShiki(highlighter, parent)

      parent.properties = pre.properties
      parent.children = pre.children
    })
  }
}

export default attacher
