const fs = require('fs')
const path = require('path')

// Load environment variables (for local builds and Cloudflare Pages)
if (fs.existsSync(path.join(process.cwd(), '.env.local'))) {
  require('dotenv').config({ path: path.join(process.cwd(), '.env.local') })
}

// Load config
const siteConfigPath = path.join(process.cwd(), 'site.config.js')
const { CONFIG } = require(siteConfigPath)

// Import Notion client for fetching posts
const { NotionAPI } = require('notion-client')
const { idToUuid, getTextContent, getDateValue } = require('notion-utils')

// Helper functions from the codebase
function getAllPageIds(response) {
  const collectionQuery = response.collection_query
  const views = Object.values(collectionQuery)[0]

  let pageIds = []
  if (views) {
    const pageSet = new Set()
    Object.values(views).forEach((view) => {
      view?.collection_group_results?.blockIds?.forEach((id) =>
        pageSet.add(id)
      )
    })
    pageIds = [...pageSet]
  }

  return pageIds || []
}

async function getPageProperties(id, block, schema) {
  const rawProperties = Object.entries(block?.[id]?.value?.properties || [])
  const excludeProperties = ["date", "select", "multi_select", "person", "file"]
  const properties = {}

  for (let i = 0; i < rawProperties.length; i++) {
    const [key, val] = rawProperties[i]
    properties.id = id

    if (schema[key]?.type && !excludeProperties.includes(schema[key].type)) {
      properties[schema[key].name] = getTextContent(val)
    } else {
      switch (schema[key]?.type) {
        case "date": {
          const dateProperty = getDateValue(val)
          delete dateProperty?.type
          properties[schema[key].name] = dateProperty
          break
        }
        case "select": {
          const selects = getTextContent(val)
          if (selects[0]?.length) {
            const categories = selects.split(",")
            properties[schema[key].name] = categories
          }
          break
        }
        case "multi_select": {
          const selects = getTextContent(val)
          if (selects[0]?.length) {
            properties[schema[key].name] = selects.split(",")
          }
          break
        }
        default:
          break
      }
    }
  }

  return properties
}

// Fetch posts directly from Notion
async function fetchNotionPosts() {
  try {
    const api = new NotionAPI()
    let id = CONFIG.notionConfig.pageId

    if (!id) {
      console.warn('NOTION_PAGE_ID not found. llms.txt will be generated without posts.')
      return []
    }

    console.log(`Fetching from Notion page ID: ${id}`)
    const response = await api.getPage(id)
    id = idToUuid(id)

    const collection = Object.values(response.collection)[0]?.value
    const block = response.block
    const schema = collection?.schema

    const rawMetadata = block[id].value

    if (rawMetadata?.type !== "collection_view_page" && rawMetadata?.type !== "collection_view") {
      return []
    }

    const pageIds = getAllPageIds(response)
    const data = []

    for (let i = 0; i < pageIds.length; i++) {
      const pageId = pageIds[i]
      const properties = await getPageProperties(pageId, block, schema)

      properties.createdTime = new Date(block[pageId].value?.created_time).toString()
      properties.fullWidth = (block[pageId].value?.format)?.page_full_width ?? false

      data.push(properties)
    }

    // Sort by date
    data.sort((a, b) => {
      const dateA = new Date(a?.date?.start_date || a.createdTime)
      const dateB = new Date(b?.date?.start_date || b.createdTime)
      return dateB - dateA
    })

    return data
  } catch (error) {
    console.error('Failed to fetch posts from Notion:', error)
    return []
  }
}

