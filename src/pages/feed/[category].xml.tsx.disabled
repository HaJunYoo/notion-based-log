import { GetServerSideProps } from "next"
import { CONFIG } from "../../../site.config"
import { getPosts } from "../../apis/notion-client/getPosts"
import { filterPosts } from "../../libs/utils/notion"

const escapeXml = (unsafe: string): string => {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

const generateRSSItem = (post: any) => {
  const pubDate = new Date(post.date?.start_date || post.createdTime).toUTCString()
  const categories = post.category || []
  const tags = post.tags || []

  const postUrl = escapeXml(`${CONFIG.link}/${post.slug}`)
  const thumbnailUrl = post.thumbnail ? escapeXml(post.thumbnail) : ''

  return `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${postUrl}</link>
      <description><![CDATA[${post.summary || post.title}]]></description>
      <author>${escapeXml(CONFIG.profile.email)} (${escapeXml(CONFIG.profile.name)})</author>
      <pubDate>${pubDate}</pubDate>
      <guid isPermaLink="true">${postUrl}</guid>
      ${categories.map((cat: string) => `<category><![CDATA[${cat}]]></category>`).join('')}
      ${tags.map((tag: string) => `<category><![CDATA[${tag}]]></category>`).join('')}
      ${post.thumbnail ? `<enclosure url="${thumbnailUrl}" type="image/jpeg" />` : ''}
    </item>
  `
}

const generateCategoryRSS = (posts: any[], category: string) => {
  const lastBuildDate = new Date().toUTCString()
  const rssItems = posts.map(generateRSSItem).join('')

  const categoryUrl = escapeXml(`${CONFIG.link}/?category=${encodeURIComponent(category)}`)
  const feedUrl = escapeXml(`${CONFIG.link}/feed/${encodeURIComponent(category)}.xml`)
  const authorEmail = escapeXml(CONFIG.profile.email)
  const authorName = escapeXml(CONFIG.profile.name)

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title><![CDATA[${CONFIG.blog.title} - ${category}]]></title>
    <link>${categoryUrl}</link>
    <description><![CDATA[${CONFIG.blog.description} - ${category} 카테고리]]></description>
    <language>${CONFIG.lang}</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${feedUrl}" rel="self" type="application/rss+xml"/>
    <generator>Next.js Blog RSS Generator</generator>
    <webMaster>${authorEmail} (${authorName})</webMaster>
    <managingEditor>${authorEmail} (${authorName})</managingEditor>
    <copyright>Copyright ${new Date().getFullYear()}, ${authorName}</copyright>
    <category><![CDATA[${category}]]></category>
    <ttl>60</ttl>
    ${rssItems}
  </channel>
</rss>`
}

export const getServerSideProps: GetServerSideProps = async ({ params, res }) => {
  const category = params?.category as string

  if (!category) {
    res.writeHead(404)
    res.end()
    return { props: {} }
  }

  const posts = await getPosts()
  const filteredPosts = filterPosts(posts)

  // 해당 카테고리의 포스트만 필터링
  const categoryPosts = filteredPosts.filter(post =>
    post.category && post.category.includes(decodeURIComponent(category))
  )

  if (categoryPosts.length === 0) {
    res.writeHead(404)
    res.end()
    return { props: {} }
  }

  // 최신 20개 포스트만 RSS에 포함
  const recentPosts = categoryPosts.slice(0, 20)

  const rss = generateCategoryRSS(recentPosts, decodeURIComponent(category))

  res.setHeader('Content-Type', 'text/xml; charset=utf-8')
  res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=86400')
  res.write(rss)
  res.end()

  return {
    props: {},
  }
}

const CategoryRSSFeed = () => null
export default CategoryRSSFeed
