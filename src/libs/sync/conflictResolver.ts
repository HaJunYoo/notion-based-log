import { TPost } from 'src/types'
import { Post as SupabasePost } from 'src/libs/supabase/types'
import { SyncConflict, ConflictResolution } from './types'

export interface ConflictAnalysis {
  hasConflict: boolean
  conflictTypes: ('content' | 'metadata' | 'timestamp')[]
  confidence: number // 0-1 scale
  recommendedResolution: ConflictResolution
  reason: string
}

export interface ConflictMergeResult {
  mergedPost: TPost
  mergeStrategies: string[]
  warnings: string[]
}

export class ConflictResolver {
  private static instance: ConflictResolver
  
  private constructor() {}
  
  static getInstance(): ConflictResolver {
    if (!ConflictResolver.instance) {
      ConflictResolver.instance = new ConflictResolver()
    }
    return ConflictResolver.instance
  }

  analyzeConflict(notionPost: TPost, supabasePost: SupabasePost): ConflictAnalysis {
    const conflictTypes: ('content' | 'metadata' | 'timestamp')[] = []
    let confidence = 0
    let recommendedResolution: ConflictResolution = 'notion-wins'
    let reason = ''

    // Check timestamp conflicts
    const notionUpdated = new Date(notionPost.createdTime)
    const supabaseUpdated = new Date(supabasePost.updated_at)
    const timeDiff = Math.abs(supabaseUpdated.getTime() - notionUpdated.getTime())

    if (timeDiff > 60000) { // More than 1 minute difference
      conflictTypes.push('timestamp')
      confidence += 0.3
    }

    // Check content conflicts
    const contentConflict = this.hasContentConflict(notionPost, supabasePost)
    if (contentConflict) {
      conflictTypes.push('content')
      confidence += 0.4
    }

    // Check metadata conflicts
    const metadataConflict = this.hasMetadataConflict(notionPost, supabasePost)
    if (metadataConflict) {
      conflictTypes.push('metadata')
      confidence += 0.3
    }

    // Determine recommendation
    if (conflictTypes.length === 0) {
      recommendedResolution = 'notion-wins'
      reason = 'No significant conflicts detected'
      confidence = 0
    } else if (supabaseUpdated > notionUpdated && timeDiff > 300000) { // 5 minutes
      recommendedResolution = 'merge'
      reason = 'Supabase version is significantly newer, suggest merging changes'
    } else if (conflictTypes.includes('content')) {
      recommendedResolution = 'merge'
      reason = 'Content differences detected, merging recommended'
    } else {
      recommendedResolution = 'notion-wins'
      reason = 'Notion is source of truth, minor conflicts can be overwritten'
    }

    return {
      hasConflict: conflictTypes.length > 0,
      conflictTypes,
      confidence: Math.min(confidence, 1),
      recommendedResolution,
      reason
    }
  }

  resolveConflict(
    conflict: SyncConflict,
    resolution?: ConflictResolution
  ): ConflictMergeResult {
    const resolveWith = resolution || conflict.resolution

    switch (resolveWith) {
      case 'notion-wins':
        return this.resolveNotionWins(conflict)
      case 'supabase-wins':
        return this.resolveSupabaseWins(conflict)
      case 'merge':
        return this.resolveMerge(conflict)
      case 'skip':
        return this.resolveSkip(conflict)
      default:
        throw new Error(`Unknown resolution strategy: ${resolveWith}`)
    }
  }

  private resolveNotionWins(conflict: SyncConflict): ConflictMergeResult {
    return {
      mergedPost: conflict.notionPost,
      mergeStrategies: ['notion-wins'],
      warnings: ['Supabase changes will be overwritten']
    }
  }

  private resolveSupabaseWins(conflict: SyncConflict): ConflictMergeResult {
    // Convert Supabase post back to TPost format
    const mergedPost: TPost = {
      id: conflict.supabasePost.notion_id,
      title: conflict.supabasePost.title,
      slug: conflict.supabasePost.slug,
      date: { start_date: conflict.supabasePost.published_at || conflict.supabasePost.created_at },
      type: ['Post'],
      status: conflict.supabasePost.status === 'published' ? ['Public'] : ['Private'],
      tags: conflict.supabasePost.tags || [],
      category: conflict.supabasePost.category ? [conflict.supabasePost.category] : undefined,
      summary: conflict.supabasePost.summary || undefined,
      createdTime: conflict.supabasePost.created_at,
      fullWidth: false,
      thumbnail: conflict.supabasePost.cover_image || null
    }

    return {
      mergedPost,
      mergeStrategies: ['supabase-wins'],
      warnings: ['Notion changes will be ignored']
    }
  }

