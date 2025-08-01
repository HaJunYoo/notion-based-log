import useDropdown from "src/hooks/useDropdown"
import { useRouter } from "next/router"
import React from "react"
import { IoChevronDown } from "react-icons/io5"
import { DEFAULT_CATEGORY } from "src/constants"
import styled from "@emotion/styled"
import usePostsQuery from "src/hooks/usePostsQuery"
import { getMajorCategoriesFromPosts } from "src/libs/utils/category"

type Props = {}

const CategorySelect: React.FC<Props> = () => {
  const router = useRouter()
  const posts = usePostsQuery()
  const [dropdownRef, opened, handleToggle] = useDropdown()

  const currentCategory = `${router.query.category || ``}` || DEFAULT_CATEGORY
  const majorCategories = posts && posts.length > 0 ? getMajorCategoriesFromPosts(posts) : {}

  const handleOptionClick = (category: string) => {
    router.push({
      query: {
        ...router.query,
        category,
      },
    })
  }
  return (
    <StyledWrapper>
      <div ref={dropdownRef} className="wrapper" onClick={handleToggle}>
        {currentCategory === DEFAULT_CATEGORY ? 'All' : currentCategory} Posts <IoChevronDown />
      </div>
      {opened && (
        <div className="content">
          <div>
            <div
              className="item major-category"
              onClick={() => handleOptionClick(DEFAULT_CATEGORY)}
            >
              ALL ({posts?.length || 0})
            </div>
          </div>
          {Object.entries(majorCategories).map(([major, data]) => (
            <div key={major}>
              <div
                className="item major-category"
                onClick={() => handleOptionClick(major)}
              >
                {`${major} (${data.count})`}
              </div>
              {Object.entries(data.minorCategories).map(([minor, count]) => (
                <div
                  key={`${major}/${minor}`}
                  className="item minor-category"
                  onClick={() => handleOptionClick(`${major}/${minor}`)}
                >
                  {`  ${minor} (${count})`}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </StyledWrapper>
  )
}

export default CategorySelect

const StyledWrapper = styled.div`
  position: relative;
  flex: 1;
  min-width: 0;
  
  @media (max-width: 480px) {
    width: 100%;
  }
  
  > .wrapper {
    display: flex;
    margin-top: 0.5rem;
    margin-bottom: 0.5rem;
    gap: 0.25rem;
    align-items: center;
    font-size: 0.875rem;
    line-height: 1.25rem;
    font-weight: 700;
    cursor: pointer;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    @media (min-width: 768px) {
      font-size: 1.125rem;
      line-height: 1.5rem;
    }

    @media (max-width: 480px) {
      justify-content: center;
      text-align: center;
    }
  }
  
  > .content {
    position: absolute;
    z-index: 40;
    padding: 0.25rem;
    border-radius: 0.75rem;
    background-color: ${({ theme }) => theme.colors.gray2};
    color: ${({ theme }) => theme.colors.gray10};
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
      0 2px 4px -1px rgba(0, 0, 0, 0.06);
    max-width: 300px;
    min-width: 200px;
    
    @media (max-width: 480px) {
      left: 50%;
      transform: translateX(-50%);
      max-width: 90vw;
      min-width: 250px;
    }
    > div > .item {
      padding: 0.25rem;
      padding-left: 0.5rem;
      padding-right: 0.5rem;
      border-radius: 0.75rem;
      font-size: 0.875rem;
      line-height: 1.25rem;
      white-space: nowrap;
      cursor: pointer;

      :hover {
        background-color: ${({ theme }) => theme.colors.gray4};
      }
      
      &.major-category {
        font-weight: 600;
        font-size: 0.8rem;
        margin-bottom: 0.125rem;
      }
      
      &.minor-category {
        font-size: 0.8rem;
        color: ${({ theme }) => theme.colors.gray11};
        margin-left: 0.5rem;
      }
    }
  }
`
