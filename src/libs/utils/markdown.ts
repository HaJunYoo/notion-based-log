import fs from 'fs'
import path from 'path'
import { remark } from 'remark'
import html from 'remark-html'
import gfm from 'remark-gfm'

export async function getMarkdownContent(filename: string) {
  const markdownPath = path.join(process.cwd(), 'content', `${filename}.md`)

  if (!fs.existsSync(markdownPath)) {
    throw new Error(`Markdown file not found: ${filename}.md`)
  }

  const fileContents = fs.readFileSync(markdownPath, 'utf8')

  const processedContent = await remark()
    .use(gfm)
    .use(html)
    .process(fileContents)

  return processedContent.toString()
}