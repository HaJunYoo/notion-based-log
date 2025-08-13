import { getPosts as getNotionPosts, getRecordMap } from 'src/apis/notion-client'
import { getSupabaseClient } from 'src/libs/supabase'
import { Post as SupabasePost } from 'src/libs/supabase/types'
import { PostDetail, TPost, TPosts } from 'src/types'
import { BaseHybridService } from './baseService'
import { CACHE_KEYS } from './config'
import { ServiceResponse } from './types'

class PostService extends BaseHybridService {
  async getPosts(): Promise<ServiceResponse<TPosts>> {
    return this.executeWithFallback(
      () => this.getPostsFromSupabase(),
      () => this.getPostsFromNotion(),
      CACHE_KEYS.POSTS
    )
  }

  async getPost(id: string): Promise<ServiceResponse<TPost>> {
    return this.executeWithFallback(
      () => this.getPostFromSupabase(id),
      () => this.getPostFromNotion(id),
      CACHE_KEYS.POST(id)
    )
  }

  async getPostDetail(slug: string): Promise<ServiceResponse<PostDetail>> {
    // For post details with record map, we need to combine data from both sources
    const cacheKey = `${CACHE_KEYS.POST(slug)}:detail`

    return this.executeWithFallback(
      () => this.getPostDetailFromSupabase(slug),
      () => this.getPostDetailFromNotion(slug),
      cacheKey
    )
  }

  async healthCheck(): Promise<boolean> {
    try {
      // Check both services
      const [supabaseHealth, notionHealth] = await Promise.allSettled([
        this.checkSupabaseHealth(),
        this.checkNotionHealth()
      ])

      // Return true if at least one service is healthy
      return (
        supabaseHealth.status === 'fulfilled' && supabaseHealth.value ||
        notionHealth.status === 'fulfilled' && notionHealth.value
      )
    } catch (error) {
      console.error('Health check failed:', error)
      return false
    }
  }

  private async getPostsFromSupabase(): Promise<ServiceResponse<TPosts>> {
    const supabase = getSupabaseClient()

    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('status', 'published')
      .order('published_at', { ascending: false })

    if (error) {
      throw new Error(`Supabase error: ${error.message}`)
    }

    const posts = data?.map(post => this.mapSupabasePostToTPost(post as unknown as SupabasePost)) || []

    return {
      data: posts,
      source: 'supabase'
    }
  }

  private async getPostsFromNotion(): Promise<ServiceResponse<TPosts>> {
    const posts = await getNotionPosts()

    return {
      data: posts,
      source: 'notion'
    }
  }

  private async getPostFromSupabase(id: string): Promise<ServiceResponse<TPost>> {
    const supabase = getSupabaseClient()

    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('notion_id', id)
      .eq('status', 'published')
      .single()

    if (error) {
      throw new Error(`Supabase error: ${error.message}`)
    }

    const post = this.mapSupabasePostToTPost(data as unknown as SupabasePost)

    return {
      data: post,
      source: 'supabase'
    }
  }

  private async getPostFromNotion(id: string): Promise<ServiceResponse<TPost>> {
    // Get posts from Notion and find the specific one
    const posts = await getNotionPosts()
    const post = posts.find(p => p.id === id || p.slug === id)

    if (!post) {
      throw new Error(`Post with id ${id} not found in Notion`)
    }

    return {
      data: post,
      source: 'notion'
    }
  }

  private async getPostDetailFromSupabase(slug: string): Promise<ServiceResponse<PostDetail>> {
    const supabase = getSupabaseClient()

    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .single()

    if (error) {
      throw new Error(`Supabase error: ${error.message}`)
    }

    const supabasePost = data as unknown as SupabasePost
    const post = this.mapSupabasePostToTPost(supabasePost)

    // Always fetch record map from Notion to ensure the latest content,
    // regardless of any stored content in Supabase
    const recordMap: any = await getRecordMap(supabasePost.notion_id)

    if (!recordMap) {
      throw new Error(`Could not fetch record map for post ${slug}`)
    }

    const postDetail: PostDetail = {
      ...post,
      recordMap
    }

    return {
      data: postDetail,
      source: 'supabase'
    }
  }

  private async getPostDetailFromNotion(slug: string): Promise<ServiceResponse<PostDetail>> {
    // Get posts from Notion and find the specific one
    const posts = await getNotionPosts()
    const post = posts.find(p => p.slug === slug)

    if (!post) {
      throw new Error(`Post with slug ${slug} not found in Notion`)
    }

    // Get record map for the post
    const recordMap = await getRecordMap(post.id)

    if (!recordMap) {
      throw new Error(`Could not fetch record map for post ${slug}`)
    }

    const postDetail: PostDetail = {
      ...post,
      recordMap
    }

    return {
      data: postDetail,
      source: 'notion'
    }
  }

  private async checkSupabaseHealth(): Promise<boolean> {
    try {
      if (!this.config.enableSupabase) {
        return false
      }

      const supabase = getSupabaseClient()

      // Try a simple query to check connection
      const { error } = await supabase
        .from('posts')
        .select('id')
        .limit(1)

      return !error
    } catch (error) {
      console.error('Supabase health check failed:', error)
      return false
    }
  }

  private async checkNotionHealth(): Promise<boolean> {
    try {
      // Try to fetch posts from Notion with a timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Notion health check timeout')), 5000)
      })

      await Promise.race([
        getNotionPosts(),
        timeoutPromise
      ])

      return true
    } catch (error) {
      console.error('Notion health check failed:', error)
      return false
    }
  }

  private mapSupabasePostToTPost(supabasePost: SupabasePost): TPost {
    return {
      id: supabasePost.notion_id,
      date: {
        start_date: supabasePost.published_at || supabasePost.created_at
      },
      type: ['Post'], // Default type
      slug: supabasePost.slug,
      tags: supabasePost.tags || [],
      category: supabasePost.category ? [supabasePost.category] : undefined,
      summary: supabasePost.summary || undefined,
      title: supabasePost.title,
      status: ['Public'], // Map published status
      createdTime: supabasePost.created_at,
      fullWidth: false, // Default value
      thumbnail: supabasePost.cover_image || undefined,
    }
  }

  // Utility methods for cache management
  invalidatePostsCache(): void {
    this.clearCache('posts')
  }

  invalidatePostCache(id: string): void {
    this.clearCache(`post:${id}`)
  }
}

// Export singleton instance
export const postService = new PostService()
export default postService
