import type * as Hast from 'hast'
import { toString } from 'hast-util-to-string'
import repeat from 'lodash/fp/repeat.js'
import type { Highlighter } from 'shiki'
import { codeToHast } from 'shiki-renderer-hast'

import getLanguageFromCodeNode from './getLanguageFromCodeNode.js'
import isSpanElement from './lib/isSpanElement.js'
import trimNewlines from './lib/trimNewlines.js'
import parseLanguage from './parseLanguage.js'

export default function preNodeToShiki(
  highlighter: Highlighter,
  inputNode: Hast.Element,
): Hast.Element {
  if (
    inputNode.tagName !== 'pre' ||
    inputNode.children.length !== 1 ||
    inputNode.children[0].type !== 'element' ||
    inputNode.children[0].tagName !== 'code' ||
    inputNode.children[0].children.length !== 1 ||
    inputNode.children[0].children[0].type !== 'text'
  ) {
    throw new Error(
      'Expected node to be a pre element with a single child code element and text within.',
    )
  }

  const inputText = inputNode.children[0].children[0]
  inputText.value = trimNewlines(inputText.value)

  let symbols: string[] = []
  let lines = inputText.value.split('\n')

  const { lang, diff } = parseLanguage(
    getLanguageFromCodeNode(inputNode.children[0]),
  )

  if (diff) {
    symbols = lines.map(line => line.substring(0, 1))
    lines = lines.map(line => line.substring(1))
    inputText.value = lines.join('\n')
  }

  const pre = codeToHast(highlighter, toString(inputNode.children[0]), lang)

  const [code] = pre.children

  pre.properties ??= {}

  // set the highlighter language in a data attribute
  pre.properties.dataLanguage = lang

  if (code.type !== 'element' || code.tagName !== 'code') {
    throw new Error(
      'Expected first child of rendered pre element to be a code element.',
    )
  }

  const lineNodes = code.children.filter(isSpanElement)

  if (lines.length !== lineNodes.length) {
    throw new Error(
      `Line count did not match between text (${lines.length}) and rendered hast (${lineNodes.length}).`,
    )
  }

  for (const [i, n] of lineNodes.entries()) {
    const lineNumber = i + 1
    const symbol = symbols[i]

    n.properties = {
      ...n.properties,
      dataLineNumber: lineNumber,
      dataLineNumberPadding:
        repeat(
          String(lineNodes.length).length - String(lineNumber).length,
          ' ',
        ) || null,
      dataSymbol: symbol,
    }
  }

  code.children = lineNodes

  return pre
}
