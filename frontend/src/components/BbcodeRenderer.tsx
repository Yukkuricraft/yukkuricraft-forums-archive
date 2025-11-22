import vuePreset from '@bbob/preset-vue'
import BbcodeVideo from '@/components/bbcode/BbcodeVideo.vue'
import BbcodeSpoiler from '@/components/bbcode/BbcodeSpoiler.vue'
import bbob from '@bbob/core'
import { lineBreakPlugin } from '@/components/bbcode/lineBreakPlugin.ts'
import type { BBobCoreTagNodeTree, BBobPluginFunction, NodeContent, TagNodeObject } from '@bbob/types'
import { defineComponent, type Component } from 'vue'
import BbcodeQuote from '@/components/bbcode/BbcodeQuote.vue'
import { parse } from '@bbob/parser'
import { decodeHtmlEntities } from '@/util/htmlEntities.ts'

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

function validateUrl(urlStr: string): string | undefined {
  try {
    const url = new URL(urlStr)
    if (url.protocol === 'https:' || url.protocol === 'http:') {
      return url.href
    }
    console.warn('Invalid url', url)
  } catch (e) {
    console.warn('Invalid url', urlStr, e)
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
              return '12px' //TODO: Normal text size roughly
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
  // TODO: Test
  p: (node) => ({
    ...node,
    attrs: {},
    tag: 'p',
  }),
  // TODO: Handle creating ul elements
  li: (node) => ({
    ...node,
    attrs: {},
    tag: 'li',
  }),
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
  url: (node) => ({
    ...node,
    attrs: {
      href: (() => {
        let reference = attr(node.attrs) ?? node.content
        if (Array.isArray(reference) && reference.length === 1) {
          reference = reference[0]
        }

        if (typeof reference !== 'string') {
          return undefined
        }

        return validateUrl(reference)
      })(),
    },
    tag: 'a',
  }),
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
        fontFamily: attr(node.attrs) ?? undefined,
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

        // TODO: Validate style and other attributes
      }

      return content
    })
}

const plugins = [
  customPreset(),
  sanitizePlugin([
    BbcodeVideo,
    BbcodeSpoiler,
    BbcodeQuote,
    'span',
    'a',
    'img',
    'blockquote',
    'pre',
    'ol',
    'ul',
    'p',
    'hr',
    'div',
    'tr',
    'td',
    'table',
    'tbody',
  ]),
  lineBreakPlugin(),
]

export const BbcodeRenderer = defineComponent({
  props: {
    content: String,
  },
  setup(props) {
    function renderContentToVNode(node: NodeContent, depth: number) {
      if (node && typeof node === 'object') {
        const innerContent = node.content
        const arrContent = innerContent === undefined ? [] : Array.isArray(innerContent) ? innerContent : [innerContent]

        if (typeof node.tag === 'string') {
          return <node.tag {...node.attrs}>{renderTreeToVNodes(arrContent, depth + 1)}</node.tag>
        } else {
          return (
            <node.tag {...node.attrs}>
              {{
                default: () => renderTreeToVNodes(arrContent, depth + 1),
              }}
            </node.tag>
          )
        }
      } else {
        return <>{node}</>
      }
    }

    function renderTreeToVNodes(tree: NodeContent[], depth: number) {
      return <>{tree.map((content) => renderContentToVNode(content, depth + 1))}</>
    }

    const tree = bbob(plugins).process(decodeHtmlEntities(props.content ?? ''), {
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
      ],
      caseFreeTags: true,
    }).tree

    return () => <div>{renderTreeToVNodes(tree, 0)}</div>
  },
})
