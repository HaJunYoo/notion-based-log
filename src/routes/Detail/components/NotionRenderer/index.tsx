import dynamic from "next/dynamic"
// import Image from "next/image" // Removed for static export
import Link from "next/link"
import { ExtendedRecordMap } from "notion-types"
import useScheme from "src/hooks/useScheme"
import { FC, useEffect, useState } from "react"
import { Global } from "@emotion/react"
import { notionCustomStyles } from "src/styles/notion-custom"
import styled from "@emotion/styled"

// Core NotionRenderer - SSR enabled for SEO (content rendered at build time)
import { NotionRenderer as _NotionRenderer } from "react-notion-x"

// core styles shared by all of react-notion-x (required)
import "react-notion-x/src/styles.css"

// used for code syntax highlighting (optional)
// import "prismjs/themes/prism-tomorrow.css"
// import 'prism-material-themes/themes/material-default.css';
import "prism-themes/themes/prism-vsc-dark-plus.css";

// used for rendering equations (optional)
import "katex/dist/katex.min.css"

const Code = dynamic(() =>
  import("react-notion-x/build/third-party/code").then(async (m) => m.Code)
)

const Collection = dynamic(() =>
  import("react-notion-x/build/third-party/collection").then(
    (m) => m.Collection
  )
)
const Equation = dynamic(() =>
  import("react-notion-x/build/third-party/equation").then((m) => m.Equation)
)
const Pdf = dynamic(
  () => import("react-notion-x/build/third-party/pdf").then((m) => m.Pdf),
  {
    ssr: false,
  }
)
const Modal = dynamic(
  () => import("react-notion-x/build/third-party/modal").then((m) => m.Modal),
  {
    ssr: false,
  }
)

const mapPageUrl = (id: string) => {
  return "https://www.notion.so/" + id.replace(/-/g, "")
}

type Props = {
  recordMap: ExtendedRecordMap
}

const NotionRenderer: FC<Props> = ({ recordMap }) => {
  const [scheme] = useScheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // SSR 시 light mode 기본값, hydration 후 실제 테마 적용
  // 이렇게 하면 hydration mismatch 방지
  const darkMode = mounted ? scheme === "dark" : false

  return (
    <>
      <Global styles={notionCustomStyles} />
      <div>
        <_NotionRenderer
          darkMode={darkMode}
          recordMap={recordMap}
          components={{
            Code,
            Collection,
            Equation,
            Modal,
            Pdf,
            // nextImage: Image, // Removed for static export
            nextLink: Link,
          }}
          mapPageUrl={mapPageUrl}
        />
      </div>
    </>
  )
}

export default NotionRenderer