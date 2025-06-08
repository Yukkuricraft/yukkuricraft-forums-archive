import type { ColumnType } from 'kysely'
export type Generated<T> =
  T extends ColumnType<infer S, infer I, infer U> ? ColumnType<S, I | undefined, U> : ColumnType<T, T | undefined, T>
export type Timestamp = ColumnType<Date, Date | string, Date | string>

export type Avatar = {
  id: number
  filename: string
  data: Buffer
  width: number
  height: number
  filesize: string
  thumbnailData: Buffer | null
  thumbnailWidth: number
  thumbnailHeight: number
  extension: string
}
export type Forum = {
  id: number
  parentId: number | null
  slug: string
  title: string
  description: string | null
  displayorder: number
  topicsCount: number
  postsCount: number
}
export type ForumFullSlug = {
  id: number
  slug: string[]
}
export type LastPostEdit = {
  postId: number
  postEditId: number
}
export type LastPostInTopic = {
  topicId: number
  postId: number
}
export type Post = {
  id: number
  topicId: number
  creatorId: number | null
  createdAt: Timestamp
  updatedAt: Timestamp
  content: string
  deletedAt: Timestamp | null
  hidden: boolean
}
export type PostEditHistory = {
  id: number
  postId: number
  creatorId: number | null
  createdAt: Timestamp
  reason: string
  original: boolean
  text: string
}
export type PostIdx = {
  id: number
  idx: number
}
export type PostLink = {
  postId: number
  url: string
  urlTitle: string
}
export type PostPoll = {
  postId: number
  multiple: boolean
}
export type PostPollOption = {
  id: number
  postId: number
  title: string
}
export type PostPollVote = {
  id: number
  pollOptionId: number
  userId: number
  createdAt: Timestamp
}
export type Smilie = {
  id: number
  title: string
  text: string
  path: string
}
export type Tag = {
  id: number
  text: string
}
export type Topic = {
  id: number
  forumId: number
  creatorId: number | null
  createdAt: Timestamp
  slug: string
  title: string
  sticky: boolean
  deletedAt: Timestamp | null
  hidden: boolean
  postCount: number
}
export type TopicRedirect = {
  topicId: number
  redirectToId: number
}
export type TopicTag = {
  topicId: number
  tagId: number
  creatorId: number | null
  createdAt: Timestamp
}
export type User = {
  id: number
  userGroupId: number
  slug: string
  name: string
  title: string | null
  createdAt: Timestamp | null
  postCount: number
  signature: string | null
  avatar: number | null
  biography: string | null
  location: string | null
  interests: string | null
  occupation: string | null
  inGameName: string | null
}
export type UserGroup = {
  id: number
  title: string
  userTitle: string
  color: string | null
}
export type DB = {
  avatar: Avatar
  forum: Forum
  forumFullSlug: ForumFullSlug
  lastEditForPost: LastPostEdit
  lastPostInTopic: LastPostInTopic
  post: Post
  postEditHistory: PostEditHistory
  postIdx: PostIdx
  postPoll: PostPoll
  postPollOption: PostPollOption
  postPollVote: PostPollVote
  PostLink: PostLink
  Smilie: Smilie
  Tag: Tag
  topic: Topic
  topicRedirect: TopicRedirect
  topicTag: TopicTag
  user: User
  userGroup: UserGroup
}
