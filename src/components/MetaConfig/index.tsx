import Head from "next/head"
import { CONFIG } from "site.config"

export type BreadcrumbItem = {
  name: string
  url: string
}

export type MetaConfigProps = {
  title: string
  description: string
  type: "Website" | "Post" | "Page" | string
  date?: string
  image?: string
  robots?: string
  url: string
  category?: string
  tags?: string[]
  breadcrumbs?: BreadcrumbItem[]
}

const generateJsonLd = (props: MetaConfigProps) => {
  const baseUrl = CONFIG.link

  const personSchema = {
    "@type": "Person",
    name: CONFIG.profile.name,
    url: baseUrl,
    jobTitle: CONFIG.profile.role,
    sameAs: [
      CONFIG.profile.github ? `https://github.com/${CONFIG.profile.github}` : null,
      CONFIG.profile.linkedin ? `https://www.linkedin.com/in/${CONFIG.profile.linkedin}` : null,
      CONFIG.profile.medium ? `https://medium.com/@${CONFIG.profile.medium}` : null,
    ].filter(Boolean),
  }

  if (props.type === "Post") {
    return {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: props.title,
      description: props.description,
      image: props.image || `${baseUrl}/og-image.png`,
      url: props.url,
      datePublished: props.date,
      dateModified: props.date,
      author: personSchema,
      publisher: {
        "@type": "Person",
        name: CONFIG.profile.name,
        url: baseUrl,
      },
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": props.url,
      },
      ...(props.category && { articleSection: props.category }),
      ...(props.tags && props.tags.length > 0 && { keywords: props.tags.join(", ") }),
    }
  }

  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: CONFIG.blog.title,
    description: CONFIG.blog.description,
    url: baseUrl,
    author: personSchema,
    inLanguage: CONFIG.lang || "ko-KR",
  }
}

const generateBreadcrumbJsonLd = (breadcrumbs: BreadcrumbItem[]) => {
  if (!breadcrumbs || breadcrumbs.length === 0) return null

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbs.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

const MetaConfig: React.FC<MetaConfigProps> = (props) => {
  const jsonLd = generateJsonLd(props)
  const breadcrumbJsonLd = generateBreadcrumbJsonLd(props.breadcrumbs || [])

  return (
    <Head>
      <title>{props.title}</title>
      <meta name="robots" content={props.robots ?? "follow, index"} />
      <meta charSet="UTF-8" />
      <meta name="description" content={props.description} />
      <link rel="canonical" href={props.url} />
      {/* og */}
      <meta property="og:type" content={props.type} />
      <meta property="og:title" content={props.title} />
      <meta property="og:description" content={props.description} />
      <meta property="og:url" content={props.url} />
      <meta property="og:site_name" content={CONFIG.blog.title} />
      {CONFIG.lang && <meta property="og:locale" content={CONFIG.lang} />}
      <meta property="og:image" content={props.image || `${CONFIG.link}/og-image.png`} />
      {/* twitter */}
      <meta name="twitter:title" content={props.title} />
      <meta name="twitter:description" content={props.description} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:image" content={props.image || `${CONFIG.link}/og-image.png`} />
      {/* post */}
      {props.type === "Post" && (
        <>
          <meta property="article:published_time" content={props.date} />
          <meta property="article:author" content={CONFIG.profile.name} />
        </>
      )}
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Breadcrumb JSON-LD */}
      {breadcrumbJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
        />
      )}
    </Head>
  )
}

export default MetaConfig
