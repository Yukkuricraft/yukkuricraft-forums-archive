import vuePreset from '@bbob/preset-vue'
import BbcodeVideo from '@/components/bbcode/BbcodeVideo.vue'
import BbcodeSpoiler from '@/components/bbcode/BbcodeSpoiler.vue'
import bbob from '@bbob/core'
import { lineBreakPlugin } from '@/components/bbcode/lineBreakPlugin.ts'
import type { BBobCoreTagNodeTree, BBobPluginFunction, NodeContent, TagNodeObject } from '@bbob/types'
import { type Component, defineComponent } from 'vue'
import BbcodeQuote from '@/components/bbcode/BbcodeQuote.vue'
import BbcodePostLink from '@/components/bbcode/BbcodePostLink.vue'
import { parse } from '@bbob/parser'
import { decodeHtmlEntities } from '@/util/htmlEntities.ts'
import { RouterLink } from 'vue-router'

function attr(attrs: Record<string, unknown> | undefined) {
  const entries = Object.entries(attrs ?? {})
  if (entries.length > 1) {
    if (entries.every(([k, v]) => k === v)) {
      // We just have to guess if this is the case
      return entries.map(([k]) => k).join(' ')
    }

    throw new Error('Expected only one unparsed attribute')
  }

  if (entries.length === 0) {
    return null
  }

  const [k, v] = entries[0]
  if (k !== v) {
    throw new Error('Expected key and value of unparsed attribute to match')
  }

  return k
}

const isWhitespaceNode = (node: NodeContent): boolean => typeof node === 'string' && node.trim() === ''

// Trims leading/trailing whitespace-only string nodes from a list item's content,
// so the surrounding newlines around `[*]` markers don't turn into stray <br>s.
function trimItemContent(content: NodeContent[]): NodeContent[] {
  let start = 0
  let end = content.length
  while (start < end && isWhitespaceNode(content[start])) start++
  while (end > start && isWhitespaceNode(content[end - 1])) end--
  return content.slice(start, end)
}

