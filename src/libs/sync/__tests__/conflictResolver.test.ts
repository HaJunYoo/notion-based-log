/**
 * @jest-environment jsdom
 */
import { ConflictResolver } from '../conflictResolver'
import { TPost } from 'src/types'
import { Post as SupabasePost } from 'src/libs/supabase/types'

describe('ConflictResolver', () => {
  let conflictResolver: ConflictResolver

  beforeEach(() => {
    conflictResolver = ConflictResolver.getInstance()
  })

  const mockNotionPost: TPost = {
    id: 'notion-1',
    title: 'Test Post',
    slug: 'test-post',
    date: { start_date: '2023-01-01' },
    type: ['Post'],
    status: ['Public'],
    tags: ['test', 'notion'],
    category: ['Tech'],
    summary: 'Notion summary',
    createdTime: '2023-01-01T10:00:00Z',
    fullWidth: false
  }

  const mockSupabasePost: SupabasePost = {
    id: 'supabase-1',
    notion_id: 'notion-1',
    title: 'Test Post Modified',
    slug: 'test-post',
    content: {},
    status: 'published',
    published_at: '2023-01-01T00:00:00Z',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T12:00:00Z',
    tags: ['test', 'supabase'],
    category: 'Tech',
    summary: 'Supabase summary longer version',
    cover_image: null
  }

  describe('analyzeConflict', () => {
    it('should detect content conflicts', () => {
      const analysis = conflictResolver.analyzeConflict(mockNotionPost, mockSupabasePost)
      
      expect(analysis.hasConflict).toBe(true)
      expect(analysis.conflictTypes).toContain('content')
      expect(analysis.confidence).toBeGreaterThan(0)
    })

    it('should detect timestamp conflicts', () => {
      const recentSupabasePost = {
        ...mockSupabasePost,
        updated_at: '2023-01-01T15:00:00Z' // 5 minutes after Notion
      }

      const analysis = conflictResolver.analyzeConflict(mockNotionPost, recentSupabasePost)
      
      expect(analysis.hasConflict).toBe(true)
      expect(analysis.conflictTypes).toContain('timestamp')
    })

    it('should detect metadata conflicts', () => {
      const differentMetadataPost = {
        ...mockSupabasePost,
        tags: ['different', 'tags'],
        category: 'Different Category'
      }

      const analysis = conflictResolver.analyzeConflict(mockNotionPost, differentMetadataPost)
      
      expect(analysis.hasConflict).toBe(true)
      expect(analysis.conflictTypes).toContain('metadata')
    })

    it('should recommend notion-wins for minor conflicts', () => {
      const minorConflictPost = {
        ...mockSupabasePost,
        title: mockNotionPost.title, // Same title
        updated_at: '2023-01-01T10:30:00Z' // Only 30 seconds difference
      }

      const analysis = conflictResolver.analyzeConflict(mockNotionPost, minorConflictPost)
      
      expect(analysis.recommendedResolution).toBe('notion-wins')
    })
  })

  describe('resolveConflict', () => {
    it('should resolve notion-wins correctly', () => {
      const conflict = {
        notionPost: mockNotionPost,
        supabasePost: mockSupabasePost,
        conflictType: 'content' as const,
        resolution: 'notion-wins' as const
      }

      const result = conflictResolver.resolveConflict(conflict)
      
      expect(result.mergedPost).toEqual(mockNotionPost)
      expect(result.mergeStrategies).toContain('notion-wins')
      expect(result.warnings).toContain('Supabase changes will be overwritten')
    })

    it('should resolve merge correctly', () => {
      const conflict = {
        notionPost: mockNotionPost,
        supabasePost: mockSupabasePost,
        conflictType: 'content' as const,
        resolution: 'merge' as const
      }

      const result = conflictResolver.resolveConflict(conflict)
      
      expect(result.mergedPost.title).toBe(mockNotionPost.title) // Prefer Notion title
      expect(result.mergedPost.summary).toBe(mockSupabasePost.summary) // Prefer longer summary
      expect(result.mergedPost.tags).toEqual(expect.arrayContaining(['test', 'notion', 'supabase'])) // Merge tags
      expect(result.mergeStrategies).toContain('merge')
    })

    it('should handle skip resolution', () => {
      const conflict = {
        notionPost: mockNotionPost,
        supabasePost: mockSupabasePost,
        conflictType: 'content' as const,
        resolution: 'skip' as const
      }

      const result = conflictResolver.resolveConflict(conflict)
      
      expect(result.mergedPost).toEqual(mockNotionPost)
      expect(result.mergeStrategies).toContain('skip')
      expect(result.warnings).toContain('Conflict was skipped, no changes made')
    })
  })

  describe('detectConflicts', () => {
    it('should detect conflicts between post arrays', () => {
      const notionPosts = [mockNotionPost]
      const supabasePosts = [mockSupabasePost]

      const conflicts = conflictResolver.detectConflicts(notionPosts, supabasePosts)
      
      expect(conflicts).toHaveLength(1)
      expect(conflicts[0].notionPost).toEqual(mockNotionPost)
      expect(conflicts[0].supabasePost).toEqual(mockSupabasePost)
    })

    it('should return no conflicts for identical posts', () => {
      const identicalSupabasePost = {
        ...mockSupabasePost,
        title: mockNotionPost.title,
        summary: mockNotionPost.summary,
        tags: mockNotionPost.tags,
        category: mockNotionPost.category?.[0],
        updated_at: mockNotionPost.createdTime
      }

      const conflicts = conflictResolver.detectConflicts([mockNotionPost], [identicalSupabasePost])
      
      expect(conflicts).toHaveLength(0)
    })
  })

  describe('generateConflictReport', () => {
    it('should generate readable conflict report', () => {
      const conflicts = [{
        notionPost: mockNotionPost,
        supabasePost: mockSupabasePost,
        conflictType: 'content' as const,
        resolution: 'merge' as const
      }]

      const report = conflictResolver.generateConflictReport(conflicts)
      
      expect(report).toContain('Conflict Report (1 conflicts detected)')
      expect(report).toContain('Test Post')
      expect(report).toContain('content')
      expect(report).toContain('notion-1')
    })

    it('should handle empty conflicts', () => {
      const report = conflictResolver.generateConflictReport([])
      expect(report).toBe('No conflicts detected.')
    })
  })
})