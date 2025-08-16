import { useQuery, useQueryClient } from "@tanstack/react-query"
import mermaid from "mermaid"
import { useEffect, useState } from "react"
import { queryKey } from "src/constants/queryKey"
import useScheme from "src/hooks/useScheme"

/**
 *  Wait for mermaid to be defined in the dom
 *  Additionally, verify that the HTML CollectionOf has an array value.
 */
const waitForMermaid = (interval = 100, timeout = 5000) => {
  return new Promise<HTMLCollectionOf<Element>>((resolve, reject) => {
    const startTime = Date.now()
    const elements: HTMLCollectionOf<Element> =
      document.getElementsByClassName("language-mermaid")

    const checkMerMaidCode = () => {
      if (mermaid.render !== undefined && elements.length > 0) {
        resolve(elements)
      } else if (Date.now() - startTime >= timeout) {
        reject(new Error(`mermaid is not defined within the timeout period.`))
      } else {
        setTimeout(checkMerMaidCode, interval)
      }
    }
    checkMerMaidCode()
  })
}
const useMermaidEffect = () => {
  const [memoMermaid, setMemoMermaid] = useState<Map<number, string>>(new Map())

  const { data, isFetched } = useQuery({
    queryKey: queryKey.scheme(),
    enabled: false,
  })

  useEffect(() => {
    if (!isFetched) return
    const isDark = (data as "dark" | "light") === "dark"
    
    mermaid.initialize({
      startOnLoad: true,
      theme: isDark ? "dark" : "default",
      themeVariables: {
        fontFamily: 'inherit',
        fontSize: '12px',
        primaryTextColor: isDark ? '#ffffff' : '#333333',
        primaryColor: isDark ? '#1f2937' : '#ffffff',
        primaryBorderColor: isDark ? '#374151' : '#cccccc',
        lineColor: isDark ? '#6b7280' : '#666666',
        textColor: isDark ? '#ffffff' : '#333333',
      },
      // 텍스트 잘림 방지를 위한 설정
      maxTextSize: 90000,
      maxEdges: 2000,
      wrap: false,
      flowchart: {
        htmlLabels: true,
        curve: 'basis',
        padding: 30, // 패딩 증가로 텍스트 잘림 방지
        nodeSpacing: 60,
        rankSpacing: 60,
        useMaxWidth: false, // 최대 너비 제한 해제
      },
      sequence: {
        diagramMarginX: 60, // 여백 증가
        diagramMarginY: 20,
        boxTextMargin: 10,
        noteMargin: 15,
        messageMargin: 40,
        useMaxWidth: false,
      },
      gantt: {
        leftPadding: 100, // 왼쪽 패딩 증가
        gridLineStartPadding: 50,
        useMaxWidth: false,
      },
    })

    if (!document) return

    waitForMermaid()
      .then(async (elements) => {
        const promises = Array.from(elements)
          .filter((elements) => elements.tagName === "PRE")
          .map(async (element, i) => {
            if (memoMermaid.get(i) !== undefined) {
              const svg = await mermaid
                .render("mermaid" + i, memoMermaid.get(i) || "")
                .then((res) => res.svg)
              
                              element.animate(
                  [
                    { easing: "ease-in", opacity: 0 },
                    { easing: "ease-out", opacity: 1 },
                  ],
                  { duration: 300, fill: "both" }
                )
                element.innerHTML = svg
              return
            }
            const svg = await mermaid
              .render("mermaid" + i, element.textContent || "")
              .then((res) => res.svg)
            setMemoMermaid(memoMermaid.set(i, element.textContent ?? ""))
            
            element.innerHTML = svg
          })
        await Promise.all(promises)
      })
      .catch((error) => {
        console.warn(error)
      })
  }, [data, isFetched])

  return
}

export default useMermaidEffect
