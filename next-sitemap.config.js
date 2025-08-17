const { CONFIG } = require("./site.config")
const path = require('path')

module.exports = {
  siteUrl: CONFIG.link,
  generateRobotsTxt: true,
  sitemapSize: 7000,
  generateIndexSitemap: false,
  outDir: path.join(process.cwd(), 'out'), // Generate sitemap directly in out/ directory
  robotsTxtOptions: {
    additionalSitemaps: [],
    policies: [
      {
        userAgent: 'Amazonbot',
        disallow: ['/'],
      },
      {
        userAgent: 'Applebot-Extended',
        disallow: ['/'],
      },
      {
        userAgent: 'Bytespider',
        disallow: ['/'],
      },
      {
        userAgent: 'CCBot',
        disallow: ['/'],
      },
      {
        userAgent: 'ClaudeBot',
        disallow: ['/'],
      },
      {
        userAgent: 'Google-Extended',
        disallow: ['/'],
      },
      {
        userAgent: 'GPTBot',
        disallow: ['/'],
      },
      {
        userAgent: 'meta-externalagent',
        disallow: ['/'],
      },
      {
        userAgent: '*',
        allow: '/',
      },
    ],
    transform: async (_, content) => {
      const notice = `# NOTICE: The collection of content and other data on this
# site through automated means, including any device, tool,
# or process designed to data mine or scrape content, is
# prohibited except (1) for the purpose of search engine indexing or
# artificial intelligence retrieval augmented generation or (2) with express
# written permission from this site's operator.

# To request permission to license our intellectual
# property and/or other materials, please contact this
# site's operator directly.

# BEGIN Cloudflare Managed content

`
      return notice + content + `

# END Cloudflare Managed content`
    }
  }
}
