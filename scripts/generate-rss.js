const { Feed } = require('feed')
const fs = require('fs')
const path = require('path')

// Load config
const siteConfigPath = path.join(process.cwd(), 'site.config.js')
const { CONFIG } = require(siteConfigPath)

// Simple RSS generation using environment variables
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

  // Read build output for post data
  const buildDataPath = path.join(process.cwd(), '.next/cache/posts-data.json')
  let posts = []

  // If build data exists, use it
  if (fs.existsSync(buildDataPath)) {
    try {
      const buildData = JSON.parse(fs.readFileSync(buildDataPath, 'utf8'))
      posts = buildData.posts || []
    } catch (e) {
      console.warn('Could not read build data, creating basic RSS')
    }
  }

  // If no posts from build data, create basic RSS structure
  if (posts.length === 0) {
    console.log('Creating basic RSS feed structure')
  } else {
    // Add posts to feed
    posts
      .filter(post => post.status && post.status.includes('Public') && post.type && post.type.includes('Post'))
      .slice(0, 20) // Latest 20 posts
      .forEach((post) => {
        const postURL = `${siteURL}/${post.slug}`
        const publishDate = new Date(post.date?.start_date || post.createdTime || date)

        feed.addItem({
          title: post.title,
          id: postURL,
          link: postURL,
          description: post.summary || post.title,
          content: post.summary || post.title,
          author: [
            {
              name: CONFIG.profile.name,
              email: CONFIG.profile.email,
              link: siteURL,
            },
          ],
          date: publishDate,
          category: post.category ? [{ name: post.category[0] }] : [],
        })
      })
  }

  // Ensure public directory exists
  const publicDir = path.join(process.cwd(), 'public')
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true })
  }

  // Generate RSS feeds
  fs.writeFileSync(path.join(publicDir, 'feed.xml'), feed.rss2())
  fs.writeFileSync(path.join(publicDir, 'atom.xml'), feed.atom1())
  fs.writeFileSync(path.join(publicDir, 'feed.json'), feed.json1())

  console.log('✅ RSS feeds generated successfully')
  console.log(`   - ${posts.length} posts processed`)
  console.log(`   - Generated: feed.xml, atom.xml, feed.json`)

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