import { dehydrate } from "@tanstack/react-query"
import { GetStaticProps } from "next"
import MetaConfig from "src/components/MetaConfig"
import { queryKey } from "src/constants/queryKey"
import { queryClient } from "src/libs/react-query"
import { filterPosts } from "src/libs/utils/notion"
import Tags from "src/routes/Tags"
import { CONFIG } from "../../site.config"
import { getPosts } from "../apis"
import { NextPageWithLayout } from "../types"

export const getStaticProps: GetStaticProps = async () => {
  const posts = filterPosts(await getPosts())
  await queryClient.prefetchQuery(queryKey.posts(), () => posts)

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
    },
    revalidate: CONFIG.revalidateTime,
  }
}

const TagsPage: NextPageWithLayout = () => {
  const meta = {
    title: `Tags - ${CONFIG.blog.title}`,
    description: "Browse posts by tag",
    type: "website",
    url: `${CONFIG.link}/tags`,
    image: CONFIG.ogImageGenerateURL
      ? `${CONFIG.ogImageGenerateURL}/${encodeURIComponent(`Tags - ${CONFIG.blog.title}`)}.png`
      : undefined,
  }

  return (
    <>
      <MetaConfig {...meta} />
      <Tags />
    </>
  )
}

export default TagsPage
