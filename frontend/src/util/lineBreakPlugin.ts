//https://github.com/JiLiZART/BBob/issues/125#issuecomment-1774257527
import type { BBobCoreTagNodeTree, BBobPluginFunction, BBobPluginOptions, NodeContent } from '@bbob/types'

/**
 * Plugin that converts line breaks to `<br/>` tags.
 * To use, put as function similar to the presets.
 *
 * If a node is marked with `noLineBreakConversion`, then it'll skip the parsing the children
 *
 * @example
 * ```ts
 * const output = bbob([preset(), lineBreakPlugin()]).process(input, {render}).html
 * ```
 */
import { isEOL } from '@bbob/plugin-helper'

/**
 * Checks if input is an object
 * @param value input
 * @returns if value is an object
 */
const isObj = (value: any): value is object => typeof value === 'object'

/**
 * Walks the tree of nodes. Will add `br` tag to all `\n` in format that can be used in any renderer.
 * Preserves \n so that markdown-it doesn't try to treat everything like a block
 *
 * If a node has the property noLineBreakConversion is encountered, will skip parsing children.
 * @param t tree of nodes to be processed
 * @returns modified tree
 */
const walkNode = (t: NodeContent): NodeContent | NodeContent[] => {
  const tree = t

  if (tree && isObj(tree) && tree.content) {
    if ((tree as any).disableLineBreakConversion) {
      // stop walk. children won't be parsed to have <br>
      return tree
    }
    if (Array.isArray(tree.content)) {
      walkArr(tree.content)
    } else {
      walkNode(tree.content)
    }
  }

  if (typeof tree === 'string' && isEOL(tree)) {
    return [{ tag: 'br', attrs: {}, content: null }, '\n']
  }

  return tree
}

const walkArr = (tree: NodeContent[]): NodeContent[] => {
  for (let idx = 0; idx < tree.length; idx++) {
    const child = walkNode(tree[idx]);
    if (Array.isArray(child)) {
      tree.splice(idx, 1, ...child);
      idx += child.length - 1;
    } else {
      tree[idx] = child;
    }
  }
  return tree
}

/**
 * Converts `\n` to `<br/>` self closing tag. Supply this as the last plugin in the preset lists
 *
 * @example converts all line breaks to br
 * ```ts
 * const output = bbob([preset(), lineBreakPlugin()]).process(input, {render}).html
 * ```
 * @example will not convert line breaks inside [nobr]
 * ```ts
 * const nobr = (node: TagNode) => {return { disableLineBreakConversion: true, content: node.content }}; \\ tag in preset
 * ...
 * const output = bbob([preset(), lineBreakPlugin()]).process(input, {render}).html
 * ```
 * @returns plugin to be used in BBob process
 */
export const lineBreakPlugin: () => BBobPluginFunction = () => {
  return (tree: BBobCoreTagNodeTree) => walkArr(tree) as BBobCoreTagNodeTree
}
