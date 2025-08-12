import { ServiceError, DataSource } from './types'

export class HybridServiceError extends Error {
  public readonly source: DataSource
  public readonly originalError?: any
  public readonly retryable: boolean
  public readonly timestamp: number

  constructor(serviceError: ServiceError) {
    super(serviceError.message)
    this.name = 'HybridServiceError'
    this.source = serviceError.source
    this.originalError = serviceError.originalError
    this.retryable = serviceError.retryable ?? true
    this.timestamp = Date.now()
  }
}

export class HybridServiceUnavailableError extends HybridServiceError {
  constructor(source: DataSource, originalError?: any) {
    super({
      message: `${source} service is currently unavailable`,
      source,
      originalError,
      retryable: true
    })
    this.name = 'HybridServiceUnavailableError'
  }
}

export class HybridDataNotFoundError extends HybridServiceError {
  public readonly identifier: string

  constructor(source: DataSource, identifier: string, originalError?: any) {
    super({
      message: `Data not found in ${source}: ${identifier}`,
      source,
      originalError,
      retryable: false
    })
    this.name = 'HybridDataNotFoundError'
    this.identifier = identifier
  }
}

export class HybridAuthenticationError extends HybridServiceError {
  constructor(source: DataSource, originalError?: any) {
    super({
      message: `Authentication failed for ${source}`,
      source,
      originalError,
      retryable: false
    })
    this.name = 'HybridAuthenticationError'
  }
}

export class HybridRateLimitError extends HybridServiceError {
  public readonly retryAfter?: number

  constructor(source: DataSource, retryAfter?: number, originalError?: any) {
    super({
      message: `Rate limit exceeded for ${source}${retryAfter ? `, retry after ${retryAfter}ms` : ''}`,
      source,
      originalError,
      retryable: true
    })
    this.name = 'HybridRateLimitError'
    this.retryAfter = retryAfter
  }
}

export const createServiceError = (error: any, source: DataSource): HybridServiceError => {
  // Handle Supabase errors
  if (error?.code || error?.details) {
    if (error.code === 'PGRST301') {
      return new HybridDataNotFoundError(source, error.details || 'unknown', error)
    }
    if (error.code === 'PGRST401') {
      return new HybridAuthenticationError(source, error)
    }
  }

  // Handle Notion API errors
  if (error?.message?.includes('Notion API')) {
    if (error.status === 404) {
      return new HybridDataNotFoundError(source, error.message, error)
    }
    if (error.status === 401 || error.status === 403) {
      return new HybridAuthenticationError(source, error)
    }
    if (error.status === 429) {
      const retryAfter = error.headers?.['retry-after'] 
        ? parseInt(error.headers['retry-after']) * 1000 
        : undefined
      return new HybridRateLimitError(source, retryAfter, error)
    }
  }

  // Handle network errors
  if (error?.cause?.code === 'UND_ERR_SOCKET' ||
      error?.message?.includes('fetch failed') ||
      error?.message?.includes('other side closed') ||
      error?.message?.includes('network') ||
      error?.message?.includes('timeout')) {
    return new HybridServiceUnavailableError(source, error)
  }

  // Handle HTTP status errors
  if (error?.status) {
    if (error.status === 404) {
      return new HybridDataNotFoundError(source, 'Resource not found', error)
    }
    if (error.status === 401 || error.status === 403) {
      return new HybridAuthenticationError(source, error)
    }
    if (error.status === 429) {
      return new HybridRateLimitError(source, undefined, error)
    }
    if (error.status >= 500) {
      return new HybridServiceUnavailableError(source, error)
    }
  }

  // Default error
  return new HybridServiceError({
    message: error?.message || 'Unknown error occurred',
    source,
    originalError: error,
    retryable: true
  })
}

export const isRetryableError = (error: any): boolean => {
  if (error instanceof HybridServiceError) {
    return error.retryable
  }

  // Network errors are usually retryable
  if (error?.cause?.code === 'UND_ERR_SOCKET' ||
      error?.message?.includes('fetch failed') ||
      error?.message?.includes('other side closed') ||
      error?.message?.includes('network') ||
      error?.message?.includes('timeout')) {
    return true
  }

  // Authentication errors are not retryable
  if (error?.status === 401 || error?.status === 403) {
    return false
  }

  // Not found errors are not retryable
  if (error?.status === 404) {
    return false
  }

  // Rate limit errors are retryable after delay
  if (error?.status === 429) {
    return true
  }

  // Server errors (5xx) are retryable
  if (error?.status >= 500 && error?.status < 600) {
    return true
  }

  return true // Default to retryable for unknown errors
}

export const getRetryDelay = (
  attempt: number, 
  baseDelay: number = 1000, 
  maxDelay: number = 30000,
  error?: any
): number => {
  // For rate limit errors, use the retry-after header if available
  if (error instanceof HybridRateLimitError && error.retryAfter) {
    return Math.min(error.retryAfter, maxDelay)
  }

  // Exponential backoff with jitter
  const exponentialDelay = Math.pow(2, attempt - 1) * baseDelay
  const jitter = Math.random() * 0.1 * exponentialDelay
  return Math.min(exponentialDelay + jitter, maxDelay)
}

export const shouldFallback = (
  error: any, 
  fallbackEnabled: boolean = true,
  conditions: {
    onError?: boolean
    onTimeout?: boolean
    onUnavailable?: boolean
  } = { onError: true, onTimeout: true, onUnavailable: true }
): boolean => {
  if (!fallbackEnabled) return false

  if (error instanceof HybridServiceUnavailableError && conditions.onUnavailable) {
    return true
  }

  if (error instanceof HybridAuthenticationError) {
    return false // Don't fallback on auth errors
  }

  if (error instanceof HybridDataNotFoundError) {
    return true // Fallback might have the data
  }

  if (conditions.onError && isRetryableError(error)) {
    return true
  }

  return false
}