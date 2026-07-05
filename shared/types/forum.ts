import type { SerializeObject } from 'nitropack/types'
import type { Forum } from '~~/generated/prisma/client.js'

export interface ForumTreeNode extends Forum {
  subForums: ForumTreeNode[]
}

export type ForumTree = SerializeObject<ForumTreeNode>