function safeCssValue(value: string | undefined | null): string | undefined {
  if (value == null || value === '') {
    return undefined
  }
  return /^[#a-zA-Z0-9(),.%\s-]+$/.test(value) ? value : undefined
}

function validateUrl(urlStr: string): string | undefined {
  try {
    const url = new URL(urlStr)
    if (url.protocol === 'https:' || url.protocol === 'http:') {
      return urlStr
    }
    console.warn('Invalid url', url)
  } catch (e) {
    try {
      const url = new URL('.' + urlStr, 'http://localhost:3000')
      if (url.protocol === 'https:' || url.protocol === 'http:') {
        return urlStr
      }
      console.warn('Invalid url', url)
    } catch (e2) {
      console.warn('Invalid url', urlStr, e, e2)
    }
  }

  return undefined
}

export const customPreset = vuePreset.extend((defTags) => ({
  ...defTags,
  video: (node) => ({
    ...node,
    attrs: Object.fromEntries(
      Object.entries(node.attrs ?? {}).map(([k, v]) => (k.includes(';') ? k.split(';') : [k, v])),
    ),
    content: '',
    tag: BbcodeVideo,
  }),
  size: (node) => ({
    ...node,
    attrs: {
      style: {
        fontSize: (() => {
          const sizeAttr = node.attrs?.size ?? attr(node.attrs) ?? ''
          if (sizeAttr === '') {
            return undefined
          }

          switch (parseInt(String(sizeAttr), 10)) {
            case 1:
              return '8px'
            case 2:
              return '10px'
            case 3:
              return '12px'
            case 4:
              return '20px'
            case 5:
              return '28px'
            case 6:
              return '48px'
            case 7:
              return '72px'
            case 8:
              return '72px'
            default:
              return String(sizeAttr).endsWith('px') ? sizeAttr : undefined
          }
        })(),
      },
    },
    tag: 'span',
  }),
  // TODO: Space attr problematic
  // https://github.com/JiLiZART/BBob/pull/281/files
  spoiler: (node) => {
    return {
      ...node,
      attrs: {
        summary: attr(node.attrs) ?? 'Spoiler',
      },
      tag: BbcodeSpoiler,
    }
  },
  aname: (node) => ({
    ...node,
    attrs: {
      name: attr(node.attrs) ?? 'aname',
    },
    tag: 'a',
  }),
  jumpto: (node) => ({
    ...node,
    attrs: {
      href: '#' + (attr(node.attrs) ?? 'top'),
    },
    tag: 'a',
  }),
  noparse: (node) => ({
    content: unparseTree(node),
    attrs: {},
    tag: 'span',
  }),
  p: (node) => ({
    ...node,
    attrs: {},
    tag: 'p',
  }),
  li: (node) => ({
    ...node,
    attrs: {},
    tag: 'li',
  }),
  // vBulletin lists use `[*]` item markers rather than `[li]`/`[/li]` tags. Since `*` isn't a
  // registered tag it arrives as a literal "[*]" string node, so we split the list content on it
  // ourselves to build the `<li>`s. `[list=n]` (numbered/lettered) becomes an `<ol type=n>`.
  list: (node) => {
    const rawContent = node.content
    const content = Array.isArray(rawContent) ? rawContent : rawContent != null ? [rawContent] : []

    const items: NodeContent[][] = []
    let current: NodeContent[] | null = null
    const startItem = () => {
      current = []
      items.push(current)
    }
    const pushToken = (token: NodeContent) => {
      current?.push(token)
    }

    for (const token of content) {
      if (typeof token === 'string' && token.includes('[*]')) {
        // A single string node may hold the marker plus following text, e.g. "[*]first".
        token.split('[*]').forEach((part, i) => {
          if (i > 0) startItem()
          if (part !== '') pushToken(part)
        })
      } else if (token && typeof token === 'object' && token.tag === '*') {
        startItem()
      } else {
        pushToken(token)
      }
    }

    const liNodes: TagNodeObject[] = items.map((itemContent) => ({
      attrs: {},
      content: trimItemContent(itemContent),
      tag: 'li',
    }))

    const type = attr(node.attrs)
    return {
      ...node,
      attrs: type ? { type } : {},
      content: liNodes,
      tag: type ? 'ol' : 'ul',
    }
  },
  // TODO: Somehow remove extra newlines after this
  // TODO: Space attr problematic
  quote: (node) => ({
    ...node,
    attrs: (() => {
      const reference = attr(node.attrs) ?? ''
      const parts = reference.split(';')
      if (parts.length === 0 || (parts.length === 1 && parts[0].length === 0)) {
        return {}
      }
      if (parts.length === 1) {
        return { referencedUser: parts[0] }
      }

      return { referencedUser: parts[0], referencedPost: parts[1] }
    })(),
    tag: BbcodeQuote,
  }),
  url: (node) => {
    let reference = attr(node.attrs) ?? node.content
    if (Array.isArray(reference) && reference.length === 1) {
      reference = reference[0]
    }
    const spanRes = {
      ...node,
      attrs: {},
      tag: 'span',
    }

    if (typeof reference !== 'string') {
      return spanRes
    }

    let url = validateUrl(reference)
    if (!url) {
      return spanRes
    }
    if (url.startsWith('https://yukkuricraft.net/forum/')) {
      url = url.replace('https://yukkuricraft.net/forum/', '/forum/')
    }
    if (url.startsWith('https://forums.yukkuricraft.net/')) {
      url = url.replace('https://forums.yukkuricraft.net/', '/')
    }

    if (url.startsWith('/')) {
      return {
        ...node,
        attrs: {
          to: url,
        },
        tag: RouterLink,
      }
    } else {
      return {
        ...node,
        attrs: {
          href: url,
        },
        tag: 'a',
      }
    }
  },
  img: (node) => ({
    ...node,
    content: '',
    attrs: (() => {
      let reference = node.content
      if (Array.isArray(reference) && reference.length === 1) {
        reference = reference[0]
      }

      if (typeof reference !== 'string') {
        return {}
      }

      return {
        src: validateUrl(reference),
      }
    })(),
    tag: 'img',
  }),
  hr: (node) => ({
    ...node,
    attrs: {
      style: {
        '--bulma-hr-background-color': 'var(--bulma-text)',
      },
    },
    tag: 'hr',
  }),
  left: (node) => ({
    ...node,
    attrs: {
      style: {
        textAlign: 'left',
      },
    },
    tag: 'div',
  }),
  center: (node) => ({
    ...node,
    attrs: {
      style: {
        textAlign: 'center',
      },
    },
    tag: 'div',
  }),
  right: (node) => ({
    ...node,
    attrs: {
      style: {
        textAlign: 'right',
      },
    },
    tag: 'div',
  }),
  font: (node) => ({
    ...node,
    attrs: {
      style: {
        fontFamily: safeCssValue(attr(node.attrs)),
      },
    },
    tag: 'span',
  }),
  color: (node) => ({
    ...node,
    attrs: {
      style: {
        color: safeCssValue((node.attrs?.color as string | undefined) ?? attr(node.attrs)),
      },
    },
    tag: 'span',
  }),
  code: (node) => ({
    content: node,
    attrs: {
      style: {
        overflow: 'auto',
        width: '100%',
        '--bulma-content-pre-padding': '0.5rem',
      },
    },
    tag: 'pre',
  }),
  codei: (node) => ({
    content: node,
    tag: 'code',
  }),
  // They are gone, and there's not much we can do to bring them back
  sigpic: () => ({
    content: 'sigpic',
    attrs: {},
    tag: 'span',
  }),
  td: (node) => ({
    ...node,
    attrs: {
      style: {
        border: '1px solid var(--bulma-text)',
        padding: '0.5rem',
        verticalAlign: 'middle',
      },
    },
    tag: 'td',
  }),
  tr: (node) => ({
    ...node,
    attrs: {},
    tag: 'tr',
  }),
  // TODO: Space attr problematic
  // https://github.com/JiLiZART/BBob/pull/281/files
  table: (node) => {
    return {
      ...node,
      content: {
        content: node.content,
        attrs: {},
        tag: 'tbody',
        disableLineBreakConversion: true,
      },
      disableLineBreakConversion: true,
      attrs: (() => {
        const attributes = attr(node.attrs)
        const attrArr = attributes?.split(', ') ?? []
        const attrObj = Object.fromEntries(attrArr.map((a) => a.split(': ', 2)))

        return {
          style: {
            width: isNaN(Number(attrObj['width'])) ? attrObj['width'] : `${attrObj['width']}px`,
          },
          align: attrObj['align'],
        }
      })(),
      tag: 'table',
    }
  }, //TODO [TABLE="class: text_table, align: center, width: 700"]
  img2: (node) => {
    function stringifyContent(node: NodeContent | undefined) {
      if (!node) {
        return ''
      }

      if (typeof node === 'object') {
        return ''
      } else if (typeof node === 'number') {
        return node.toString(10)
      } else {
        return node ?? ''
      }
    }

    const arrContent = Array.isArray(node.content) ? node.content : [node.content]
    const jsonStr = arrContent.map((n) => stringifyContent(n)).join('')

    if (jsonStr === '') {
      return { content: '', attrs: {}, tag: 'span' }
    }

    const json = JSON.parse(jsonStr)

    return {
      content: '',
      attrs: {
        src: validateUrl(json.src),
        style: {
          width: json.width,
          height: json.height,
        },
      },
      tag: 'img',
    }
  },
  indent: (node) => ({
    ...node,
    attrs: {
      style: {
        marginLeft: '4rem',
      },
    },
    tag: 'div',
  }),
  s: (node) => ({
    ...node,
    attrs: {},
    tag: 'strike',
  }),
  sub: (node) => ({
    ...node,
    attrs: {},
    tag: 'sub',
  }),
  sup: (node) => ({
    ...node,
    attrs: {},
    tag: 'sup',
  }),
  // We intentionally don't render email tags
  email: (node) => ({
    ...node,
    attrs: {},
    tag: 'span',
  }),
  // We do not have the original attachment data, so we can only show a placeholder
  attach: () => ({
    content: '[Attachment]',
    attrs: {},
    tag: 'span',
  }),
  post: (node) => {
    const attrId = attr(node.attrs)
    if (attrId != null) {
      return {
        ...node,
        attrs: { postId: attrId.trim() },
        tag: BbcodePostLink,
      }
    }

    let reference = node.content
    if (Array.isArray(reference) && reference.length === 1) {
      reference = reference[0]
    }
    const id = typeof reference === 'string' ? reference.trim() : ''
    return {
      ...node,
      content: [],
      attrs: { postId: id },
      tag: BbcodePostLink,
    }
  },
}))

function unparseTree(tree: TagNodeObject): string {
  const content = tree.content ?? []
  const arrContent = Array.isArray(content) ? content : [content]
  const strContent = arrContent.map((c) => {
    if (!c) {
      return ''
    }

    if (typeof c === 'string' || typeof c === 'number') {
      return c
    }

    return unparseTree(c)
  })

  const strAttrs = Object.entries(tree.attrs ?? {})
    .map(([k, v]) => (k === v ? k : `${k}=${v}`))
    .join(' ')
  const strAttr = strAttrs.length ? '=' + strAttrs : ''

  return `[${tree.tag}${strAttr}]${strContent.join('')}[/${tree.tag}]`
}

function lowercaseTags() {
  return (tree: BBobCoreTagNodeTree) =>
    tree.walk((content) => {
      if (content && typeof content === 'object') {
        return {
          ...content,
          tag: content.tag.toLowerCase(),
        } satisfies TagNodeObject
      } else return content
    })
}

function sanitizePlugin(allowedTags: (string | Component)[]): BBobPluginFunction {
  return (tree: BBobCoreTagNodeTree) =>
    tree.walk((content) => {
      if (content && typeof content === 'object') {
        if (!allowedTags.includes(content.tag)) {
          const innerContent = content.content
          const arrContent =
            innerContent === undefined ? [] : Array.isArray(innerContent) ? innerContent : [innerContent]

          const probablyTag = typeof content.tag !== 'string' || !content.tag.includes(' ')

          if (probablyTag) {
            console.warn('Possibly unregistered tag:', content.tag)
          }

          return {
            attrs: {},
            content: probablyTag
              ? [`[${content.tag}]`, ...arrContent, `[/${content.tag}]`]
              : [`[${content.tag}]`, ...arrContent],
            tag: 'span',
            start: content.start,
            end: content.end,
          } satisfies TagNodeObject
        }
      }

      return content
    })
}

export const mergeStringsPlugin: () => BBobPluginFunction = () => {
  const walkNode = (t: NodeContent): NodeContent => {
    const tree = t

    if (tree && typeof tree === 'object' && tree.content) {
      if (Array.isArray(tree.content)) {
        const arraryRes = walkArr(tree.content)
        if (!Array.isArray(arraryRes)) {
          return arraryRes
        }
      } else {
        walkNode(tree.content)
      }
    }

    return tree
  }

  const walkArr = (tree: NodeContent[]): NodeContent[] | NodeContent => {
    let currentString = ''
    const result: NodeContent[] = []

    let elem
    while ((elem = tree.shift())) {
      if (typeof elem === 'string') {
        currentString += elem
      } else {
        if (currentString.length > 0) {
          result.push(currentString)
          currentString = ''
        }
        result.push(walkNode(elem))
      }
    }
    if (currentString.length > 0) {
      result.push(currentString)
    }

    tree.push(...result)
    return tree
  }

  return (tree: BBobCoreTagNodeTree) => walkArr(tree) as BBobCoreTagNodeTree
  //return (tree: BBobCoreTagNodeTree) => tree
}

const plugins = [
  lowercaseTags(),
  customPreset(),
  sanitizePlugin([
    BbcodeVideo,
    BbcodeSpoiler,
    BbcodeQuote,
    BbcodePostLink,
    RouterLink,
    'span',
    'a',
    'img',
    'blockquote',
    'pre',
    'ol',
    'ul',
    'li',
    'p',
    'hr',
    'div',
    'tr',
    'td',
    'table',
    'tbody',
    'code',
    'strike',
    'sub',
    'sup',
  ]),
  lineBreakPlugin(),
  mergeStringsPlugin(),
]

export const BbcodeRenderer = defineComponent({
  props: {
    content: String,
  },
  setup(props) {
    function renderContentToVNode(node: NodeContent) {
      if (node && typeof node === 'object') {
        const innerContent = node.content
        const renderedContent =
          innerContent === undefined || innerContent === null
            ? []
            : Array.isArray(innerContent)
              ? renderTreeToVNodes(innerContent)
              : renderContentToVNode(innerContent)

        if (typeof node.tag === 'string') {
          switch (node.tag) {
            case 'br':
            case 'hr':
            case 'img':
              return <node.tag {...node.attrs} />
            default:
              return <node.tag {...node.attrs}>{renderedContent}</node.tag>
          }
        } else {
          return <node.tag {...node.attrs}>{{ default: () => renderedContent }}</node.tag>
        }
      } else {
        return node
      }
    }

    function renderTreeToVNodes(tree: NodeContent[]) {
      return tree.map((content) => renderContentToVNode(content))
    }

    let content = props.content
    if (props.content?.includes('\r')) {
      content = props.content?.replaceAll('\r\n', '\n')
    }

    const tree = bbob(plugins).process(decodeHtmlEntities(content ?? ''), {
      skipParse: false,
      parser: parse,
      render: () => '',
      data: null,
      contextFreeTags: ['noparse', 'code'],

      onlyAllowTags: [
        'b',
        'i',
        'u',
        's',
        'url',
        'img',
        'quote',
        'code',
        'list',
        'color',
        'video',
        'size',
        'spoiler',
        'aname',
        'jumpto',
        'noparse',
        'p',
        'li',
        'hr',
        'left',
        'center',
        'right',
        'font',
        'sigpic',
        'td',
        'tr',
        'table',
        'img2',
        'indent',
        'codei',
        'sub',
        'sup',
        'email',
        'attach',
        'post',
      ],
      caseFreeTags: true,
    }).tree

    return () => <div>{renderTreeToVNodes(tree)}</div>
  },
})
