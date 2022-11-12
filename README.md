# `rehype-shiki`

Highlight code blocks in HTML with [`shiki`](https://github.com/shikijs/shiki).

Supports diffs, line numbers, and more.

## Install

```sh
npm i shiki @imhoff/rehype-shiki
```

## Use

This package is a [`rehype`](https://github.com/rehypejs/rehype) plugin.

To highlight code blocks in html, specify the code block language via
`data-language` attribute on the `<code>` element:

```js
import withShiki from '@imhoff/rehype-shiki'
import fromHtml from 'rehype-parse'
import toHtml from 'rehype-stringify'
import * as shiki from 'shiki'
import { unified } from 'unified'

const doc = '<pre><code data-language="js">const hello = "World";</code></pre>'

async function createProcessor() {
  const highlighter = await shiki.getHighlighter({ theme: 'css-variables' })

  const processor = unified()
    .use(fromHtml)
    .use(withShiki, { highlighter })
    .use(toHtml)

  return processor
}

createProcessor()
  .then(processor => processor.process(doc))
  .then(vfile => {
    console.log(String(vfile))
  })
```

### Markdown

When used in a `unified` pipeline coming from Markdown, specify the code block
language via code block meta:

````js
import withShiki from '@imhoff/rehype-shiki'
import toHtml from 'rehype-stringify'
import fromMarkdown from 'remark-parse'
import toHast from 'remark-rehype'
import * as shiki from 'shiki'
import { unified } from 'unified'

const doc = "```js\nconst hello = 'World';\n```\n"

async function createProcessor() {
  const highlighter = await shiki.getHighlighter({ theme: 'css-variables' })

  const processor = unified()
    .use(fromMarkdown)
    .use(toHast)
    .use(withShiki, { highlighter })
    .use(toHtml)

  return processor
}

createProcessor()
  .then(processor => processor.process(doc))
  .then(vfile => {
    console.log(String(vfile))
  })
````

### Diffs

Append `-diff` to the language and then prepend `+`, `-`, or a space to each line.

````markdown
```js-diff
 // create a variable
-var hello = 'World';
+const hello = 'World';
```
````

Diff symbols are added as `data-diff-symbol` attributes to the final HTML.

### Line Numbers

Line numbers are added as `data-line-number` attributes to the final HTML. An
additional `data-line-number-padding` attribute is added for convenience when
adding start or end padding.

You can offset the line numbers by using `lineNumbersOffset`:

````markdown
```js { lineNumbersOffset: 3 }
// this will begin at line 4

// create a variable
const hello = 'World';
```
````

### Content Hashes

Use this feature to throw an error during build when the content of a code
block changes. This can be useful as a reminder to developers to update
references (line or column numbers, variable names, etc) when changing a code
block.

As an example, lets say we start with the following markdown:

````markdown
Set the `hello` variable.

```js { contentHash: 'b77a9f8b366ece64e434eb71c9e7f1f74e5a2fc2' }
const hello = 'World';
```
````

Then, someone changes the code block, renaming `hello` to `goodbye`:

````markdown
Set the `hello` variable.

```js { contentHash: 'b77a9f8b366ece64e434eb71c9e7f1f74e5a2fc2' }
const goodbye = 'World';
```
````

The build will fail with a "Content hash mismatch" error, reminding the
developer to update any references to the code block.

After the references and content hash are changed, the build succeeds again:

````markdown
Set the `goodbye` variable.

```js { contentHash: '0d69be72d350332263863e7352a99b363a806dd9' }
const goodbye = 'World';
```
````
