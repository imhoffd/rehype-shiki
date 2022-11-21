import type * as Hast from 'hast'

export default function createSpanElement(
  element: Partial<Hast.Element> = {},
): Hast.Element {
  return {
    type: 'element',
    tagName: 'span',
    children: [],
    ...element,
  }
}
