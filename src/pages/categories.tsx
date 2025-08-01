import { dehydrate } from "@tanstack/react-query"
import { GetStaticProps } from "next"
import MetaConfig from "src/components/MetaConfig"
import { queryKey } from "src/constants/queryKey"
import { queryClient } from "src/libs/react-query"
import { filterPosts } from "src/libs/utils/notion"
import Categories from "src/routes/Categories"
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

const CategoriesPage: NextPageWithLayout = () => {
  const meta = {
    title: `Categories - ${CONFIG.blog.title}`,
    description: "Browse posts by category",
    type: "website",
    url: `${CONFIG.link}/categories`,
    image: CONFIG.ogImageGenerateURL
      ? `${CONFIG.ogImageGenerateURL}/${encodeURIComponent(`Categories - ${CONFIG.blog.title}`)}.png`
      : undefined,
  }

  return (
    <>
      <MetaConfig {...meta} />
      <Categories />
    </>
  )
}

export default CategoriesPage
