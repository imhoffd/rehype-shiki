import * as fs from 'fs'
import * as path from 'path'

import fromHtml from 'rehype-parse'
import toHtml from 'rehype-stringify'
import fromMarkdown from 'remark-parse'
import toHast from 'remark-rehype'
import * as shiki from 'shiki'
import { unified } from 'unified'
import { toString } from 'hast-util-to-string'
import { codeToHast } from 'shiki-renderer-hast'

import withShiki from '../src'

const fixtures = {
  known: fs.readFileSync(path.resolve('./test/fixtures/test.html'), {
    encoding: 'utf-8',
  }),
  dataAttribute: fs.readFileSync(
    path.resolve('./test/fixtures/data-attribute.html'),
    {
      encoding: 'utf-8',
    },
  ),
  none: fs.readFileSync(path.resolve('./test/fixtures/none.html'), {
    encoding: 'utf-8',
  }),
  unknown: fs.readFileSync(path.resolve('./test/fixtures/unknown.html'), {
    encoding: 'utf-8',
  }),
  markdown: fs.readFileSync(path.resolve('./test/fixtures/test.md'), {
    encoding: 'utf-8',
  }),
}

async function createProcessor() {
  const highlighter = await shiki.getHighlighter({ theme: 'nord' })

  const processor = unified()
    .use(fromHtml, { fragment: true })
    .use(withShiki, {
      renderer: (node, lang) =>
        codeToHast(highlighter, toString(node), undefined),
    })
    .use(toHtml)

  return processor
}

async function createMarkdownProcessor() {
  const highlighter = await shiki.getHighlighter({ theme: 'nord' })

  const processor = unified()
    .use(fromMarkdown)
    .use(toHast)
    .use(withShiki, {
      renderer: (node, lang) => codeToHast(highlighter, toString(node), lang),
    })
    .use(toHtml)

  return processor
}

it('highlights code block in html', async () => {
  const processor = await createProcessor()

  const vfile = await processor.process(fixtures.known)

  expect(String(vfile)).toMatchInlineSnapshot(`
    "<h1>Heading</h1>
    <p>Text</p>
    <pre class=\\"shiki\\" style=\\"background-color: #2e3440ff\\"><code><span class=\\"line\\"><span style=\\"color: #d8dee9ff\\"></span></span>
    <span class=\\"line\\"><span style=\\"color: #d8dee9ff\\">    const hello = \\"World\\"</span></span>
    <span class=\\"line\\"><span style=\\"color: #d8dee9ff\\">  </span></span></code></pre>
    <p>More text</p>
    "
  `)
})

it('highlights code block in html when running synchronously', async () => {
  const processor = await createProcessor()

  const vfile = processor.processSync(fixtures.known)

  expect(String(vfile)).toMatchInlineSnapshot(`
    "<h1>Heading</h1>
    <p>Text</p>
    <pre class=\\"shiki\\" style=\\"background-color: #2e3440ff\\"><code><span class=\\"line\\"><span style=\\"color: #d8dee9ff\\"></span></span>
    <span class=\\"line\\"><span style=\\"color: #d8dee9ff\\">    const hello = \\"World\\"</span></span>
    <span class=\\"line\\"><span style=\\"color: #d8dee9ff\\">  </span></span></code></pre>
    <p>More text</p>
    "
  `)
})

it('ignores code block without language', async () => {
  const processor = await createProcessor()

  const vfile = await processor.process(fixtures.none)

  expect(String(vfile)).toMatchInlineSnapshot(`
    "<h1>Heading</h1>
    <p>Text</p>
    <pre class=\\"shiki\\" style=\\"background-color: #2e3440ff\\"><code><span class=\\"line\\"><span style=\\"color: #d8dee9ff\\"></span></span>
    <span class=\\"line\\"><span style=\\"color: #d8dee9ff\\">    const hello = \\"World\\"</span></span>
    <span class=\\"line\\"><span style=\\"color: #d8dee9ff\\">  </span></span></code></pre>
    <p>More text</p>
    "
  `)
})

it('ignores code block with unknown language', async () => {
  const processor = await createProcessor()

  const vfile = await processor.process(fixtures.unknown)

  expect(String(vfile)).toMatchInlineSnapshot(`
    "<h1>Heading</h1>
    <p>Text</p>
    <pre class=\\"shiki\\" style=\\"background-color: #2e3440ff\\"><code><span class=\\"line\\"><span style=\\"color: #d8dee9ff\\"></span></span>
    <span class=\\"line\\"><span style=\\"color: #d8dee9ff\\">    const hello = \\"World\\"</span></span>
    <span class=\\"line\\"><span style=\\"color: #d8dee9ff\\">  </span></span></code></pre>
    <p>More text</p>
    "
  `)
})

it('accepts language via data-language attribute', async () => {
  const processor = await createProcessor()

  const vfile = await processor.process(fixtures.dataAttribute)

  expect(String(vfile)).toMatchInlineSnapshot(`
    "<h1>Heading</h1>
    <p>Text</p>
    <pre class=\\"shiki\\" style=\\"background-color: #2e3440ff\\"><code><span class=\\"line\\"><span style=\\"color: #d8dee9ff\\"></span></span>
    <span class=\\"line\\"><span style=\\"color: #d8dee9ff\\">    const hello = \\"World\\"</span></span>
    <span class=\\"line\\"><span style=\\"color: #d8dee9ff\\">  </span></span></code></pre>
    <p>More text</p>
    "
  `)
})

it('correctly processes markdown content', async () => {
  const processor = await createMarkdownProcessor()

  const vfile = await processor.process(fixtures.markdown)

  expect(String(vfile)).toMatchInlineSnapshot(`
    "<h1>Heading</h1>
    <p>Text</p>
    <pre class=\\"shiki\\" style=\\"background-color: #2e3440ff\\"><code><span class=\\"line\\"><span style=\\"color: #81A1C1\\">const</span><span style=\\"color: #D8DEE9FF\\"> </span><span style=\\"color: #D8DEE9\\">hello</span><span style=\\"color: #D8DEE9FF\\"> </span><span style=\\"color: #81A1C1\\">=</span><span style=\\"color: #D8DEE9FF\\"> </span><span style=\\"color: #ECEFF4\\">'</span><span style=\\"color: #A3BE8C\\">World</span><span style=\\"color: #ECEFF4\\">'</span></span>
    <span class=\\"line\\"></span></code></pre>
    <p>More text</p>"
  `)
})
