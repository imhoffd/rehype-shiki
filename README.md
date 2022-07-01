# `rehype-shiki`

Highlight code blocks in HTML with [`shiki`](https://github.com/shikijs/shiki).

Forked from
[`@stefanprobst/rehype-shiki`](https://github.com/stefanprobst/rehype-shiki)
for customizing the renderer.

## How to install

```sh
yarn add shiki @stefanprobst/rehype-shiki
```

## How to use

This package is a [`rehype`](https://github.com/rehypejs/rehype) plugin.

To highlight code blocks in html, specify the code block language via
`data-language` attribute on the `<code>` element:

```js
import withShiki from '@stefanprobst/rehype-shiki'
import { toString } from 'hast-util-to-string'
import fromHtml from 'rehype-parse'
import toHtml from 'rehype-stringify'
import * as shiki from 'shiki'
import { codeToHast } from 'shiki-renderer-hast'
import { unified } from 'unified'

const doc = '<pre><code data-language="js">const hello = "World";</code></pre>'

async function createProcessor() {
  const highlighter = await shiki.getHighlighter({ theme: 'poimandres' })

  const processor = unified()
    .use(fromHtml)
    .use(withShiki, {
      renderer: (node, lang) => codeToHast(highlighter, toString(node), lang),
    })
    .use(toHtml)

  return processor
}

createProcessor()
  .then(processor => processor.process(doc))
  .then(vfile => {
    console.log(String(vfile))
  })
```

When used in a `unified` pipeline coming from Markdown, specify the code block
language via code block meta:

````js
import withShiki from '@stefanprobst/rehype-shiki'
import { toString } from 'hast-util-to-string'
import toHtml from 'rehype-stringify'
import fromMarkdown from 'remark-parse'
import toHast from 'remark-rehype'
import * as shiki from 'shiki'
import { codeToHast } from 'shiki-renderer-hast'
import { unified } from 'unified'

const doc = "```js\nconst hello = 'World';\n```\n"

async function createProcessor() {
  const highlighter = await shiki.getHighlighter({ theme: 'poimandres' })

  const processor = unified()
    .use(fromMarkdown)
    .use(toHast)
    .use(withShiki, {
      renderer: (node, lang) => codeToHast(highlighter, toString(node), lang),
    })
    .use(toHtml)

  return processor
}

createProcessor()
  .then(processor => processor.process(doc))
  .then(vfile => {
    console.log(String(vfile))
  })
````
