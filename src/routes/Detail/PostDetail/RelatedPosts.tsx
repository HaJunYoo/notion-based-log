import styled from "@emotion/styled"
import Link from "next/link"
import React from "react"
import { CONFIG } from "site.config"
import { formatDate } from "src/libs/utils"
import { TPost } from "src/types"

type Props = {
  currentPost: TPost
  allPosts: TPost[]
}

const RelatedPosts: React.FC<Props> = ({ currentPost, allPosts }) => {
  // 제목 유사도 계산 함수
  const calculateTitleSimilarity = (title1: string, title2: string): number => {
    const words1 = title1.toLowerCase().split(/\s+/)
    const words2 = title2.toLowerCase().split(/\s+/)
    const commonWords = words1.filter(word => words2.includes(word))
    const maxLength = Math.max(words1.length, words2.length)
    return maxLength > 0 ? commonWords.length / maxLength : 0
  }

  // 시간 근접성 계산 함수 (30일 이내면 보너스 점수)
  const calculateTimeProximity = (postDate: string, currentPostDate: string): number => {
    const post = new Date(postDate)
    const current = new Date(currentPostDate)
    const daysDiff = Math.abs((post.getTime() - current.getTime()) / (1000 * 60 * 60 * 24))
    return daysDiff <= 30 ? Math.max(0, 1 - daysDiff / 30) : 0
  }

  const getRelatedPosts = () => {
    const filteredByIdAndStatus = allPosts
      .filter(post => post.id !== currentPost.id)
      .filter(post => post.status?.[0] === "Public")

    const relatedPosts = filteredByIdAndStatus
      .map(post => {
        let score = 0

        // 1. 같은 카테고리면 높은 점수
        if (post.category?.[0] && currentPost.category?.[0] &&
            post.category[0] === currentPost.category[0]) {
          score += 3
        }

        // 2. 공통 태그 개수에 따라 점수 부여
        const commonTags = post.tags?.filter(tag =>
          currentPost.tags?.includes(tag)
        ).length || 0
        score += commonTags * 2

        // 3. 제목 유사도 점수 (최대 3점)
        const titleSimilarity = calculateTitleSimilarity(
          post.title || '',
          currentPost.title || ''
        )
        score += titleSimilarity * 3

        // 4. 시간 근접성 점수 (최대 1점)
        const currentPostDate = currentPost.date?.start_date || currentPost.createdTime
        const postDate = post.date?.start_date || post.createdTime
        if (currentPostDate && postDate) {
          score += calculateTimeProximity(postDate, currentPostDate)
        }

        return { ...post, score }
      })
      .sort((a, b) => b.score - a.score)

    // 관련 글이 있으면 상위 5개 반환
    const highScorePosts = relatedPosts.filter(post => post.score > 0).slice(0, 5)
    
    // 관련 글이 부족하면 최신 글로 보완
    if (highScorePosts.length < 5) {
      const recentPosts = relatedPosts
        .filter(post => !highScorePosts.some(hp => hp.id === post.id))
        .sort((a, b) => {
          const dateA = new Date(a.date?.start_date || a.createdTime || 0)
          const dateB = new Date(b.date?.start_date || b.createdTime || 0)
          return dateB.getTime() - dateA.getTime()
        })
        .slice(0, 5 - highScorePosts.length)

      return [...highScorePosts, ...recentPosts].slice(0, 5)
    }

    return highScorePosts
  }

  const relatedPosts = getRelatedPosts()

  if (relatedPosts.length === 0) return null

  return (
    <StyledWrapper>
      <h4>Related Posts</h4>
      <div className="posts-grid">
        {relatedPosts.map(post => (
          <Link key={post.id} href={`/${post.slug}`} className="post-item">
            <article>
              <h6>{post.title}</h6>
              <div className="meta">
                <span className="date">
                  {formatDate(
                    post?.date?.start_date || post.createdTime,
                    CONFIG.lang
                  )}
                </span>
                {post.category?.[0] && (
                  <span className="category">{post.category[0]}</span>
                )}
              </div>
            </article>
          </Link>
        ))}
      </div>
    </StyledWrapper>
  )
}

export default RelatedPosts

const StyledWrapper = styled.section`
  margin-top: 2.5rem;
  padding: 1.5rem;
  border-radius: 1rem;
  background-color: ${({ theme }) =>
    theme.scheme === "light" ? "#f8fafc" : theme.colors.gray5};
  border: 1px solid ${({ theme }) => 
    theme.scheme === "light" ? "#e2e8f0" : theme.colors.gray6};

  h4 {
    margin-bottom: 0.75rem;
    font-size: 0.875rem;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.gray12};
    display: flex;
    align-items: center;
    gap: 0.375rem;
    
    &::before {
      content: "📝";
      font-size: 0.75rem;
    }
  }

  .posts-grid {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .post-item {
    display: block;
    text-decoration: none;
    color: inherit;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

    &:hover {
      transform: translateY(-2px);
      
      article {
        background-color: ${({ theme }) =>
          theme.scheme === "light" ? "white" : theme.colors.gray4};
        box-shadow: 0 4px 12px -4px rgba(0, 0, 0, 0.12),
                    0 2px 6px -2px rgba(0, 0, 0, 0.08);
        border-color: ${({ theme }) =>
          theme.scheme === "light" ? "#cbd5e1" : theme.colors.gray7};
      }
    }

    article {
      padding: 0.75rem 1rem;
      border-radius: 0.75rem;
      background-color: ${({ theme }) =>
        theme.scheme === "light" ? "white" : theme.colors.gray4};
      border: 1px solid ${({ theme }) =>
        theme.scheme === "light" ? "#e2e8f0" : theme.colors.gray6};
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;

      &::before {
        content: "";
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 3px;
        background: linear-gradient(135deg, #6366f1, #8b5cf6);
        border-radius: 0 0.25rem 0.25rem 0;
      }

      h6 {
        margin-bottom: 0.125rem;
        font-size: 0.75rem;
        font-weight: 500;
        line-height: 1.2;
        color: ${({ theme }) => theme.colors.gray12};
        display: -webkit-box;
        -webkit-line-clamp: 1;
        -webkit-box-orient: vertical;
        overflow: hidden;
        
        @media (max-width: 768px) {
          font-size: 0.6875rem;
          line-height: 1.3;
          -webkit-line-clamp: 2;
        }
      }

      .meta {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.5625rem;

        .date {
          color: ${({ theme }) => theme.colors.gray10};
          font-weight: 500;
        }

        .category {
          padding: 0.0625rem 0.1875rem;
          background: ${({ theme }) => 
            theme.scheme === "light" ? "#64748b" : theme.colors.gray7};
          color: ${({ theme }) => 
            theme.scheme === "light" ? "white" : theme.colors.gray12};
          border-radius: 0.125rem;
          font-weight: 500;
          font-size: 0.5rem;
          border: 1px solid ${({ theme }) => 
            theme.scheme === "light" ? "#475569" : theme.colors.gray6};
        }
      }
    }
  }
`
