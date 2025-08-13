import { dehydrate } from "@tanstack/react-query"
import { GetStaticProps } from "next"
import { CONFIG } from "site.config"
import { getPosts, getRecordMap } from "src/apis"
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

  // Only pre-generate recent posts (top 20) for better build performance
  const recentPosts = getRecentPosts(filteredPost, 20)

  return {
    paths: recentPosts
      .filter((row) => row.slug !== "about")
      .map((row) => `/${row.slug}`),
    fallback: 'blocking', // Changed from 'true' to 'blocking' for better SEO and UX
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
  const feedPosts = filterPosts(posts)
  await queryClient.prefetchQuery(queryKey.posts(), () => feedPosts)

  const detailPosts = filterPosts(posts, filter)
  const postDetail = detailPosts.find((t: any) => t.slug === slug)
  const recordMap = await getRecordMap(postDetail?.id!)

  await queryClient.prefetchQuery(queryKey.post(`${slug}`), () => ({
    ...postDetail,
    recordMap,
  }))

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
    },
    revalidate: CONFIG.revalidateTime,
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
    url: `${CONFIG.link}/${post.slug}`,
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
