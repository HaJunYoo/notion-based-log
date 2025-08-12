import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { TPost, PostDetail } from 'src/types'
import { ServiceResponse } from 'src/apis/hybrid'
import { postService } from 'src/apis/hybrid'
import { queryKey } from 'src/constants/queryKey'

export interface UseHybridPostQueryOptions {
  enableFallback?: boolean
  enabled?: boolean
  staleTime?: number
  gcTime?: number
  retry?: boolean | number | ((failureCount: number, error: any) => boolean)
  retryDelay?: number | ((attemptIndex: number) => number)
}

export interface UseHybridPostDetailQueryOptions {
  enableFallback?: boolean
  enabled?: boolean
  staleTime?: number
  gcTime?: number
  retry?: boolean | number | ((failureCount: number, error: any) => boolean)
  retryDelay?: number | ((attemptIndex: number) => number)
}

export const useHybridPostQuery = (
  postId: string, 
  options: UseHybridPostQueryOptions = {}
) => {
  const { 
    enableFallback = true, 
    enabled = !!postId,
    staleTime = 5 * 60 * 1000,
    gcTime = 10 * 60 * 1000,
    retry = (failureCount: number, error: any) => {
      if (failureCount >= 3) return false
      return error?.message?.includes('network') || error?.message?.includes('timeout')
    },
    retryDelay = (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
  } = options

  const queryConfig = {
    queryKey: [...queryKey.post(postId), 'hybrid'],
    queryFn: () => postService.getPost(postId),
    enabled,
    staleTime,
    gcTime,
    retry,
    retryDelay,
  }

  return useQuery<ServiceResponse<TPost>>(queryConfig)
}

export const useHybridPostDetailQuery = (
  slug: string, 
  options: UseHybridPostDetailQueryOptions = {}
) => {
  const { 
    enableFallback = true,
    enabled = !!slug,
    staleTime = 10 * 60 * 1000,
    gcTime = 20 * 60 * 1000,
    retry = (failureCount: number, error: any) => {
      if (failureCount >= 2) return false // Less retries for detailed posts
      return error?.message?.includes('network') || error?.message?.includes('timeout')
    },
    retryDelay = (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
  } = options

  const queryConfig = {
    queryKey: [...queryKey.post(slug), 'detail', 'hybrid'],
    queryFn: () => postService.getPostDetail(slug),
    enabled,
    staleTime,
    gcTime,
    retry,
    retryDelay,
  }

  return useQuery<ServiceResponse<PostDetail>>(queryConfig)
}

export default useHybridPostQuery