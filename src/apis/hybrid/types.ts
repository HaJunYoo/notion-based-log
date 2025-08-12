import { TPost, TPosts } from 'src/types'

export type DataSource = 'supabase' | 'notion'

export interface ServiceResponse<T = any> {
  data: T
  source: DataSource
  error?: string
  fallback?: boolean
}

export interface ServiceError {
  message: string
  source: DataSource
  originalError?: any
  retryable?: boolean
}

export interface HybridServiceConfig {
  enableSupabase: boolean
  enableNotion: boolean
  fallbackToNotion: boolean
  retryAttempts: number
  retryDelay: number
  cacheTimeout: number
}

export interface DataServiceInterface {
  getPosts(): Promise<ServiceResponse<TPosts>>
  getPost(id: string): Promise<ServiceResponse<TPost>>
  createPost?(post: Partial<TPost>): Promise<ServiceResponse<TPost>>
  updatePost?(id: string, post: Partial<TPost>): Promise<ServiceResponse<TPost>>
  deletePost?(id: string): Promise<ServiceResponse<boolean>>
  healthCheck(): Promise<boolean>
}

export interface CacheEntry<T> {
  data: T
  timestamp: number
  source: DataSource
  ttl: number
}

export interface FallbackStrategy {
  primarySource: DataSource
  fallbackSource: DataSource
  conditions: {
    onError: boolean
    onTimeout: boolean
    onUnavailable: boolean
  }
}