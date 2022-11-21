import type * as Hast from 'hast'

export default function createText(value: string): Hast.Text {
  return { type: 'text', value }
}
