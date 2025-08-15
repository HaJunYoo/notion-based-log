import { keyframes } from "@emotion/react"
import styled from "@emotion/styled"
import { useQuery } from "@tanstack/react-query"
import React from "react"
import Category from "src/components/Category"
import usePostQuery from "src/hooks/usePostQuery"
import usePostsQuery from "src/hooks/usePostsQuery"
import NotionRenderer from "../components/NotionRenderer"
import CommentBox from "./CommentBox"
import Footer from "./PostFooter"
import PostHeader from "./PostHeader"
import RelatedPosts from "./RelatedPosts"


type Props = {}

const PostDetail: React.FC<Props> = () => {
  const data = usePostQuery()
  const allPosts = usePostsQuery()

  // Fetch recordMap via server-side API
  const { data: detailData, isLoading: isLoadingDetail, error } = useQuery({
    queryKey: ['post-detail-api', data?.slug],
    queryFn: async () => {
      const response = await fetch(`/api/posts/${data?.slug}`)
      if (!response.ok) {
        throw new Error('Failed to fetch post detail')
      }
      return response.json()
    },
    enabled: !!data?.slug,
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 2
  })

  if (!data) return null

  const category = (data.category && data.category?.[0]) || undefined

  return (
    <StyledWrapper>
      <article>
        {category && (
          <div css={{ marginBottom: "0.5rem" }}>
            <Category readOnly={data.status?.[0] === "PublicOnDetail"}>
              {category}
            </Category>
          </div>
        )}
        {data.type[0] === "Post" && <PostHeader data={data} />}
        
        <div>
          {isLoadingDetail ? (
            <ContentSkeleton />
          ) : error || !detailData?.success || !detailData?.data?.recordMap ? (
            <ErrorContainer>
              <ErrorIcon>⚠️</ErrorIcon>
              <ErrorTitle>Content could not be loaded</ErrorTitle>
              <ErrorText>Please try again later or check your connection.</ErrorText>
            </ErrorContainer>
          ) : (
            <NotionRenderer recordMap={detailData.data.recordMap} />
          )}
        </div>
        
        {data.type[0] === "Post" && (
          <>
            <Footer />
            <RelatedPosts currentPost={data} allPosts={allPosts} />
            <CommentBox data={data} />
          </>
        )}
      </article>
    </StyledWrapper>
  )
}

// Content Skeleton Component
const ContentSkeleton: React.FC = () => (
  <ContentSkeletonWrapper>
    {Array.from({ length: 8 }, (_, i) => (
      <div key={i} className="skeleton-line" />
    ))}
  </ContentSkeletonWrapper>
)

export default PostDetail

// Keyframes for animations
const fadeIn = keyframes`
  0% { opacity: 0; transform: translateY(10px); }
  100% { opacity: 1; transform: translateY(0); }
`

const shimmer = keyframes`
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
`

// Styled Components
const StyledWrapper = styled.div`
  padding-left: 1.5rem;
  padding-right: 1.5rem;
  padding-top: 3rem;
  padding-bottom: 3rem;
  border-radius: 1.5rem;
  max-width: 56rem;
  background-color: ${({ theme }) =>
    theme.scheme === "light" ? "white" : theme.colors.gray4};
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
  margin: 0 auto;
  > article {
    margin: 0 auto;
    max-width: 42rem;
    overflow-wrap: break-word;
    word-break: break-word;
    overflow: hidden;
  }
`



const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  min-height: 300px;
  animation: ${fadeIn} 0.3s ease-out;
`

const ErrorIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 1rem;
`

const ErrorTitle = styled.div`
  font-size: 1.25rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.gray12};
  margin-bottom: 0.75rem;
  text-align: center;
`

const ErrorText = styled.div`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.gray10};
  text-align: center;
  max-width: 400px;
  line-height: 1.5;
`

const ContentSkeletonWrapper = styled.div`
  padding: 2rem 0;
  animation: ${fadeIn} 0.3s ease-out;

  .skeleton-line {
    height: 1rem;
    background: linear-gradient(90deg, 
      ${({ theme }) => theme.scheme === "light" ? "#f0f0f0" : theme.colors.gray6} 25%, 
      ${({ theme }) => theme.scheme === "light" ? "#e0e0e0" : theme.colors.gray5} 50%, 
      ${({ theme }) => theme.scheme === "light" ? "#f0f0f0" : theme.colors.gray6} 75%
    );
    background-size: 200% 100%;
    animation: ${shimmer} 1.5s infinite;
    border-radius: 0.25rem;
    margin-bottom: 0.75rem;

    &:nth-of-type(1) { 
      width: 60%; 
      height: 1.5rem; 
      margin-bottom: 1.5rem; 
    }
    &:nth-of-type(2) { width: 100%; }
    &:nth-of-type(3) { width: 95%; }
    &:nth-of-type(4) { width: 85%; }
    &:nth-of-type(5) { width: 90%; }
    &:nth-of-type(6) { width: 70%; }
    &:nth-of-type(7) { width: 88%; }
    &:nth-of-type(8) { width: 75%; }
  }
`
