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
      // 텍스트 잘림 방지를 위한 설정 추가
      themeVariables: {
        fontFamily: 'inherit',
        fontSize: '14px',
        primaryTextColor: isDark ? '#ffffff' : '#333333',
        primaryColor: isDark ? '#1f2937' : '#ffffff',
        primaryBorderColor: isDark ? '#374151' : '#cccccc',
        lineColor: isDark ? '#6b7280' : '#666666',
        textColor: isDark ? '#ffffff' : '#333333',
      },
      // SVG 크기 설정 - 더 큰 값으로 설정
      maxTextSize: 90000,
      maxEdges: 2000,
      // 노드 크기 자동 조정
      flowchart: {
        htmlLabels: true,
        curve: 'basis',
        padding: 15,
      },
      // 시퀀스 다이어그램 설정
      sequence: {
        diagramMarginX: 50,
        diagramMarginY: 10,
        boxTextMargin: 5,
        noteMargin: 10,
        messageMargin: 35,
      },
      // 간트 차트 설정
      gantt: {
        leftPadding: 75,
        gridLineStartPadding: 35,
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
              
              // SVG 텍스트 잘림 방지를 위한 후처리 (캐시된 버전)
              const tempDiv = document.createElement('div')
              tempDiv.innerHTML = svg
              const svgElement = tempDiv.querySelector('svg')
              
              if (svgElement) {
                // viewBox 패딩 추가
                const viewBox = svgElement.getAttribute('viewBox')
                if (viewBox) {
                  const [x, y, width, height] = viewBox.split(' ').map(Number)
                  const padding = 20
                  svgElement.setAttribute('viewBox', `${x - padding} ${y - padding} ${width + padding * 2} ${height + padding * 2}`)
                }
                
                // 모든 텍스트 요소 스타일 강화
                const textElements = svgElement.querySelectorAll('text, tspan, .label')
                textElements.forEach(textEl => {
                  textEl.setAttribute('style', `
                    font-family: inherit !important;
                    font-size: 13px !important;
                    overflow: visible !important;
                    white-space: nowrap !important;
                    ${textEl.getAttribute('style') || ''}
                  `)
                })
              }
              
              element.animate(
                [
                  { easing: "ease-in", opacity: 0 },
                  { easing: "ease-out", opacity: 1 },
                ],
                { duration: 300, fill: "both" }
              )
              element.innerHTML = svgElement ? svgElement.outerHTML : svg
              return
            }
            const svg = await mermaid
              .render("mermaid" + i, element.textContent || "")
              .then((res) => res.svg)
            setMemoMermaid(memoMermaid.set(i, element.textContent ?? ""))
            
            // SVG 텍스트 잘림 방지를 위한 후처리
            const tempDiv = document.createElement('div')
            tempDiv.innerHTML = svg
            const svgElement = tempDiv.querySelector('svg')
            
            if (svgElement) {
              // viewBox 패딩 추가
              const viewBox = svgElement.getAttribute('viewBox')
              if (viewBox) {
                const [x, y, width, height] = viewBox.split(' ').map(Number)
                const padding = 20
                svgElement.setAttribute('viewBox', `${x - padding} ${y - padding} ${width + padding * 2} ${height + padding * 2}`)
              }
              
              // 모든 텍스트 요소 스타일 강화
              const textElements = svgElement.querySelectorAll('text, tspan, .label')
              textElements.forEach(textEl => {
                textEl.setAttribute('style', `
                  font-family: inherit !important;
                  font-size: 13px !important;
                  overflow: visible !important;
                  white-space: nowrap !important;
                  ${textEl.getAttribute('style') || ''}
                `)
              })
              
              element.innerHTML = svgElement.outerHTML
            } else {
              element.innerHTML = svg
            }
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
