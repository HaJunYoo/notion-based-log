import { useQuery } from "@tanstack/react-query"
import { useRouter } from "next/router"
import { queryKey } from "src/constants/queryKey"
import { PostDetail } from "src/types"
import { getPosts, getRecordMap } from "src/apis"
import { filterPosts } from "src/libs/utils/notion"
import { FilterPostsOptions } from "src/libs/utils/notion/filterPosts"

const filter: FilterPostsOptions = {
  acceptStatus: ["Public", "PublicOnDetail"],
  acceptType: ["Paper", "Post", "Page"],
}

const usePostQuery = (isLargePage?: boolean) => {
  const router = useRouter()
  const { slug } = router.query

  const { data } = useQuery<PostDetail>({
    queryKey: queryKey.post(`${slug}`),
    enabled: isLargePage ? !!slug : false,
    queryFn: async (): Promise<PostDetail> => {
      const posts = await getPosts()
      const detailPosts = filterPosts(posts, filter)
      const postDetail = detailPosts.find((t: any) => t.slug === slug)
      
      if (!postDetail) throw new Error("Post not found")
      
      const recordMap = await getRecordMap(postDetail.id)
      
      return {
        ...postDetail,
        recordMap,
      } as PostDetail
    },
  })

  return data
}

export default usePostQuery
