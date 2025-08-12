import { 
  createServiceError,
  isRetryableError,
  getRetryDelay,
  shouldFallback,
  HybridServiceError,
  HybridServiceUnavailableError,
  HybridDataNotFoundError,
  HybridAuthenticationError,
  HybridRateLimitError
} from '../errorHandler'

describe('Error Handler', () => {
  describe('createServiceError', () => {
    it('should create HybridDataNotFoundError for Supabase 404', () => {
      const error = { code: 'PGRST301', details: 'Resource not found' }
      const result = createServiceError(error, 'supabase')
      
      expect(result).toBeInstanceOf(HybridDataNotFoundError)
      expect(result.source).toBe('supabase')
      expect(result.retryable).toBe(false)
    })

    it('should create HybridAuthenticationError for Supabase 401', () => {
      const error = { code: 'PGRST401', message: 'Unauthorized' }
      const result = createServiceError(error, 'supabase')
      
      expect(result).toBeInstanceOf(HybridAuthenticationError)
      expect(result.source).toBe('supabase')
      expect(result.retryable).toBe(false)
    })

    it('should create HybridRateLimitError for 429 status', () => {
      const error = { 
        status: 429, 
        message: 'Too many requests',
        headers: { 'retry-after': '60' }
      }
      const result = createServiceError(error, 'notion') as HybridRateLimitError
      
      expect(result).toBeInstanceOf(HybridRateLimitError)
      expect(result.source).toBe('notion')
      expect(result.retryable).toBe(true)
      expect(result.retryAfter).toBe(60000)
    })

    it('should create HybridServiceUnavailableError for network errors', () => {
      const error = { 
        cause: { code: 'UND_ERR_SOCKET' },
        message: 'Connection failed'
      }
      const result = createServiceError(error, 'supabase')
      
      expect(result).toBeInstanceOf(HybridServiceUnavailableError)
      expect(result.source).toBe('supabase')
      expect(result.retryable).toBe(true)
    })

    it('should create generic HybridServiceError for unknown errors', () => {
      const error = new Error('Unknown error')
      const result = createServiceError(error, 'notion')
      
      expect(result).toBeInstanceOf(HybridServiceError)
      expect(result.source).toBe('notion')
      expect(result.retryable).toBe(true)
      expect(result.message).toBe('Unknown error')
    })
  })

  describe('isRetryableError', () => {
    it('should return false for authentication errors', () => {
      const error = new HybridAuthenticationError('supabase')
      expect(isRetryableError(error)).toBe(false)
    })

    it('should return true for service unavailable errors', () => {
      const error = new HybridServiceUnavailableError('notion')
      expect(isRetryableError(error)).toBe(true)
    })

    it('should return true for network errors', () => {
      const error = { message: 'fetch failed' }
      expect(isRetryableError(error)).toBe(true)
    })

    it('should return false for 404 errors', () => {
      const error = { status: 404 }
      expect(isRetryableError(error)).toBe(false)
    })

    it('should return true for 5xx errors', () => {
      const error = { status: 500 }
      expect(isRetryableError(error)).toBe(true)
    })
  })

  describe('getRetryDelay', () => {
    it('should calculate exponential backoff delay', () => {
      const delay1 = getRetryDelay(1, 1000)
      const delay2 = getRetryDelay(2, 1000)
      const delay3 = getRetryDelay(3, 1000)
      
      expect(delay1).toBeGreaterThan(1000)
      expect(delay1).toBeLessThan(1200) // Including jitter
      expect(delay2).toBeGreaterThan(2000)
      expect(delay3).toBeGreaterThan(4000)
    })

    it('should respect max delay', () => {
      const delay = getRetryDelay(10, 1000, 5000)
      expect(delay).toBeLessThanOrEqual(5000)
    })

    it('should use retry-after for rate limit errors', () => {
      const rateLimitError = new HybridRateLimitError('notion', 3000)
      const delay = getRetryDelay(1, 1000, 10000, rateLimitError)
      expect(delay).toBe(3000)
    })
  })

  describe('shouldFallback', () => {
    it('should return false if fallback is disabled', () => {
      const error = new HybridServiceUnavailableError('supabase')
      const result = shouldFallback(error, false)
      expect(result).toBe(false)
    })

    it('should return true for service unavailable errors', () => {
      const error = new HybridServiceUnavailableError('supabase')
      const result = shouldFallback(error, true, { onUnavailable: true })
      expect(result).toBe(true)
    })

    it('should return false for authentication errors', () => {
      const error = new HybridAuthenticationError('supabase')
      const result = shouldFallback(error, true)
      expect(result).toBe(false)
    })

    it('should return true for data not found errors', () => {
      const error = new HybridDataNotFoundError('supabase', 'post-id')
      const result = shouldFallback(error, true)
      expect(result).toBe(true)
    })

    it('should return true for retryable errors when onError condition is met', () => {
      const error = new HybridServiceError({
        message: 'Server error',
        source: 'supabase',
        retryable: true
      })
      const result = shouldFallback(error, true, { onError: true })
      expect(result).toBe(true)
    })
  })
})