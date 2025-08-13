import { getPosts } from "../apis/notion-client/getPosts"
import { CONFIG } from "site.config"
import { getServerSideSitemap, ISitemapField } from "next-sitemap"
import { GetServerSideProps } from "next"
import { filterPosts } from "src/libs/utils/notion"

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const posts = await getPosts()
  // Exclude Paper and PublicOnDetail from sitemap
  const filtered = filterPosts(posts, { acceptStatus: ["Public"], acceptType: ["Post", "Page"] })
  const dynamicPaths = filtered.map((post) => `${CONFIG.link}/${post.slug}`)

  // Create an array of fields, each with a loc and lastmod
  const fields: ISitemapField[] = dynamicPaths.map((path) => ({
    loc: path,
    lastmod: new Date().toISOString(),
    priority: 0.7,
    changefreq: "daily",
  }))

  // Include the site root separately
  fields.unshift({
    loc: CONFIG.link,
    lastmod: new Date().toISOString(),
    priority: 1.0,
    changefreq: "daily",
  })

  return getServerSideSitemap(ctx, fields)
}

// Default export to prevent next.js errors
const Sitemap = () => null
export default Sitemap
