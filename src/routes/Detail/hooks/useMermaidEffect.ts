import { useQuery } from "@tanstack/react-query"
import mermaid from "mermaid"
import { useEffect, useState } from "react"
import { queryKey } from "src/constants/queryKey"

/**
 *  Wait for mermaid to be defined in the dom
 *  Additionally, verify that the HTML CollectionOf has an array value.
 */
const waitForMermaid = (interval = 100, timeout = 10000) => {
  return new Promise<Element[]>((resolve, reject) => {
    const startTime = Date.now()
    
    const checkMerMaidCode = () => {
      // DOM이 완전히 로드될 때까지 대기
      if (document.readyState !== 'complete') {
        setTimeout(checkMerMaidCode, interval)
        return
      }
      
      const elements1 = Array.from(document.getElementsByClassName("language-mermaid"))
      const elements2 = Array.from(document.querySelectorAll(".notion-code.language-mermaid"))
      const allElements = [...elements1, ...elements2]
      
      // Mermaid와 요소 모두 준비되었는지 확인
      if (typeof mermaid !== 'undefined' && 
          mermaid.render !== undefined && 
          allElements.length > 0) {
        resolve(allElements)
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
    
    // DOM이 완전히 준비될 때까지 대기
    const timeoutId = setTimeout(() => {
      mermaid.initialize({
      startOnLoad: true,
      theme: isDark ? "dark" : "default",
      themeVariables: {
        fontFamily: 'inherit',
        fontSize: '10px',
      },
      maxTextSize: 90000,
      flowchart: {
        useMaxWidth: false,
        htmlLabels: true,
        padding: 30,
        nodeSpacing: 60,
        rankSpacing: 70,
        wrappingWidth: 400,
      },
      sequence: {
        useMaxWidth: false,
        diagramMarginX: 20,
        diagramMarginY: 20,
      },
      gantt: {
        useMaxWidth: false,
        leftPadding: 100,
      },
    })

    if (!document) return

    waitForMermaid()
      .then(async (elements) => {
        const promises = elements
          .filter((element) => element.tagName === "PRE" || element.classList.contains("notion-code"))
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
        console.warn('Mermaid render failed, retrying...', error)
        // 한 번 더 시도
        setTimeout(() => {
          waitForMermaid(200, 5000)
            .then(async (elements) => {
              const promises = elements
                .filter((element) => element.tagName === "PRE" || element.classList.contains("notion-code"))
                .map(async (element, i) => {
                  const svg = await mermaid
                    .render("mermaid-retry" + i, element.textContent || "")
                    .then((res) => res.svg)
                  element.innerHTML = svg
                })
              await Promise.all(promises)
            })
            .catch(() => console.warn('Mermaid retry failed'))
        }, 1000)
      })
    }, 500) // 500ms 지연

    return () => {
      clearTimeout(timeoutId)
    }
  }, [data, isFetched, memoMermaid])

  return
}

export default useMermaidEffect
