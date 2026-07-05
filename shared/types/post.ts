import type { SerializeObject } from 'nitropack/types'
import type { PostEditHistory } from '~~/generated/prisma/client'

export interface PostRecord {
  id: number
  topicId: number
  creatorId: number | null
  createdAt: Date
  updatedAt: Date
  content: string
  deletedAt: Date | null
  hidden: boolean
  idx: number
  postEditCreatorId: number | null
  postEditCreatedAt: Date | null
  postEditReason: string | null
}

export type Post = SerializeObject<PostRecord>
export type PostEdit = SerializeObject<PostEditHistory>
