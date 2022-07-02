import type * as Hast from 'hast'
import type { Lang } from 'shiki'
import type { Plugin } from 'unified'

// eslint-disable-next-line @typescript-eslint/ban-types
declare type StringLiteralUnion<T extends U, U = string> = T | (U & {})

export interface Options {
  renderer: (
    node: Hast.Element,
    lang?: StringLiteralUnion<Lang> | undefined,
  ) => Hast.Element
}

declare const withShiki: Plugin<[Options]>

export default withShiki
