export interface Post {
  id: string
  notion_id: string
  title: string
  slug: string
  content: any // JSONB content from Notion
  status: 'draft' | 'published' | 'archived'
  published_at: string | null
  created_at: string
  updated_at: string
  tags: string[]
  category: string | null
  summary: string | null
  cover_image?: string | null
}

export interface Task {
  id: string
  title: string
  description: string
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high'
  due_date: string | null
  created_at: string
  updated_at: string
  post_id: string | null // Foreign key to posts table
}

export interface PageView {
  id: string
  post_id: string
  view_count: number
  unique_views: number
  last_viewed: string
  created_at: string
  updated_at: string
}

export type Tables = {
  posts: Post
  tasks: Task
  page_views: PageView
}