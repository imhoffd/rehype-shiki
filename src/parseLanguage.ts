export interface ParsedLanguage {
  lang: string | undefined
  diff: boolean
}

export default function parseLanguage(
  inputLang: string | undefined | null,
): ParsedLanguage {
  if (!inputLang) {
    return { lang: undefined, diff: false }
  }

  const diffIndex = inputLang.indexOf('-diff')

  let lang = inputLang
  let diff = false

  if (diffIndex > 0) {
    lang = inputLang.substring(0, diffIndex)
    diff = true
  }

  return { lang, diff }
}
