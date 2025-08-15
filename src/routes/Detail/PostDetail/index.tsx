import React, { useEffect, useState } from "react"
import PostHeader from "./PostHeader"
import Footer from "./PostFooter"
import CommentBox from "./CommentBox"
import RelatedPosts from "./RelatedPosts"
import Category from "src/components/Category"
import styled from "@emotion/styled"
import NotionRenderer from "../components/NotionRenderer"
import usePostQuery from "src/hooks/usePostQuery"
import usePostsQuery from "src/hooks/usePostsQuery"
import { useQuery } from "@tanstack/react-query"


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
  
  // Show loading spinner while recordMap is being fetched
  if (isLoadingDetail) {
    return (
      <StyledWrapper>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div>Loading content...</div>
        </div>
      </StyledWrapper>
    )
  }

  // If API call failed, show error message
  if (error || !detailData?.success || !detailData?.data?.recordMap) {
    return (
      <StyledWrapper>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div>Content could not be loaded.</div>
          <div style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.5rem' }}>
            Please try again later.
          </div>
        </div>
      </StyledWrapper>
    )
  }

  const recordMap = detailData.data.recordMap
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
          <NotionRenderer recordMap={recordMap} />
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

export default PostDetail

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