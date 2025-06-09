import type { Forum } from '@yukkuricraft-forums-archive/database'

export interface ForumTree extends Forum {
  subForums: ForumTree[]
}