import styled from "@emotion/styled"
import Image from "next/image"
import Link from "next/link"
import { CONFIG } from "site.config"
import { formatDate } from "src/libs/utils"
import { parseCategoryHierarchy } from "src/libs/utils/category"
import Category from "../../../components/Category"
import Tag from "../../../components/Tag"
import { TPost } from "../../../types"

type Props = {
  data: TPost
  index?: number
}

const PostCard: React.FC<Props> = ({ data, index = 0 }) => {
  const categoryStr = (data.category && data.category?.[0]) || undefined
  const category = categoryStr ? parseCategoryHierarchy(categoryStr) : undefined

  return (
    <StyledWrapper href={`/${data.slug}`}>
      <article>
        {categoryStr && (
          <div className="category">
            <Category>{categoryStr}</Category>
            {category?.minor && (
              <div className="category-hierarchy">
                <span className="major">{category.major}</span>
                <span className="separator">/</span>
                <span className="minor">{category.minor}</span>
              </div>
            )}
          </div>
        )}
        <div data-thumb={!!data.thumbnail} data-category={!!categoryStr} className="content">
          <header className="top">
            <h3>{data.title}</h3>
            {data.thumbnail && (
              <div className="thumbnail">
                <Image
                  src={data.thumbnail}
                  fill
                  alt={`${data.title} - ${data.summary ? data.summary.slice(0, 100) : '블로그 포스트'} 썸네일`}
                  sizes="(max-width: 768px) 80px, (max-width: 1024px) 100px, 120px"
                  priority={index < 3}
                  css={{
                    objectFit: "cover",
                    transform: "scale(0.9)",
                    borderRadius: "0.5rem"
                  }}
                />
              </div>
            )}
          </header>
          <div className="date">
            <div className="content">
              {formatDate(
                data?.date?.start_date || data.createdTime,
                CONFIG.lang
              )}
            </div>
          </div>
          <div className="summary">
            <p>{data.summary}</p>
          </div>
          <div className="tags">
            {data.tags &&
              data.tags.map((tag: string, idx: number) => (
                <Tag key={idx}>{tag}</Tag>
              ))}
          </div>
        </div>
      </article>
    </StyledWrapper>
  )
}

export default PostCard

const StyledWrapper = styled(Link)`
  article {
    overflow: hidden;
    position: relative;
    margin-bottom: 1rem;
    border-radius: 1rem;
    background-color: ${({ theme }) =>
      theme.scheme === "light" ? "white" : theme.colors.gray4};
    transition-property: box-shadow;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    transition-duration: 300ms;

    @media (min-width: 768px) {
      margin-bottom: 1.25rem;
    }

    :hover {
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1),
        0 4px 6px -2px rgba(0, 0, 0, 0.05);
    }
    > .category {
      position: absolute;
      top: 0.75rem;
      left: 0.75rem;
      z-index: 10;

      @media (min-width: 768px) {
        top: 1rem;
        left: 1rem;
      }

      .category-hierarchy {
        display: none;
        margin-top: 0.125rem;
        font-size: 0.625rem;
        color: ${({ theme }) => theme.colors.gray9};

        @media (min-width: 768px) {
          margin-top: 0.25rem;
          font-size: 0.75rem;
        }

        .major {
          font-weight: 500;
        }

        .separator {
          margin: 0 0.125rem;

          @media (min-width: 768px) {
            margin: 0 0.25rem;
          }
        }

        .minor {
          font-weight: 400;
        }
      }
    }


    > .content {
      padding: 0.5rem;
      padding-left: 0.75rem;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;

      &[data-thumb="false"] {
        padding-top: 2.5rem;
      }
      &[data-category="false"] {
        padding-top: 0.75rem;
      }
      &[data-category="true"] {
        padding-top: 2.5rem;
      }
      
      @media (min-width: 768px) {
        padding: 0.75rem;
        padding-left: 1rem;
        gap: 0.375rem;
        
        &[data-thumb="false"] {
          padding-top: 2.75rem;
        }
        &[data-category="false"] {
          padding-top: 1rem;
        }
        &[data-category="true"] {
          padding-top: 2.75rem;
        }
      }
      > .top {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: flex-start;
        gap: 1rem;

        h3 {
          flex: 1;
          margin: 0;
          margin-top: 0.25rem;
          font-size: 0.875rem;
          line-height: 1.2rem;
          font-weight: 500;
          cursor: pointer;

          @media (min-width: 768px) {
            font-size: 1rem;
            line-height: 1.3rem;
            margin-top: 0.375rem;
          }
        }

        .thumbnail {
          position: relative;
          width: 80px;
          height: 60px;
          flex-shrink: 0;
          background-color: ${({ theme }) => theme.colors.gray2};
          border-radius: 0.5rem;
          overflow: hidden;

          @media (min-width: 768px) {
            width: 100px;
            height: 75px;
          }

          @media (min-width: 1024px) {
            width: 120px;
            height: 90px;
          }

          img {
            border-radius: 0.5rem;
            transition: transform 0.3s ease;
          }
        }
      }
      > .date {
        display: flex;
        gap: 0.5rem;
        align-items: center;
        .content {
          font-size: 0.75rem;
          line-height: 1rem;
          color: ${({ theme }) => theme.colors.gray10};
          
          @media (min-width: 768px) {
            font-size: 0.875rem;
            line-height: 1.25rem;
            margin-left: 0;
          }
        }
      }
      > .summary {
        p {
          display: none;
          font-size: 0.875rem;
          line-height: 1.5rem;
          color: ${({ theme }) => theme.colors.gray11};

          @media (min-width: 768px) {
            display: block;
          }
        }
      }
      > .tags {
        display: flex;
        gap: 0.25rem;
        flex-wrap: wrap;
        align-items: flex-start;
        
        @media (min-width: 768px) {
          gap: 0.5rem;
        }
      }
    }
  }
`
