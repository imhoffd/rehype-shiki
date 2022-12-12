import type * as Hast from 'hast'
import { toString } from 'hast-util-to-string'
import json5 from 'json5'
import type { Dictionary } from 'lodash'
import __ from 'lodash/fp/__.js'
import findLast from 'lodash/fp/findLast.js'
import isFinite from 'lodash/fp/isFinite.js'
import kebabCase from 'lodash/fp/kebabCase.js'
import last from 'lodash/fp/last.js'
import mapKeys from 'lodash/fp/mapKeys.js'
import mapValues from 'lodash/fp/mapValues.js'
import repeat from 'lodash/fp/repeat.js'
import { createHash } from 'node:crypto'
import type { Highlighter } from 'shiki'
import { codeToHast } from 'shiki-renderer-hast'

import getLanguageFromCodeNode from './getLanguageFromCodeNode.js'
import createSpanElement from './lib/createSpanElement.js'
import createText from './lib/createText.js'
import isSpanElement from './lib/isSpanElement.js'
import trimNewlines from './lib/trimNewlines.js'
import parseLanguage from './parseLanguage.js'

const { parse } = json5
const findLastFinite = findLast<number>(isFinite)
const repeatSpaces = repeat(__, ' ')
const toDataKey = (key: string) => `data-${kebabCase(key)}`
const toDataValue = (value: unknown) => (value === true ? 'true' : value)
const mapDataKeys = mapKeys(toDataKey)
const mapDataValues = mapValues(toDataValue)

const getLineNumberPadding = (
  maxLineNumber: number,
  lineNumber: string | null | undefined,
): string | null => {
  const maxLineNumberLength = maxLineNumber.toString().length
  const padding = lineNumber
    ? maxLineNumberLength - lineNumber.length
    : maxLineNumberLength

  return padding > 0 ? repeatSpaces(padding) : null
}

type DiffSymbol = ' ' | '-' | '+'

const isDiffSymbol = (value: string): value is DiffSymbol =>
  value === ' ' || value === '-' || value === '+'

export interface Meta {
  contentHash?: string
  file?: string
  lineNumbers?: boolean
  lineNumbersOffset?: number
  contentBefore?: boolean
  contentAfter?: boolean
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

  let diffSymbols: null | DiffSymbol[] = null
  let lines = inputText.value.split('\n')
  let lineNumbers: null | (string | null)[] = null
  let lineNumberPaddings: null | (string | null)[] = null
  let lineNumberIntegers: null | (number | null)[] = null
  let maxLineNumber: null | number = null

  const { lang, diff } = parseLanguage(getLanguageFromCodeNode(codeNode))

  if (diff) {
    diffSymbols = lines.map((line, i) => {
      const firstChar = line.substring(0, 1)

      if (!firstChar) {
        return ' '
      }

      if (!isDiffSymbol(firstChar)) {
        throw new Error(
          `First character ('${firstChar}') of line ${
            i + 1
          } is not a diff symbol. Use ' ', '-', or '+'.`,
        )
      }

      return firstChar
    })

    lines = lines.map(line => line.substring(1))
    inputText.value = lines.join('\n')
  }

  if (meta.lineNumbers) {
    let currentLineNumber = meta.lineNumbersOffset ?? 1

    lineNumbers = lines.map((_, i) =>
      meta.lineNumbers
        ? diffSymbols?.[i] === '+'
          ? null
          : (currentLineNumber++).toString()
        : null,
    )

    lineNumberIntegers = lineNumbers.map(lineNumber =>
      lineNumber ? Number.parseInt(lineNumber) : null,
    )

    const max = lineNumbers ? findLastFinite(lineNumberIntegers) ?? 1 : 1

    lineNumberPaddings = lines.map((_, i) =>
      getLineNumberPadding(max, lineNumbers?.[i]),
    )

    maxLineNumber = max
  }

  const pre = codeToHast(highlighter, toString(codeNode), lang)

  const [code] = pre.children

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

  const properties = {
    ...mapDataKeys(mapDataValues(meta as Dictionary<unknown>)),
    'data-language': lang,
    'data-line-number-padding': maxLineNumber
      ? getLineNumberPadding(maxLineNumber, ' ')
      : null,
  }

  pre.properties = { ...pre.properties, ...properties }
  code.properties = { ...code.properties, ...properties }

  for (const [i, n] of lineNodes.entries()) {
    const diffSymbol = diffSymbols?.[i]
    const lineNumber = lineNumbers?.[i]
    const lineNumberPadding = lineNumberPaddings?.[i]

    const lastChild = last(n.children)
    const lastGrandchild = last(
      lastChild?.type === 'element' ? lastChild.children : [],
    )

    if (
      isSpanElement(lastChild) &&
      lastGrandchild?.type === 'text' &&
      lastGrandchild.value.endsWith('⋯')
    ) {
      n.properties = {
        ...n.properties,
        className: [
          ...(n.properties && Array.isArray(n.properties.className)
            ? [...n.properties.className, 'folded']
            : ['folded']),
        ],
      }

      const spaces = n.children
        .flatMap(c => (c.type === 'element' ? c.children : [c]))
        .map(c => (c.type === 'text' ? c.value.replace(/\S/g, '') : ''))
        .join('')

      n.children = [
        createSpanElement({
          children: [createText(repeatSpaces(spaces.length))],
          properties: { className: ['spaces'] },
        }),
        createSpanElement({
          children: [createText('⋯')],
          properties: { className: ['marker'] },
        }),
      ]
    } else {
      n.properties = {
        ...n.properties,
        'data-line-number': lineNumber,
        'data-line-number-padding': lineNumberPadding,
        'data-diff-symbol': diffSymbol,
      }
    }

    n.children.push(createText('\n'))
  }

  code.children = lineNodes

  return pre
}
