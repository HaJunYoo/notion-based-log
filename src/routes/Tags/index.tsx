import { useState } from "react"
import styled from "@emotion/styled"
import { useRouter } from "next/router"
import Link from "next/link"
import usePostsQuery from "src/hooks/usePostsQuery"
import { useTagsQuery } from "src/hooks/useTagsQuery"

const Tags: React.FC = () => {
  const posts = usePostsQuery()
  const tagsData = useTagsQuery()
  const [searchTerm, setSearchTerm] = useState("")
  
  if (!posts || posts.length === 0) return <div>Loading...</div>

  // 시스템 태그 제외 및 검색어로 태그 필터링
  const excludedTags = ['About', 'Pinned']
  const filteredTags = Object.entries(tagsData)
    .filter(([tag]) => !excludedTags.includes(tag)) // 시스템 태그 제외
    .filter(([tag]) => tag.toLowerCase().includes(searchTerm.toLowerCase())) // 검색어 필터링
    .sort(([, countA], [, countB]) => countB - countA) // 포스트 수 기준 내림차순 정렬

  return (
    <StyledWrapper>
      <div className="header">
        <h1>Tags</h1>
        <p>Browse posts organized by tags</p>
        
        <div className="search-container">
          <input
            type="text"
            placeholder="Search tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>
      
      <div className="tags-container">
        <div className="tags-grid">
          {filteredTags.map(([tag, count]) => (
            <Link 
              key={tag}
              href={`/?tag=${encodeURIComponent(tag)}`}
              className="tag-card"
            >
              <div className="tag-content">
                <span className="tag-name">{tag}</span>
                <span className="tag-count">({count})</span>
              </div>
            </Link>
          ))}
        </div>
        
        {filteredTags.length === 0 && (
          <div className="no-results">
            <p>No tags found matching &ldquo;{searchTerm}&rdquo;</p>
          </div>
        )}
      </div>
      
      <div className="stats">
        <p>Total: {filteredTags.length} tags, {posts.length} posts</p>
      </div>
    </StyledWrapper>
  )
}

export default Tags

const StyledWrapper = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem 1rem;

  .header {
    margin-bottom: 2rem;
    text-align: center;
    
    h1 {
      font-size: 1.5rem;
      font-weight: 700;
      margin-bottom: 0.25rem;
      color: ${({ theme }) => theme.colors.gray12};
      
      @media (min-width: 768px) {
        font-size: 1.75rem;
      }
    }
    
    p {
      color: ${({ theme }) => theme.colors.gray11};
      font-size: 0.875rem;
      margin-bottom: 1.5rem;
      
      @media (min-width: 768px) {
        font-size: 1rem;
        margin-bottom: 2rem;
      }
    }
  }

  .search-container {
    max-width: 350px;
    margin: 0 auto;
    
    .search-input {
      width: 100%;
      padding: 0.5rem 0.75rem;
      border: 1px solid ${({ theme }) => theme.colors.gray6};
      border-radius: 6px;
      background: ${({ theme }) => theme.colors.gray2};
      color: ${({ theme }) => theme.colors.gray12};
      font-size: 0.875rem;
      
      @media (min-width: 768px) {
        padding: 0.75rem 1rem;
        border-radius: 8px;
        font-size: 1rem;
      }
      
      &:focus {
        outline: none;
        border-color: ${({ theme }) => theme.colors.blue9};
        box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.blue3};
      }
      
      &::placeholder {
        color: ${({ theme }) => theme.colors.gray9};
      }
    }
  }

  .tags-container {
    margin-bottom: 3rem;
  }

  .tags-grid {
    display: grid;
    gap: 0.75rem;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    
    @media (max-width: 768px) {
      grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
      gap: 0.5rem;
    }
  }

  .tag-card {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.375rem;
    background: ${({ theme }) => theme.colors.gray2};
    border: 1px solid ${({ theme }) => theme.colors.gray6};
    border-radius: 8px;
    text-decoration: none;
    transition: all 0.2s ease;
    min-height: 40px;
    
    @media (max-width: 768px) {
      padding: 0.25rem;
      min-height: 35px;
      border-radius: 6px;
    }

    &:hover {
      border-color: ${({ theme }) => theme.colors.gray8};
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      background: ${({ theme }) => theme.colors.gray3};
    }
    
    .tag-content {
      text-align: center;
      
      .tag-name {
        display: block;
        font-size: 0.875rem;
        font-weight: 600;
        color: ${({ theme }) => theme.colors.gray12};
        margin-bottom: 0.125rem;
        word-break: break-word;
        
        @media (max-width: 768px) {
          font-size: 0.75rem;
        }
      }
      
      .tag-count {
        font-size: 0.7rem;
        color: ${({ theme }) => theme.colors.gray10};
        
        @media (max-width: 768px) {
          font-size: 0.625rem;
        }
      }
    }
  }

  .no-results {
    text-align: center;
    padding: 3rem 1rem;
    
    p {
      color: ${({ theme }) => theme.colors.gray10};
      font-size: 1.1rem;
    }
  }

  .stats {
    text-align: center;
    padding-top: 2rem;
    border-top: 1px solid ${({ theme }) => theme.colors.gray5};
    
    p {
      color: ${({ theme }) => theme.colors.gray10};
      font-size: 0.9rem;
    }
  }
`