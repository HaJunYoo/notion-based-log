import { dehydrate } from "@tanstack/react-query"
import { GetStaticProps } from "next"
import { CONFIG } from "site.config"
import { getPosts } from "src/apis"
import MetaConfig from "src/components/MetaConfig"
import { queryKey } from "src/constants/queryKey"
import usePostQuery from "src/hooks/usePostQuery"
import { queryClient } from "src/libs/react-query"
import { filterPosts } from "src/libs/utils/notion"
import { FilterPostsOptions } from "src/libs/utils/notion/filterPosts"
import Detail from "src/routes/Detail"
import CustomError from "src/routes/Error"
import { NextPageWithLayout } from "../types"

const filter: FilterPostsOptions = {
  acceptStatus: ["Public", "PublicOnDetail"],
  acceptType: ["Paper", "Post", "Page"],
}

// Function to get recent posts for selective pre-generation
const getRecentPosts = (posts: any[], limit: number = 20) => {
  return posts
    .sort((a, b) => {
      // Sort by date (newest first)
      const dateA = new Date(a.date?.start_date || a.createdTime)
      const dateB = new Date(b.date?.start_date || b.createdTime)
      return dateB.getTime() - dateA.getTime()
    })
    .slice(0, limit)
}

export const getStaticPaths = async () => {
  const posts = await getPosts()
  const filteredPost = filterPosts(posts, filter)

  return {
    paths: filteredPost
      .filter((row) => row.slug !== "about")
      .map((row) => `/${row.slug}`),
    fallback: 'blocking',
  }
}

export const getStaticProps: GetStaticProps = async (context) => {
  const slug = context.params?.slug

  if (slug === "about") {
    return {
      notFound: true,
    }
  }

  const posts = await getPosts()
  const feedPosts = filterPosts(posts).map((p: any) => ({ ...p, thumbnail: p.thumbnail ?? null }))
  await queryClient.prefetchQuery(queryKey.posts(), () => feedPosts)

  const detailPosts = filterPosts(posts, filter)
  const postDetail = detailPosts.find((t: any) => t.slug === slug)
  
  if (!postDetail) {
    return { notFound: true }
  }
  
  // Get recordMap for complete SEO optimization (static export can handle large sizes)
  const { getRecordMap } = await import('../apis/notion-client/getRecordMap')
  const recordMap = await getRecordMap(postDetail.id)
  
  const postMeta = { ...postDetail, thumbnail: postDetail.thumbnail ?? null }
  await queryClient.prefetchQuery(queryKey.post(`${slug}`), () => postMeta)

  // Add recordMap to the post data in query client
  const postWithRecordMap = { ...postMeta, recordMap }
  await queryClient.prefetchQuery(queryKey.post(`${slug}`), () => postWithRecordMap)

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
    },
    // revalidate removed - not needed for static export
  }
}

const DetailPage: NextPageWithLayout = () => {
  const post = usePostQuery()

  if (!post) return <CustomError />

  const image = post.thumbnail ??
    (CONFIG.ogImageGenerateURL
      ? `${CONFIG.ogImageGenerateURL}/${encodeURIComponent(post.title)}.png`
      : `${CONFIG.link}/og-image.png`)

  const date = post.date?.start_date || post.createdTime || ""

  const meta = {
    title: post.title,
    date: new Date(date).toISOString(),
    image: image,
    description: post.summary || "",
    type: post.type[0],
    url: `${CONFIG.link}/${post.slug}/`,
    robots:
      post.type?.[0] === "Paper" || post.status?.[0] === "PublicOnDetail"
        ? "noindex, follow"
        : "index, follow",
  }

  return (
    <>
      <MetaConfig {...meta} />
      <Detail />
    </>
  )
}

DetailPage.getLayout = (page) => {
  return <>{page}</>
}

export default DetailPage
