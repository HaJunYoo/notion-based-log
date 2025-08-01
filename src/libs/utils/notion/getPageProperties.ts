import { getTextContent, getDateValue } from "notion-utils"
import { NotionAPI } from "notion-client"
import { BlockMap, CollectionPropertySchemaMap } from "notion-types"
import { customMapImageUrl } from "./customMapImageUrl"

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

async function getPageProperties(
  id: string,
  block: BlockMap,
  schema: CollectionPropertySchemaMap,
  retries = 5
) {
  const api = new NotionAPI()
  const rawProperties = Object.entries(block?.[id]?.value?.properties || [])
  const excludeProperties = ["date", "select", "multi_select", "person", "file"]
  const properties: any = {}
  for (let i = 0; i < rawProperties.length; i++) {
    const [key, val]: any = rawProperties[i]
    properties.id = id
    if (schema[key]?.type && !excludeProperties.includes(schema[key].type)) {
      properties[schema[key].name] = getTextContent(val)
    } else {
      switch (schema[key]?.type) {
        case "file": {
          try {
            const Block = block?.[id].value
            const url: string = val[0][1][0][1]
            const newurl = customMapImageUrl(url, Block)
            properties[schema[key].name] = newurl
          } catch (error) {
            properties[schema[key].name] = undefined
          }
          break
        }
        case "date": {
          const dateProperty: any = getDateValue(val)
          delete dateProperty.type
          properties[schema[key].name] = dateProperty
          break
        }
        case "select": {
          const selects = getTextContent(val)
          if (selects[0]?.length) {
            const categories = selects.split(",")
            const expandedCategories = new Set(categories)
            
            // '/' 구분자가 있는 카테고리에서 대분류도 추가
            categories.forEach(category => {
              if (category.includes('/')) {
                const majorCategory = category.split('/')[0]?.trim()
                if (majorCategory) {
                  expandedCategories.add(majorCategory)
                }
              }
            })
            
            properties[schema[key].name] = Array.from(expandedCategories)
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
        case "person": {
          const rawUsers = val.flat()

          const users = []
          for (let i = 0; i < rawUsers.length; i++) {
            if (rawUsers[i][0][1]) {
              const userId = rawUsers[i][0]
              
              let res: any
              for (let attempt = 0; attempt < retries; attempt++) {
                try {
                  res = await api.getUsers(userId)
                  break
                } catch (error: any) {
                  const isNetworkError = error?.cause?.code === 'UND_ERR_SOCKET' || 
                                       error?.message?.includes('fetch failed') ||
                                       error?.message?.includes('other side closed') ||
                                       error?.message?.includes('502 Bad Gateway')
                  
                  if (attempt === retries - 1) {
                    console.error(`Failed to fetch user ${userId[1]} after ${retries} attempts:`, error)
                    throw error
                  }
                  
                  const baseDelay = isNetworkError ? 2000 : 1000
                  const delay = Math.pow(2, attempt) * baseDelay
                  console.warn(`Attempt ${attempt + 1} failed for user ${userId[1]} (${isNetworkError ? 'network error' : 'unknown error'}), retrying in ${delay}ms...`)
                  await sleep(delay)
                }
              }
              
              const resValue =
                res?.recordMapWithRoles?.notion_user?.[userId[1]]?.value
              const user = {
                id: resValue?.id,
                name:
                  resValue?.name ||
                  `${resValue?.family_name}${resValue?.given_name}` ||
                  undefined,
                profile_photo: resValue?.profile_photo || null,
              }
              users.push(user)
            }
          }
          properties[schema[key].name] = users
          break
        }
        default:
          break
      }
    }
  }
  return properties
}

export { getPageProperties as default }
