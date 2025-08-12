/**
 * @jest-environment jsdom
 */
import { SyncService } from '../syncService'
import { TPosts } from 'src/types'

// Mock dependencies
jest.mock('src/libs/supabase', () => ({
  getSupabaseClient: jest.fn()
}))

jest.mock('src/apis/notion-client', () => ({
  getPosts: jest.fn()
}))

describe('SyncService', () => {
  let syncService: SyncService

  beforeEach(() => {
    syncService = new SyncService()
    jest.clearAllMocks()
  })

  describe('syncNotionToSupabase', () => {
    it('should sync all posts from Notion to Supabase', async () => {
      // Mock Notion posts
      const mockNotionPosts: TPosts = [
        {
          id: 'notion-1',
          title: 'Test Post 1',
          slug: 'test-post-1',
          date: { start_date: '2023-01-01' },
          type: ['Post'],
          status: ['Public'],
          createdTime: '2023-01-01T00:00:00Z',
          fullWidth: false
        },
        {
          id: 'notion-2',
          title: 'Test Post 2',
          slug: 'test-post-2',
          date: { start_date: '2023-01-02' },
          type: ['Post'],
          status: ['Private'],
          createdTime: '2023-01-02T00:00:00Z',
          fullWidth: false
        }
      ]

      const { getPosts } = require('src/apis/notion-client')
      getPosts.mockResolvedValue(mockNotionPosts)

      // Mock Supabase client
      const mockSupabaseClient = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
            })
          }),
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: { id: 'supabase-1' }, error: null })
            })
          })
        })
      }

      const { getSupabaseClient } = require('src/libs/supabase')
      getSupabaseClient.mockReturnValue(mockSupabaseClient)

      const result = await syncService.syncNotionToSupabase()

      expect(result.totalOperations).toBe(2)
      expect(result.successfulOperations).toBe(2)
      expect(result.failedOperations).toBe(0)
      expect(result.status).toBe('completed')
    })

    it('should sync specific posts when postIds provided', async () => {
      const mockNotionPosts: TPosts = [
        {
          id: 'notion-1',
          title: 'Test Post 1',
          slug: 'test-post-1',
          date: { start_date: '2023-01-01' },
          type: ['Post'],
          status: ['Public'],
          createdTime: '2023-01-01T00:00:00Z',
          fullWidth: false
        }
      ]

      const { getPosts } = require('src/apis/notion-client')
      getPosts.mockResolvedValue(mockNotionPosts)

      const mockSupabaseClient = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
            })
          }),
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: { id: 'supabase-1' }, error: null })
            })
          })
        })
      }

      const { getSupabaseClient } = require('src/libs/supabase')
      getSupabaseClient.mockReturnValue(mockSupabaseClient)

      const result = await syncService.syncNotionToSupabase(['notion-1'])

      expect(result.totalOperations).toBe(1)
      expect(result.successfulOperations).toBe(1)
    })

    it('should handle sync errors gracefully', async () => {
      const mockNotionPosts: TPosts = [
        {
          id: 'notion-1',
          title: 'Test Post 1',
          slug: 'test-post-1',
          date: { start_date: '2023-01-01' },
          type: ['Post'],
          status: ['Public'],
          createdTime: '2023-01-01T00:00:00Z',
          fullWidth: false
        }
      ]

      const { getPosts } = require('src/apis/notion-client')
      getPosts.mockResolvedValue(mockNotionPosts)

      // Mock Supabase error
      const mockSupabaseClient = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
            })
          }),
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockRejectedValue(new Error('Database error'))
            })
          })
        })
      }

      const { getSupabaseClient } = require('src/libs/supabase')
      getSupabaseClient.mockReturnValue(mockSupabaseClient)

      const result = await syncService.syncNotionToSupabase()

      expect(result.totalOperations).toBe(1)
      expect(result.successfulOperations).toBe(0)
      expect(result.failedOperations).toBe(1)
    })
  })

  describe('incrementalSync', () => {
    it('should sync only modified posts', async () => {
      // Mock posts with different timestamps
      const mockNotionPosts: TPosts = [
        {
          id: 'notion-1',
          title: 'Old Post',
          slug: 'old-post',
          date: { start_date: '2023-01-01' },
          type: ['Post'],
          status: ['Public'],
          createdTime: '2023-01-01T00:00:00Z', // Old
          fullWidth: false
        },
        {
          id: 'notion-2',
          title: 'New Post',
          slug: 'new-post',
          date: { start_date: '2023-01-02' },
          type: ['Post'],
          status: ['Public'],
          createdTime: '2023-01-02T12:00:00Z', // Recent
          fullWidth: false
        }
      ]

      const { getPosts } = require('src/apis/notion-client')
      getPosts.mockResolvedValue(mockNotionPosts)

      // Mock Supabase to return a last sync time
      const mockSupabaseClient = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ 
                  data: { updated_at: '2023-01-01T10:00:00Z' }, 
                  error: null 
                })
              })
            }),
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
            })
          }),
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: { id: 'supabase-1' }, error: null })
            })
          })
        })
      }

      const { getSupabaseClient } = require('src/libs/supabase')
      getSupabaseClient.mockReturnValue(mockSupabaseClient)

      const result = await syncService.incrementalSync()

      // Should only sync the newer post
      expect(result.totalOperations).toBe(1)
      expect(result.successfulOperations).toBe(1)
    })
  })

  describe('getSyncStats', () => {
    it('should return sync statistics', async () => {
      const mockNotionPosts: TPosts = [
        {
          id: 'notion-1',
          title: 'Test Post',
          slug: 'test-post',
          date: { start_date: '2023-01-01' },
          type: ['Post'],
          status: ['Public'],
          createdTime: '2023-01-01T00:00:00Z',
          fullWidth: false
        }
      ]

      const { getPosts } = require('src/apis/notion-client')
      getPosts.mockResolvedValue(mockNotionPosts)

      const mockSupabaseClient = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue({
            data: [{ notion_id: 'notion-1', updated_at: '2023-01-01T00:00:00Z' }],
            error: null
          }),
          order: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ 
                data: { updated_at: '2023-01-01T00:00:00Z' }, 
                error: null 
              })
            })
          })
        })
      }

      const { getSupabaseClient } = require('src/libs/supabase')
      getSupabaseClient.mockReturnValue(mockSupabaseClient)

      const stats = await syncService.getSyncStats()

      expect(stats.totalPosts).toBe(1)
      expect(stats.syncedPosts).toBe(1)
      expect(stats.pendingPosts).toBe(0)
      expect(stats.lastSyncTime).toBeDefined()
    })
  })

  describe('configuration', () => {
    it('should update configuration', () => {
      const newConfig = {
        batchSize: 20,
        maxRetries: 5
      }

      syncService.updateConfig(newConfig)
      const config = syncService.getConfig()

      expect(config.batchSize).toBe(20)
      expect(config.maxRetries).toBe(5)
    })

    it('should preserve existing config when updating partially', () => {
      const originalConfig = syncService.getConfig()
      
      syncService.updateConfig({ batchSize: 15 })
      const updatedConfig = syncService.getConfig()

      expect(updatedConfig.batchSize).toBe(15)
      expect(updatedConfig.maxRetries).toBe(originalConfig.maxRetries)
    })
  })
})