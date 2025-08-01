import styled from "@emotion/styled"
import { useRouter } from "next/router"
import React, { useState } from "react"
import { Emoji } from "src/components/Emoji"
import { DEFAULT_CATEGORY } from "src/constants"
import usePostsQuery from "src/hooks/usePostsQuery"
import { getMajorCategoriesFromPosts } from "src/libs/utils/category"

type Props = {}

const CategoryList: React.FC<Props> = () => {
  const router = useRouter()
  const currentCategory = router.query.category || undefined
  const posts = usePostsQuery()
  const majorCategories = posts && posts.length > 0 ? getMajorCategoriesFromPosts(posts) : {}
  // 기본적으로 모든 카테고리는 펼쳐진 상태로 시작
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(posts && posts.length > 0 ? Object.keys(getMajorCategoriesFromPosts(posts)) : [])
  )

  const handleClickCategory = (value: any) => {
    // delete
    if (currentCategory === value) {
      router.push({
        query: {
          ...router.query,
          category: undefined,
          tag: undefined, // 카테고리 해제 시 태그도 제거
        },
      })
    }
    // add
    else {
      router.push({
        query: {
          ...router.query,
          category: value,
          tag: undefined, // 카테고리 선택 시 태그 필터링 제거
        },
      })
    }
  }

  const toggleCategory = (majorCategory: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(majorCategory)) {
      newExpanded.delete(majorCategory)
    } else {
      newExpanded.add(majorCategory)
    }
    setExpandedCategories(newExpanded)
  }

  return (
    <StyledWrapper>
      <div className="top">
        <Emoji>📂</Emoji> Categories
      </div>
      <div className="list">
        {/* All 카테고리 먼저 표시 */}
        <a
          data-active={currentCategory === DEFAULT_CATEGORY || !currentCategory}
          onClick={() => handleClickCategory(DEFAULT_CATEGORY)}
          className="all-category"
        >
          📂 All <span style={{ color: 'var(--colors-gray9)' }}>({posts?.length || 0})</span>
        </a>

        {/* 계층 구조로 카테고리 표시 */}
        {Object.entries(majorCategories).map(([major, data]) => {
          const isExpanded = expandedCategories.has(major)
          const hasMinorCategories = Object.keys(data.minorCategories).length > 0

          return (
            <div key={major} className="category-group">
              {/* 대분류 */}
              <a
                data-active={currentCategory === major}
                onClick={() => handleClickCategory(major)}
                className="major-category"
              >
                {hasMinorCategories ? (
                  <span
                    className={`toggle-icon ${!isExpanded ? 'collapsed' : ''}`}
                    onClick={(e) => toggleCategory(major, e)}
                    title={isExpanded ? '접기' : '펼쳐서 하위 카테고리 보기'}
                  >
                    {isExpanded ? '📂' : '📁'}
                  </span>
                ) : (
                  '📁'
                )} {major} <span style={{ color: 'var(--colors-gray9)', marginLeft: '3px' }}>({data.count})</span>
              </a>

              {/* 소분류들 - 토글 상태에 따라 표시 */}
              {isExpanded && Object.entries(data.minorCategories).map(([minor, count]) => (
                <a
                  key={`${major}/${minor}`}
                  data-active={currentCategory === `${major}/${minor}`}
                  onClick={() => handleClickCategory(`${major}/${minor}`)}
                  className="minor-category"
                >
                  {minor} <span style={{ color: 'var(--colors-gray10)' }}>({count})</span>
                </a>
              ))}
            </div>
          )
        })}
      </div>
    </StyledWrapper>
  )
}

export default CategoryList

const StyledWrapper = styled.div`
  width: 100%;
  max-width: 520px;

  /* Hide categories on mobile and narrow screens */
  @media (max-width: 960px) {
    display: none !important;
  }

  @media (min-width: 1024px) {
    max-width: 460px;
  }

  .top {
    display: none;
    padding: 0.25rem;
    margin-bottom: 0.75rem;

    @media (min-width: 1024px) {
      display: block;
    }
  }

  .list {
    display: flex;
    margin-bottom: 1.5rem;
    gap: 0.25rem;
    overflow: scroll;

    scrollbar-width: none;
    -ms-overflow-style: none;
    ::-webkit-scrollbar {
      width: 0;
      height: 0;
    }

    @media (min-width: 1024px) {
      display: block;
    }

    .category-group {
      @media (min-width: 1024px) {
        margin-bottom: 0.75rem;
        padding-bottom: 0.5rem;

        &:last-child {
          margin-bottom: 0;
        }
      }
    }

    a {
      display: block;
      padding: 0.25rem;
      padding-left: 1rem;
      padding-right: 1rem;
      margin-top: 0.25rem;
      margin-bottom: 0.25rem;
      border-radius: 0.75rem;
      font-size: 0.875rem;
      line-height: 1.25rem;
      color: ${({ theme }) => theme.colors.gray10};
      flex-shrink: 0;
      cursor: pointer;

      :hover {
        background-color: ${({ theme }) => theme.colors.gray4};
      }
      &[data-active="true"] {
        color: ${({ theme }) => theme.colors.gray12};
        background-color: ${({ theme }) => theme.colors.gray4};

        :hover {
          background-color: ${({ theme }) => theme.colors.gray4};
        }
      }

      &.all-category {
        font-weight: 600;
        margin-bottom: 0.5rem;

        @media (min-width: 1024px) {
          border-bottom: 1px solid ${({ theme }) => theme.colors.gray5};
          padding-bottom: 0.5rem;
        }
      }

      &.major-category {
        font-weight: 600;
        font-size: 0.825rem;
        display: flex;
        align-items: center;
        border-left: 3px solid transparent;
        padding-left: 1rem;
        padding-right: 1rem;

        &:hover {
          background-color: ${({ theme }) => theme.colors.blue2};
        }

        @media (min-width: 1024px) {
          margin-top: 0.5rem;
          margin-bottom: 0.25rem;
        }

        .toggle-icon {
          margin-right: 0.5rem;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          position: relative;

          :hover {
            opacity: 0.7;
            transform: scale(1.1);
          }

          &.collapsed:after {
            content: "";
            position: absolute;
            right: -2px;
            top: -2px;
            width: 4px;
            height: 4px;
            background: ${({ theme }) => theme.colors.blue9};
            border-radius: 50%;
            opacity: 0.7;
          }
        }
      }

      &.minor-category {
        font-size: 0.775rem;
        color: ${({ theme }) => theme.colors.gray11};
        position: relative;
        border-left: 2px solid transparent;

        &:hover {
          background-color: ${({ theme }) => theme.colors.blue2};
        }

        @media (min-width: 1024px) {
          margin-left: 1.5rem;
          padding-left: 2rem;
          margin-top: 0.125rem;
          margin-bottom: 0.125rem;
        }

        &::before {
          content: "•";
          margin-right: 0.5rem;
          color: ${({ theme }) => theme.colors.gray7};

          @media (min-width: 1024px) {
            position: absolute;
            left: 1.25rem;
            margin-right: 0;
          }
        }

        &[data-active="true"] {
          color: ${({ theme }) => theme.colors.gray12};
          background-color: ${({ theme }) => theme.colors.blue3};
          border-left-color: ${({ theme }) => theme.colors.blue8};
          font-weight: 500;
        }
      }
    }
  }
`
