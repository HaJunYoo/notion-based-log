import { NotionAPI } from "notion-client"

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export const getRecordMap = async (pageId: string, retries = 5) => {
  const api = new NotionAPI()
  
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const recordMap = await api.getPage(pageId)
      return recordMap
    } catch (error: any) {
      const isNetworkError = error?.cause?.code === 'UND_ERR_SOCKET' || 
                           error?.message?.includes('fetch failed') ||
                           error?.message?.includes('other side closed') ||
                           error?.message?.includes('502 Bad Gateway')
      
      if (attempt === retries - 1) {
        console.error(`Failed to fetch recordMap for pageId ${pageId} after ${retries} attempts:`, error)
        throw error
      }
      
      // Longer delay for network/socket errors
      const baseDelay = isNetworkError ? 2000 : 1000
      const delay = Math.pow(2, attempt) * baseDelay
      console.warn(`Attempt ${attempt + 1} failed for pageId ${pageId} (${isNetworkError ? 'network error' : 'unknown error'}), retrying in ${delay}ms...`)
      await sleep(delay)
    }
  }
}
