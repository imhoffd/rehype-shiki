import type * as Hast from 'hast'

export default function isSpanElement(
  node?: Hast.ElementContent,
): node is Hast.Element {
  return !!node && node.type === 'element' && node.tagName === 'span'
}
