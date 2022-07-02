import type * as Hast from 'hast'

/**
 * Get the value of data-language or the language from classes of a code node.
 */
export default function getLanguageFromCodeNode(
  node: Hast.Element,
): string | null {
  if (!node.properties) {
    return null
  }

  const { className, dataLanguage } = node.properties

  if (typeof dataLanguage === 'string') {
    return dataLanguage
  }

  const classNames = Array.isArray(className) ? className : []

  for (const cls of classNames) {
    if (typeof cls === 'string' && cls.slice(0, 9) === 'language-') {
      return cls.slice(9).toLowerCase()
    }
  }

  return null
}
