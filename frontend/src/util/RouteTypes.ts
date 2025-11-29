export interface ForumRoute {
  forumPath: string[]
}

export interface TopicRoute extends ForumRoute {
  topic: string
}
