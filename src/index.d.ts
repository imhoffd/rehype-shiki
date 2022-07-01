import type * as Hast from 'hast'
import type { Highlighter } from 'shiki'
import type { HastRendererOptions } from 'shiki-renderer-hast'
import type { Plugin } from 'unified'

export interface Options {
  highlighter: Highlighter
  /** @default true */
  ignoreUnknownLanguage?: boolean
  getLineOptions?: (node: Hast.Element) => HastRendererOptions['lineOptions']
}

declare const withShiki: Plugin<[Options]>

export default withShiki
