const { Feed } = require('feed')
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
const { idToUuid } = require('notion-utils')

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

// Import getTextContent and getDateValue from notion-utils
const { getTextContent, getDateValue } = require('notion-utils')

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

// Normalize value to handle nested value structure from Notion API
function normalizeValue(obj) {
  if (obj?.value?.value && typeof obj.value.value === 'object' && 'id' in obj.value.value) {
    return obj.value.value
  }
  return obj?.value
}

// Fetch posts directly from Notion
async function fetchNotionPosts() {
  try {
    const api = new NotionAPI()
    let id = CONFIG.notionConfig.pageId

    if (!id) {
      console.warn('NOTION_PAGE_ID not found. RSS will be generated without posts.')
      return []
    }

    console.log(`Fetching from Notion page ID: ${id}`)
    const response = await api.getPage(id)
    id = idToUuid(id)

    // Normalize collection and block data
    const rawCollection = Object.values(response.collection)[0]
    const collection = normalizeValue(rawCollection)

    const block = {}
    for (const [blockId, blockData] of Object.entries(response.block)) {
      block[blockId] = { value: normalizeValue(blockData) }
    }

    const schema = collection?.schema
    const rawMetadata = block[id]?.value

    if (rawMetadata?.type !== "collection_view_page" && rawMetadata?.type !== "collection_view") {
      return []
    }

    const pageIds = getAllPageIds(response)
    const data = []

    for (let i = 0; i < pageIds.length; i++) {
      const pageId = pageIds[i]
      const properties = await getPageProperties(pageId, block, schema)

      properties.createdTime = new Date(block[pageId]?.value?.created_time).toString()
      properties.fullWidth = (block[pageId]?.value?.format)?.page_full_width ?? false

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


// Generate RSS feed
async function generateRSS() {
  const siteURL = CONFIG.link
  const date = new Date()

  // Create main RSS feed
  const feed = new Feed({
    title: CONFIG.blog.title,
    description: CONFIG.blog.description,
    id: siteURL,
    link: siteURL,
    language: CONFIG.lang,
    image: `${siteURL}/notion-avatar.svg`,
    favicon: `${siteURL}/favicon.ico`,
    copyright: `All rights reserved ${date.getFullYear()}, ${CONFIG.profile.name}`,
    updated: date,
    generator: 'notion-based-log',
    feedLinks: {
      rss2: `${siteURL}/feed.xml`,
      json: `${siteURL}/feed.json`,
      atom: `${siteURL}/atom.xml`,
    },
    author: {
      name: CONFIG.profile.name,
      email: CONFIG.profile.email,
      link: siteURL,
    },
  })

  // Fetch posts from Notion
  console.log('Fetching posts from Notion...')
  const posts = await fetchNotionPosts()

  // Filter and add posts to feed
  if (posts.length === 0) {
    console.log('No posts found, creating basic RSS feed structure')
  } else {
    const publishedPosts = posts.filter(post => 
      post.status && post.status.includes && post.status.includes('Public') && 
      post.type && post.type.includes && post.type.includes('Post')
    )
    
    publishedPosts
      .slice(0, 20) // Latest 20 posts
      .forEach((post) => {
        const postURL = `${siteURL}/${post.slug}`
        const publishDate = new Date(post.date?.start_date || post.createdTime || date)

        feed.addItem({
          title: post.title || 'Untitled',
          id: postURL,
          link: postURL,
          description: post.summary || post.title || 'No description',
          content: post.summary || post.title || 'No content',
          author: [
            {
              name: CONFIG.profile.name,
              email: CONFIG.profile.email,
              link: siteURL,
            },
          ],
          date: publishDate,
          category: post.category ? [{ name: post.category[0] || post.category }] : [],
        })
      })
  }

  // Ensure out directory exists (for static export)
  const outDir = path.join(process.cwd(), 'out')
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true })
  }

  // Generate RSS feeds content
  const rssContent = feed.rss2()
  const atomContent = feed.atom1()
  const jsonContent = feed.json1()

  // Write to out directory (for static export only)
  fs.writeFileSync(path.join(outDir, 'feed.xml'), rssContent)
  fs.writeFileSync(path.join(outDir, 'atom.xml'), atomContent)
  fs.writeFileSync(path.join(outDir, 'feed.json'), jsonContent)

  console.log('✅ RSS feeds generated successfully')
  console.log(`   - ${posts.length} posts processed`)
  console.log(`   - Generated: feed.xml, atom.xml, feed.json`)
  console.log(`   - Saved to: out/ directory (static export)`)

  return true
}

async function main() {
  try {
    await generateRSS()
  } catch (error) {
    console.error('❌ Error generating RSS feeds:', error)
    // Don't exit with error to avoid breaking builds
    console.log('⚠️ Continuing build without RSS feeds')
  }
}

if (require.main === module) {
  main()
}

module.exports = { generateRSS }