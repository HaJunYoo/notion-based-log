import { NextPage } from "next"
import { AppProps } from "next/app"
import { ExtendedRecordMap } from "notion-types"
import { ReactElement, ReactNode } from "react"

// TODO: refactor types
export type NextPageWithLayout<PageProps = {}> = NextPage<PageProps> & {
  getLayout?: (page: ReactElement) => ReactNode
}

export type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout
}

export type TProject = {
  name: string
  href: string
  description?: string
}

export type TConfig = {
  profile: {
    name: string
    image: string
    role: string
    bio: string
    email: string
    linkedin: string
    github: string
    instagram: string
  }
  projects: TProject[]
  blog: {
    title: string
    description: string
    scheme: "light" | "dark" | "system"
  }
  link: string
  since: number
  lang: string
  ogImageGenerateURL: string
  deployVersion: string
  notionConfig: {
    pageId: string
  }
  googleAnalytics: {
    enable: boolean
    config: {
      measurementId: string
    }
  }
  googleSearchConsole: {
    enable: boolean
    config: {
      siteVerification: string
    }
  }
  naverSearchAdvisor: {
    enable: boolean
    config: {
      siteVerification: string
    }
  }
  utterances: {
    enable: boolean
    config: {
      repo: string
      "issue-term": string
      label: string
    }
  }
  cusdis: {
    enable: boolean
    config: {
      host: string
      appid: string
    }
  }
  isProd: boolean
  revalidateTime: number
}

export type TPostStatus = "Private" | "Public" | "PublicOnDetail"
export type TPostType = "Post" | "Paper" | "Page"

export type TPost = {
  id: string
  date: { start_date: string }
  type: TPostType[]
  slug: string
  tags?: string[]
  category?: string[]
  summary?: string
  author?: {
    id: string
    name: string
    profile_photo?: string
  }[]
  title: string
  status: TPostStatus[]
  createdTime: string
  fullWidth: boolean
  thumbnail?: string
}

export type PostDetail = TPost & {
  recordMap: ExtendedRecordMap
}

export type TPosts = TPost[]

export type TTags = {
  [tagName: string]: number
}
export type TCategories = {
  [category: string]: number
}

export type TCategoryHierarchy = {
  major: string
  minor?: string
}

export type TMajorCategories = {
  [majorCategory: string]: {
    count: number
    minorCategories: {
      [minorCategory: string]: number
    }
  }
}

export type SchemeType = "light" | "dark"
