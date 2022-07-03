import type * as Hast from 'hast'
import { toString } from 'hast-util-to-string'
import json5 from 'json5'
import repeat from 'lodash/fp/repeat.js'
import { createHash } from 'node:crypto'
import type { Highlighter } from 'shiki'
import { codeToHast } from 'shiki-renderer-hast'

import getLanguageFromCodeNode from './getLanguageFromCodeNode.js'
import isSpanElement from './lib/isSpanElement.js'
import trimNewlines from './lib/trimNewlines.js'
import parseLanguage from './parseLanguage.js'

const { parse } = json5

export interface Meta {
  contentHash?: string
  file?: string
}

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

  const codeNode = inputNode.children[0]
  const inputText = inputNode.children[0].children[0]
  inputText.value = trimNewlines(inputText.value)

  const meta: Meta =
    typeof codeNode.data?.meta === 'string' ? parse(codeNode.data.meta) : {}

  let diffSymbols: string[] = []
  let lines = inputText.value.split('\n')

  const { lang, diff } = parseLanguage(getLanguageFromCodeNode(codeNode))

  if (diff) {
    diffSymbols = lines.map(line => line.substring(0, 1))
    lines = lines.map(line => line.substring(1))
    inputText.value = lines.join('\n')
  }

  const pre = codeToHast(highlighter, toString(codeNode), lang)

  const [code] = pre.children

  pre.properties ??= {}

  // set the highlighter language in a data attribute
  pre.properties.dataLanguage = lang
  pre.properties.dataContentHash = meta.contentHash
  pre.properties.dataFile = meta.file

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

  if (typeof meta.contentHash !== 'undefined') {
    const contentHash = createHash('sha1').update(inputText.value).digest('hex')

    if (contentHash !== meta.contentHash) {
      throw new Error(
        `Content hash mismatch. ` +
          `'${contentHash}' did not match expected hash: '${meta.contentHash}'. ` +
          `Update or remove the 'contentHash' meta property in the code block to continue.`,
      )
    }
  }

  for (const [i, n] of lineNodes.entries()) {
    const lineNumber = i + 1
    const diffSymbol = diffSymbols[i]
    const dataLineNumber = String(lineNumber)
    const lineNumberPadding =
      String(lineNodes.length).length - String(lineNumber).length
    const dataLineNumberPadding = repeat(lineNumberPadding, ' ') || null

    n.properties = {
      ...n.properties,
      dataLineNumber,
      dataLineNumberPadding,
      dataDiffSymbol: diffSymbol,
    }
  }

  code.children = lineNodes

  return pre
}