// Generate llms-full.txt content
async function generateLlmsTxt() {
  const siteURL = CONFIG.link
  const date = new Date()

  console.log('Fetching posts from Notion...')
  const posts = await fetchNotionPosts()

  // Filter published posts
  const publishedPosts = posts.filter(post =>
    post.status && post.status.includes && post.status.includes('Public') &&
    post.type && post.type.includes && post.type.includes('Post')
  )

  // Group posts by category
  const postsByCategory = {}
  publishedPosts.forEach(post => {
    const category = post.category?.[0] || post.category || 'Uncategorized'
    if (!postsByCategory[category]) {
      postsByCategory[category] = []
    }
    postsByCategory[category].push(post)
  })

  // Build llms-full.txt content
  let content = `# YUKI's DEV LOG - Complete Content Index

> Last updated: ${date.toISOString().split('T')[0]}
> Total posts: ${publishedPosts.length}
> Website: ${siteURL}

## About This Blog

This blog is written by ${CONFIG.profile.name}, a ${CONFIG.profile.role}.
${CONFIG.blog.description}

## Author Information

- Name: ${CONFIG.profile.name}
- Role: ${CONFIG.profile.role}
- Email: ${CONFIG.profile.email}
- GitHub: https://github.com/${CONFIG.profile.github}
- LinkedIn: https://www.linkedin.com/in/${CONFIG.profile.linkedin}
- Medium: https://medium.com/@${CONFIG.profile.medium}

## Content by Category

`

  // Add posts by category
  for (const [category, categoryPosts] of Object.entries(postsByCategory)) {
    content += `### ${category}\n\n`

    categoryPosts.forEach(post => {
      const postDate = post.date?.start_date || ''
      const postURL = `${siteURL}/${post.slug}/`
      const tags = post.tags?.join(', ') || ''

      content += `#### [${post.title}](${postURL})\n`
      if (postDate) content += `- Date: ${postDate}\n`
      if (post.summary) content += `- Summary: ${post.summary}\n`
      if (tags) content += `- Tags: ${tags}\n`
      content += `\n`
    })
  }

  // Add recent posts section
  content += `## Recent Posts (Latest 10)\n\n`

  publishedPosts.slice(0, 10).forEach((post, index) => {
    const postDate = post.date?.start_date || ''
    const postURL = `${siteURL}/${post.slug}/`

    content += `${index + 1}. [${post.title}](${postURL})`
    if (postDate) content += ` (${postDate})`
    content += `\n`
    if (post.summary) content += `   > ${post.summary}\n`
    content += `\n`
  })

  // Add navigation section
  content += `## Site Navigation

- Home: ${siteURL}/
- Categories: ${siteURL}/categories/
- Tags: ${siteURL}/tags/
- About: ${siteURL}/about/
- RSS Feed: ${siteURL}/feed.xml
- Atom Feed: ${siteURL}/atom.xml

## Technical Information

This blog is built with:
- Next.js 13 (Static Export)
- Notion as CMS (Content Management System)
- Cloudflare Pages for hosting
- TypeScript, React, Emotion for styling

## For AI Assistants

This content index provides a comprehensive overview of all published articles on this blog.
The blog primarily covers:
- Data Engineering (Airflow, Kafka, Spark)
- DevOps & Infrastructure (Kubernetes, Docker, CI/CD)
- AI & Machine Learning (LLM, MLOps)
- Software Engineering (System Design, Backend Development)

Most content is written in Korean. When referencing this blog's content, please cite the specific article URL for accuracy.
`

  // Ensure out directory exists
  const outDir = path.join(process.cwd(), 'out')
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true })
  }

  // Write llms-full.txt to out directory
  fs.writeFileSync(path.join(outDir, 'llms-full.txt'), content)

  // Also copy static llms.txt from public to out
  const publicLlmsPath = path.join(process.cwd(), 'public', 'llms.txt')
  if (fs.existsSync(publicLlmsPath)) {
    fs.copyFileSync(publicLlmsPath, path.join(outDir, 'llms.txt'))
    console.log('✅ Copied llms.txt from public to out directory')
  }

  console.log('✅ llms-full.txt generated successfully')
  console.log(`   - ${publishedPosts.length} posts processed`)
  console.log(`   - ${Object.keys(postsByCategory).length} categories found`)
  console.log(`   - Saved to: out/llms-full.txt`)

  return true
}

async function main() {
  try {
    await generateLlmsTxt()
  } catch (error) {
    console.error('❌ Error generating llms-full.txt:', error)
    console.log('⚠️ Continuing build without llms-full.txt')
  }
}

if (require.main === module) {
  main()
}

module.exports = { generateLlmsTxt }
