import { useQuery } from '@tanstack/react-query'
import { TPosts } from 'src/types'
import { ServiceResponse } from 'src/apis/hybrid'
import { postService } from 'src/apis/hybrid'
import { queryKey } from 'src/constants/queryKey'

export interface UseHybridPostsQueryOptions {
  enableFallback?: boolean
  enabled?: boolean
  staleTime?: number
  gcTime?: number
  retry?: boolean | number | ((failureCount: number, error: any) => boolean)
  retryDelay?: number | ((attemptIndex: number) => number)
}

const useHybridPostsQuery = (options: UseHybridPostsQueryOptions = {}) => {
  const { 
    enableFallback = true,
    enabled = true,
    staleTime = 5 * 60 * 1000,
    gcTime = 10 * 60 * 1000,
    retry = (failureCount: number, error: any) => {
      // Retry network errors but not application errors
      if (failureCount >= 3) return false
      return error?.message?.includes('network') || error?.message?.includes('timeout')
    },
    retryDelay = (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
  } = options

  const queryConfig = {
    queryKey: [...queryKey.posts(), 'hybrid'],
    queryFn: () => postService.getPosts(),
    enabled,
    staleTime,
    gcTime,
    retry,
    retryDelay,
  }

  return useQuery<ServiceResponse<TPosts>>(queryConfig)
}

export default useHybridPostsQuery