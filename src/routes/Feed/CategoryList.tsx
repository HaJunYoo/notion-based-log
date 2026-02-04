import styled from "@emotion/styled"
import Link from "next/link"
import { useRouter } from "next/router"
import React, { useState, useEffect, useRef } from "react"
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

  // 빈 Set으로 시작 (hydration 안전)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const userInteractedRef = useRef(false)

  // 마운트 후 모든 카테고리 펼침 (사용자가 아직 상호작용하지 않은 경우에만)
  useEffect(() => {
    if (!userInteractedRef.current && posts && posts.length > 0) {
      const allMajorCategories = Object.keys(getMajorCategoriesFromPosts(posts))
      setExpandedCategories(new Set(allMajorCategories))
    }
  }, [])

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
    e.preventDefault()
    e.stopPropagation()
    userInteractedRef.current = true // 사용자 상호작용 표시
    setExpandedCategories(prev => {
      const newExpanded = new Set(prev)
      if (newExpanded.has(majorCategory)) {
        newExpanded.delete(majorCategory)
      } else {
        newExpanded.add(majorCategory)
      }
      return newExpanded
    })
  }

  return (
    <StyledWrapper>
      <div className="top">
        <Emoji>📂</Emoji> Categories
      </div>
      <div className="list">
        {/* All 카테고리 먼저 표시 */}
        <Link
          href="/"
          data-active={currentCategory === DEFAULT_CATEGORY || !currentCategory}
          onClick={(e) => {
            e.preventDefault()
            handleClickCategory(DEFAULT_CATEGORY)
          }}
          className="all-category"
        >
          All <CategoryCount>({posts?.length || 0})</CategoryCount>
        </Link>

        {/* 계층 구조로 카테고리 표시 */}
        {Object.entries(majorCategories).map(([major, data]) => {
          const isExpanded = expandedCategories.has(major)
          const hasMinorCategories = Object.keys(data.minorCategories).length > 0

          return (
            <div key={major} className="category-group">
              {/* 대분류 */}
              <Link
                href={`/?category=${encodeURIComponent(major)}`}
                data-active={currentCategory === major}
                onClick={(e) => {
                  e.preventDefault()
                  handleClickCategory(major)
                }}
                className="major-category"
              >
                <span className="category-content">
                  {major} <MajorCategoryCount>({data.count})</MajorCategoryCount>
                </span>
                {hasMinorCategories && (
                  <span
                    className={`toggle-icon ${isExpanded ? 'expanded' : ''}`}
                    onClick={(e) => toggleCategory(major, e)}
                    title={isExpanded ? '접기' : '펼쳐서 하위 카테고리 보기'}
                  >
                    ›
                  </span>
                )}
              </Link>

              {/* 소분류들 - 애니메이션과 함께 표시 */}
              {hasMinorCategories && (
                <div className={`minor-categories ${isExpanded ? 'expanded' : ''}`}>
                  {Object.entries(data.minorCategories).map(([minor, count]) => (
                    <Link
                      key={`${major}/${minor}`}
                      href={`/?category=${encodeURIComponent(`${major}/${minor}`)}`}
                      data-active={currentCategory === `${major}/${minor}`}
                      onClick={(e) => {
                        e.preventDefault()
                        handleClickCategory(`${major}/${minor}`)
                      }}
                      className="minor-category"
                    >
                      {minor} <MinorCategoryCount>({count})</MinorCategoryCount>
                    </Link>
                  ))}
                </div>
              )}
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
    padding: 0.5rem;
    margin-bottom: 0.75rem;
    color: ${({ theme }) => theme.colors.gray12};
    font-size: 0.9375rem;
    line-height: 1.375rem;
    font-weight: 400;

    @media (min-width: 1024px) {
      display: flex;
      align-items: center;
      gap: 0.375rem;
    }
  }

  .list {
    display: flex;
    margin-bottom: 1.5rem;
    gap: 0.375rem;
    overflow: scroll;

    scrollbar-width: none;
    -ms-overflow-style: none;
    ::-webkit-scrollbar {
      width: 0;
      height: 0;
    }

    @media (min-width: 1024px) {
      display: block;
      gap: 0;
    }

    .category-group {
      @media (min-width: 1024px) {
        margin-bottom: 0.25rem;

        &:last-child {
          margin-bottom: 0;
        }
      }
    }

    .minor-categories {
      max-height: 0;
      overflow: hidden;
      transition: max-height 0.25s ease-out, opacity 0.2s ease;
      opacity: 0;

      &.expanded {
        max-height: 500px;
        opacity: 1;
        transition: max-height 0.3s ease-in, opacity 0.2s ease;
      }
    }

    a {
      display: flex;
      align-items: center;
      padding: 0.5rem 0.75rem;
      margin: 0.125rem 0;
      border-radius: 0.375rem;
      font-size: 0.875rem;
      line-height: 1.25rem;
      color: ${({ theme }) => theme.colors.gray11};
      flex-shrink: 0;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.15s ease;
      border: 1px solid transparent;

      :hover {
        background-color: ${({ theme }) => theme.colors.gray2};
        color: ${({ theme }) => theme.colors.gray12};
      }

      &[data-active="true"] {
        color: ${({ theme }) => theme.colors.gray12};
        background-color: ${({ theme }) => theme.colors.gray3};
        border-color: ${({ theme }) => theme.colors.gray6};
        font-weight: 400;
        position: relative;

        &::after {
          content: '';
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 3px;
          height: 60%;
          background: ${({ theme }) => theme.colors.blue9};
          border-radius: 0 2px 2px 0;
        }
      }

      &.all-category {
        font-weight: 400;
        margin-bottom: 0.5rem;
        padding: 0.625rem 0.625rem;

        @media (min-width: 1024px) {
          border-bottom: 1px solid ${({ theme }) => theme.colors.gray4};
          margin-bottom: 0.75rem;
          padding-bottom: 0.5rem;
        }
      }

      &.major-category {
        font-weight: 400;
        font-size: 0.8125rem;
        padding: 0.4375rem 0.625rem;
        padding-right: 2.25rem;
        margin: 0.1875rem 0;
        justify-content: space-between;
        position: relative;

        @media (min-width: 1024px) {
          margin-top: 0.5rem;
          margin-bottom: 0.125rem;
        }

        .category-content {
          flex: 1;
        }

        .toggle-icon {
          position: absolute;
          right: 0.625rem;
          top: 50%;
          transform: translateY(-50%) rotate(0deg);
          cursor: pointer;
          font-size: 0.875rem;
          font-weight: 500;
          color: ${({ theme }) => theme.colors.gray10};
          transition: transform 0.2s ease, color 0.15s ease;
          width: 16px;
          height: 16px;
          display: inline-flex;
          justify-content: center;
          align-items: center;

          &.expanded {
            transform: translateY(-50%) rotate(90deg);
          }

          :hover {
            color: ${({ theme }) => theme.colors.gray12};
          }
        }
      }

      &.minor-category {
        font-size: 0.8125rem;
        color: ${({ theme }) => theme.colors.gray11};
        padding: 0.25rem 0.625rem;
        margin: 0.03125rem 0;

        :hover {
          background-color: ${({ theme }) => theme.colors.gray2};
          color: ${({ theme }) => theme.colors.gray12};
        }

        @media (min-width: 1024px) {
          margin-left: 0;
          padding-left: 1.75rem;
          position: relative;
        }

        &::before {
          content: "•";
          margin-right: 0.5rem;
          color: ${({ theme }) => theme.colors.gray10};

          @media (min-width: 1024px) {
            position: absolute;
            left: 1.125rem;
            margin-right: 0;
          }
        }

        &[data-active="true"] {
          color: ${({ theme }) => theme.colors.gray12};
          background-color: ${({ theme }) => theme.colors.gray3};
          border-color: ${({ theme }) => theme.colors.gray6};
          font-weight: 400;

          &::before {
            color: ${({ theme }) => theme.colors.gray11};
          }

          &::after {
            content: '';
            position: absolute;
            left: 0;
            top: 50%;
            transform: translateY(-50%);
            width: 3px;
            height: 60%;
            background: ${({ theme }) => theme.colors.blue9};
            border-radius: 0 2px 2px 0;
          }
        }
      }
    }
  }
`

// 카테고리 개수 표시용 styled components
const CategoryCount = styled.span`
  color: ${({ theme }) => theme.colors.gray10}; /* gray9 → gray10으로 더 밝게 */
  margin-left: 0.375rem;
  font-size: 0.8125rem;
  font-weight: 400;
`

const MajorCategoryCount = styled.span`
  color: ${({ theme }) => theme.colors.gray10}; /* 대분류 개수 */
  margin-left: 0.375rem;
  font-size: 0.75rem;
  font-weight: 400;
`

const MinorCategoryCount = styled.span`
  color: ${({ theme }) => theme.colors.gray10}; /* 소분류는 계층감을 위해 조금 더 어둡게 */
  margin-left: 0.375rem;
  font-size: 0.75rem;
  font-weight: 400;
`