  private resolveMerge(conflict: SyncConflict): ConflictMergeResult {
    const { notionPost, supabasePost } = conflict
    const warnings: string[] = []
    const strategies: string[] = ['merge']

    // Start with Notion post as base (source of truth for content)
    const mergedPost: TPost = { ...notionPost }

    // Merge title (prefer Notion)
    if (notionPost.title !== supabasePost.title) {
      strategies.push('title-from-notion')
      if (supabasePost.title.length > notionPost.title.length) {
        warnings.push('Supabase had a longer title that was ignored')
      }
    }

    // Merge tags (union of both sets)
    const notionTags = new Set(notionPost.tags || [])
    const supabaseTags = new Set(supabasePost.tags || [])
    const mergedTags = [...new Set([...notionTags, ...supabaseTags])]
    
    if (mergedTags.length > (notionPost.tags?.length || 0)) {
      mergedPost.tags = mergedTags
      strategies.push('tags-merged')
    }

    // Merge category (prefer Notion, warn if different)
    if (supabasePost.category && 
        supabasePost.category !== notionPost.category?.[0]) {
      warnings.push(`Category conflict: Notion="${notionPost.category?.[0]}" vs Supabase="${supabasePost.category}"`)
    }

    // Merge summary (prefer longer summary)
    if (supabasePost.summary && 
        (!notionPost.summary || supabasePost.summary.length > notionPost.summary.length)) {
      mergedPost.summary = supabasePost.summary
      strategies.push('summary-from-supabase')
    }

    // Keep Notion's publication status (source of truth)
    strategies.push('status-from-notion')

    return {
      mergedPost,
      mergeStrategies: strategies,
      warnings
    }
  }

  private resolveSkip(conflict: SyncConflict): ConflictMergeResult {
    return {
      mergedPost: conflict.notionPost,
      mergeStrategies: ['skip'],
      warnings: ['Conflict was skipped, no changes made']
    }
  }

  private hasContentConflict(notionPost: TPost, supabasePost: SupabasePost): boolean {
    // Compare basic content fields
    return (
      notionPost.title !== supabasePost.title ||
      (notionPost.summary || '') !== (supabasePost.summary || '') ||
      notionPost.slug !== supabasePost.slug
    )
  }

  private hasMetadataConflict(notionPost: TPost, supabasePost: SupabasePost): boolean {
    // Compare metadata fields
    const notionTags = (notionPost.tags || []).sort().join(',')
    const supabaseTags = (supabasePost.tags || []).sort().join(',')
    
    const notionCategory = notionPost.category?.[0] || ''
    const supabaseCategory = supabasePost.category || ''

    const notionStatus = notionPost.status?.includes('Public') ? 'published' : 'draft'
    const supabaseStatus = supabasePost.status

    return (
      notionTags !== supabaseTags ||
      notionCategory !== supabaseCategory ||
      notionStatus !== supabaseStatus
    )
  }

  // Utility methods for conflict detection
  detectConflicts(notionPosts: TPost[], supabasePosts: SupabasePost[]): SyncConflict[] {
    const conflicts: SyncConflict[] = []
    const supabaseMap = new Map<string, SupabasePost>()
    
    // Create lookup map for Supabase posts
    supabasePosts.forEach(post => {
      supabaseMap.set(post.notion_id, post)
    })

    // Find conflicts
    notionPosts.forEach(notionPost => {
      const supabasePost = supabaseMap.get(notionPost.id)
      if (supabasePost) {
        const analysis = this.analyzeConflict(notionPost, supabasePost)
        if (analysis.hasConflict) {
          conflicts.push({
            notionPost,
            supabasePost,
            conflictType: analysis.conflictTypes[0] || 'content',
            resolution: analysis.recommendedResolution
          })
        }
      }
    })

    return conflicts
  }

  generateConflictReport(conflicts: SyncConflict[]): string {
    if (conflicts.length === 0) {
      return 'No conflicts detected.'
    }

    let report = `Conflict Report (${conflicts.length} conflicts detected)\n`
    report += '=' .repeat(50) + '\n\n'

    conflicts.forEach((conflict, index) => {
      const analysis = this.analyzeConflict(conflict.notionPost, conflict.supabasePost)
      
      report += `Conflict #${index + 1}: ${conflict.notionPost.title}\n`
      report += `- Type: ${conflict.conflictType}\n`
      report += `- Confidence: ${(analysis.confidence * 100).toFixed(0)}%\n`
      report += `- Recommended: ${analysis.recommendedResolution}\n`
      report += `- Reason: ${analysis.reason}\n`
      report += `- Notion ID: ${conflict.notionPost.id}\n`
      report += `- Supabase ID: ${conflict.supabasePost.id}\n\n`
    })

    return report
  }
}

export const conflictResolver = ConflictResolver.getInstance()
export default conflictResolver