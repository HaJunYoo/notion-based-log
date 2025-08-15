import { 
  DataServiceInterface, 
  ServiceResponse, 
  ServiceError, 
  DataSource,
  CacheEntry
} from './types'
import { HYBRID_SERVICE_CONFIG, DEFAULT_FALLBACK_STRATEGY } from './config'
import { 
  createServiceError, 
  isRetryableError, 
  getRetryDelay, 
  shouldFallback 
} from './errorHandler'

export abstract class BaseHybridService implements DataServiceInterface {
  protected config = HYBRID_SERVICE_CONFIG
  protected fallbackStrategy = DEFAULT_FALLBACK_STRATEGY
  private cache = new Map<string, CacheEntry<any>>()

  abstract getPosts(): Promise<ServiceResponse<any>>
  abstract getPost(id: string): Promise<ServiceResponse<any>>
  abstract healthCheck(): Promise<boolean>

  protected async executeWithFallback<T>(
    primaryOperation: () => Promise<ServiceResponse<T>>,
    fallbackOperation?: () => Promise<ServiceResponse<T>>,
    cacheKey?: string
  ): Promise<ServiceResponse<T>> {
    // Check cache first
    if (cacheKey) {
      const cached = this.getFromCache<T>(cacheKey)
      if (cached) {
        return {
          data: cached.data,
          source: cached.source,
          fallback: false
        }
      }
    }

    let primaryError: ServiceError | null = null

    // Try primary source
    try {
      const result = await this.withRetry(primaryOperation, this.config.retryAttempts)
      
      // Cache successful result
      if (cacheKey && result.data) {
        this.setCache(cacheKey, {
          data: result.data,
          timestamp: Date.now(),
          source: result.source,
          ttl: this.config.cacheTimeout
        })
      }

      return result
    } catch (error) {
      primaryError = createServiceError(error, this.fallbackStrategy.primarySource)
      console.warn(`Primary source (${this.fallbackStrategy.primarySource}) failed:`, primaryError.message)
    }

    // Try fallback if conditions are met
    if (fallbackOperation && shouldFallback(primaryError, this.config.fallbackToNotion, this.fallbackStrategy.conditions)) {
      try {
        console.info(`Falling back to ${this.fallbackStrategy.fallbackSource}`)
        const fallbackResult = await this.withRetry(fallbackOperation, this.config.retryAttempts)
        
        // Cache fallback result
        if (cacheKey && fallbackResult.data) {
          this.setCache(cacheKey, {
            data: fallbackResult.data,
            timestamp: Date.now(),
            source: fallbackResult.source,
            ttl: this.config.cacheTimeout
          })
        }

        return {
          ...fallbackResult,
          fallback: true
        }
      } catch (fallbackError) {
        const fallbackServiceError = createServiceError(fallbackError, this.fallbackStrategy.fallbackSource)
        console.error(`Fallback source (${this.fallbackStrategy.fallbackSource}) also failed:`, fallbackServiceError.message)
        
        // Throw combined error
        throw new Error(`Both primary and fallback sources failed. Primary: ${primaryError.message}, Fallback: ${fallbackServiceError.message}`)
      }
    }

    // If no fallback or fallback conditions not met, throw primary error
    throw primaryError
  }

  private async withRetry<T>(
    operation: () => Promise<T>,
    maxAttempts: number
  ): Promise<T> {
    let lastError: any

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error
        
        if (attempt === maxAttempts) {
          break
        }

        const delay = getRetryDelay(attempt, this.config.retryDelay, 30000, lastError)
        console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`)
        await this.sleep(delay)
      }
    }

    throw lastError
  }


  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private getFromCache<T>(key: string): CacheEntry<T> | null {
    const entry = this.cache.get(key)
    if (!entry) {
      return null
    }

    // Check if cache entry is still valid
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry as CacheEntry<T>
  }

  private setCache<T>(key: string, entry: CacheEntry<T>): void {
    this.cache.set(key, entry)
    
    // Clean up expired entries periodically
    if (this.cache.size > 100) {
      this.cleanupExpiredCache()
    }
  }

  private cleanupExpiredCache(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key)
      }
    }
  }

  protected clearCache(pattern?: string): void {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key)
        }
      }
    } else {
      this.cache.clear()
    }
  }
}