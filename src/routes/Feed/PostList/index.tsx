import styled from "@emotion/styled"
import { useRouter } from "next/router"
import React, { useEffect, useMemo, useState } from "react"
import Pagination from "src/components/Pagination"
import { DEFAULT_CATEGORY } from "src/constants"
import usePostsQuery from "src/hooks/usePostsQuery"
import PostCard from "src/routes/Feed/PostList/PostCard"

type Props = {
  q: string
}

const POSTS_PER_PAGE = 12 // 페이지네이션에서는 더 많이 보여줄 수 있음

const PostList: React.FC<Props> = ({ q }) => {
  const router = useRouter()
  const data = usePostsQuery()
  const [currentPage, setCurrentPage] = useState(1)

  const currentTag = `${router.query.tag || ``}` || undefined
  const currentCategory = `${router.query.category || ``}` || DEFAULT_CATEGORY
  const currentOrder = `${router.query.order || ``}` || "desc"

  // URL에서 페이지 정보 읽기
  const urlPage = parseInt(router.query.page as string) || 1

  // 필터링된 전체 포스트
  const filteredPosts = useMemo(() => {
    let newFilteredPosts = data
    // keyword
    newFilteredPosts = newFilteredPosts.filter((post) => {
      const tagContent = post.tags ? post.tags.join(" ") : ""
      const searchContent = post.title + post.summary + tagContent
      return searchContent.toLowerCase().includes(q.toLowerCase())
    })

    // tag
    if (currentTag) {
      newFilteredPosts = newFilteredPosts.filter(
        (post) => post && post.tags && post.tags.includes(currentTag)
      )
    }

    // category
    if (currentCategory !== DEFAULT_CATEGORY) {
      newFilteredPosts = newFilteredPosts.filter(
        (post) =>
          post && post.category && post.category.includes(currentCategory)
      )
    }
    // order
    if (currentOrder !== "desc") {
      newFilteredPosts = newFilteredPosts.reverse()
    }

    return newFilteredPosts
  }, [data, q, currentTag, currentCategory, currentOrder])

  // 페이지네이션 계산
  const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE)
  const startIndex = (currentPage - 1) * POSTS_PER_PAGE
  const endIndex = startIndex + POSTS_PER_PAGE
  const displayedPosts = filteredPosts.slice(startIndex, endIndex)

  // URL 페이지와 동기화
  useEffect(() => {
    if (urlPage !== currentPage) {
      setCurrentPage(urlPage)
    }
  }, [urlPage])

  // 필터 조건이 변경되면 페이지 리셋
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1)
      // URL도 업데이트
      const newQuery = { ...router.query }
      delete newQuery.page // 첫 페이지는 URL에서 제거
      router.push({
        pathname: router.pathname,
        query: newQuery,
      }, undefined, { shallow: true })
    }
  }, [filteredPosts.length, q, currentTag, currentCategory, currentOrder])

  const handlePageChange = (page: number) => {
    setCurrentPage(page)

    // URL 업데이트
    const newQuery = { ...router.query }
    if (page === 1) {
      delete newQuery.page // 첫 페이지는 URL에서 제거
    } else {
      newQuery.page = page.toString()
    }

    router.push({
      pathname: router.pathname,
      query: newQuery,
    }, undefined, { shallow: true })

    // 페이지 상단으로 스크롤
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <>
      <PostListContainer>
        {!filteredPosts.length && (
          <EmptyMessage>Nothing! 😺</EmptyMessage>
        )}

        {displayedPosts.map((post, index) => (
          <PostCard key={post.id} data={post} index={index} />
        ))}

        {filteredPosts.length > 0 && (
          <PostInfo>
            Showing {startIndex + 1}-{Math.min(endIndex, filteredPosts.length)} of {filteredPosts.length} posts
          </PostInfo>
        )}
      </PostListContainer>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </>
  )
}

export default PostList

const PostListContainer = styled.div`
  margin: 0.5rem 0;
`

const EmptyMessage = styled.p`
  color: ${({ theme }) => theme.colors.gray9};
  text-align: center;
  padding: 2rem 0;
`

const PostInfo = styled.div`
  text-align: center;
  color: ${({ theme }) => theme.colors.gray11}; /* gray9 → gray11로 더 밝게 */
  font-size: 0.8125rem;
  margin: 1rem 0;
  font-weight: 500;
`