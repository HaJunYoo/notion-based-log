/**
 * @jest-environment jsdom
 */
import { postService } from '../postService'
import { TPost, TPosts } from 'src/types'

// Mock the dependencies
jest.mock('src/libs/supabase', () => ({
  getSupabaseClient: jest.fn()
}))

jest.mock('src/apis/notion-client', () => ({
  getPosts: jest.fn(),
  getRecordMap: jest.fn()
}))

jest.mock('../../../site.config', () => ({
  CONFIG: {
    supabaseConfig: {
      enable: true,
      url: 'test-url',
      anonKey: 'test-key'
    },
    notionConfig: {
      pageId: 'test-page-id'
    }
  }
}))

describe('PostService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getPosts', () => {
    it('should return posts from Supabase as primary source', async () => {
      const mockSupabaseClient = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: [
                  {
                    id: '1',
                    notion_id: 'notion-1',
                    title: 'Test Post',
                    slug: 'test-post',
                    status: 'published',
                    created_at: '2023-01-01T00:00:00Z',
                    published_at: '2023-01-01T00:00:00Z',
                    tags: ['test'],
                    category: 'blog',
                    summary: 'Test summary'
                  }
                ],
                error: null
              })
            })
          })
        })
      }

      const { getSupabaseClient } = require('src/libs/supabase')
      getSupabaseClient.mockReturnValue(mockSupabaseClient)

      const result = await postService.getPosts()

      expect(result.source).toBe('supabase')
      expect(result.data).toHaveLength(1)
      expect(result.data[0].title).toBe('Test Post')
      expect(result.fallback).toBeFalsy()
    })

    it('should fallback to Notion when Supabase fails', async () => {
      // Mock Supabase failure
      const mockSupabaseClient = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockRejectedValue(new Error('Supabase connection failed'))
            })
          })
        })
      }

      const { getSupabaseClient } = require('src/libs/supabase')
      getSupabaseClient.mockReturnValue(mockSupabaseClient)

      // Mock Notion success
      const { getPosts } = require('src/apis/notion-client')
      const mockNotionPosts: TPosts = [
        {
          id: 'notion-1',
          title: 'Notion Post',
          slug: 'notion-post',
          date: { start_date: '2023-01-01' },
          type: ['Post'],
          status: ['Public'],
          createdTime: '2023-01-01T00:00:00Z',
          fullWidth: false
        }
      ]
      getPosts.mockResolvedValue(mockNotionPosts)

      const result = await postService.getPosts()

      expect(result.source).toBe('notion')
      expect(result.data).toHaveLength(1)
      expect(result.data[0].title).toBe('Notion Post')
      expect(result.fallback).toBe(true)
    })

    it('should throw error when both sources fail', async () => {
      // Mock Supabase failure
      const mockSupabaseClient = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockRejectedValue(new Error('Supabase failed'))
            })
          })
        })
      }

      const { getSupabaseClient } = require('src/libs/supabase')
      getSupabaseClient.mockReturnValue(mockSupabaseClient)

      // Mock Notion failure
      const { getPosts } = require('src/apis/notion-client')
      getPosts.mockRejectedValue(new Error('Notion failed'))

      await expect(postService.getPosts()).rejects.toThrow()
    })
  })

  describe('getPost', () => {
    it('should return specific post from Supabase', async () => {
      const mockSupabaseClient = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: {
                    id: '1',
                    notion_id: 'notion-1',
                    title: 'Test Post',
                    slug: 'test-post',
                    status: 'published',
                    created_at: '2023-01-01T00:00:00Z',
                    published_at: '2023-01-01T00:00:00Z',
                    tags: ['test'],
                    category: 'blog'
                  },
                  error: null
                })
              })
            })
          })
        })
      }

      const { getSupabaseClient } = require('src/libs/supabase')
      getSupabaseClient.mockReturnValue(mockSupabaseClient)

      const result = await postService.getPost('notion-1')

      expect(result.source).toBe('supabase')
      expect(result.data.title).toBe('Test Post')
    })

    it('should fallback to Notion for specific post', async () => {
      // Mock Supabase failure
      const mockSupabaseClient = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockRejectedValue(new Error('Post not found in Supabase'))
              })
            })
          })
        })
      }

      const { getSupabaseClient } = require('src/libs/supabase')
      getSupabaseClient.mockReturnValue(mockSupabaseClient)

      // Mock Notion success
      const { getPosts } = require('src/apis/notion-client')
      const mockNotionPosts: TPosts = [
        {
          id: 'notion-1',
          title: 'Notion Post',
          slug: 'notion-post',
          date: { start_date: '2023-01-01' },
          type: ['Post'],
          status: ['Public'],
          createdTime: '2023-01-01T00:00:00Z',
          fullWidth: false
        }
      ]
      getPosts.mockResolvedValue(mockNotionPosts)

      const result = await postService.getPost('notion-1')

      expect(result.source).toBe('notion')
      expect(result.data.title).toBe('Notion Post')
      expect(result.fallback).toBe(true)
    })
  })

  describe('healthCheck', () => {
    it('should return true when Supabase is healthy', async () => {
      const mockSupabaseClient = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({ error: null })
          })
        })
      }

      const { getSupabaseClient } = require('src/libs/supabase')
      getSupabaseClient.mockReturnValue(mockSupabaseClient)

      const result = await postService.healthCheck()
      expect(result).toBe(true)
    })

    it('should return true when Notion is healthy (fallback)', async () => {
      // Mock Supabase failure
      const mockSupabaseClient = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({ error: new Error('Supabase down') })
          })
        })
      }

      const { getSupabaseClient } = require('src/libs/supabase')
      getSupabaseClient.mockReturnValue(mockSupabaseClient)

      // Mock Notion success
      const { getPosts } = require('src/apis/notion-client')
      getPosts.mockResolvedValue([])

      const result = await postService.healthCheck()
      expect(result).toBe(true)
    })

    it('should return false when both services are unhealthy', async () => {
      // Mock Supabase failure
      const mockSupabaseClient = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({ error: new Error('Supabase down') })
          })
        })
      }

      const { getSupabaseClient } = require('src/libs/supabase')
      getSupabaseClient.mockReturnValue(mockSupabaseClient)

      // Mock Notion failure
      const { getPosts } = require('src/apis/notion-client')
      getPosts.mockRejectedValue(new Error('Notion down'))

      const result = await postService.healthCheck()
      expect(result).toBe(false)
    })
  })

  describe('cache management', () => {
    it('should invalidate posts cache', () => {
      expect(() => postService.invalidatePostsCache()).not.toThrow()
    })

    it('should invalidate specific post cache', () => {
      expect(() => postService.invalidatePostCache('test-id')).not.toThrow()
    })
  })
})