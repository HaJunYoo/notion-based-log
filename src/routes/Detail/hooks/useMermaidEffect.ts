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
        // 노드 크기 증가 설정
        nodeBorder: '2px',
        nodeTextSize: '16px',
        // 다이어그램 여백 증가
        primaryBorderWidth: '2px',
        primaryBorderRadius: '8px',
        // 노드 박스 크기 증가
        nodeWidth: '150px',
        nodeHeight: '60px',
        nodePadding: '15px',
        // 플로우차트 노드 여백
        flowchartNodePadding: '20px',
      },
      // SVG 크기 설정 - 더 큰 값으로 설정
      maxTextSize: 90000,
      maxEdges: 2000,
      // 노드 크기 자동 조정
      flowchart: {
        htmlLabels: true,
        curve: 'basis',
        padding: 35,
        nodeSpacing: 80,
        rankSpacing: 100,
        defaultRenderer: 'elk',
        // 노드 내부 여백 증가
        nodePadding: 20,
        labelOffset: 15,
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
                // viewBox 패딩을 더 크게 설정
                const viewBox = svgElement.getAttribute('viewBox')
                if (viewBox) {
                  const [x, y, width, height] = viewBox.split(' ').map(Number)
                  const padding = 50 // 20에서 50으로 증가
                  svgElement.setAttribute('viewBox', `${x - padding} ${y - padding} ${width + padding * 2} ${height + padding * 2}`)
                }
                
                // SVG 자체 크기 속성 제거하여 반응형으로 만들기
                svgElement.removeAttribute('width')
                svgElement.removeAttribute('height')
                svgElement.setAttribute('width', '100%')
                svgElement.setAttribute('height', 'auto')
                
                // 모든 텍스트 요소 강화 (더 많은 선택자 포함)
                const textSelectors = [
                  'text', 'tspan', '.label', '.nodeLabel', '.edgeLabel', 
                  'foreignObject', 'div', 'span', '.cluster-label',
                  '.flowchart-label', '.titleText'
                ]
                
                textSelectors.forEach(selector => {
                  const elements = svgElement.querySelectorAll(selector)
                  elements.forEach(textEl => {
                    // 기존 스타일 보존하면서 오버플로우 관련 스타일 추가
                    const currentStyle = textEl.getAttribute('style') || ''
                    textEl.setAttribute('style', `
                      ${currentStyle}
                      overflow: visible !important;
                      text-overflow: visible !important;
                      white-space: nowrap !important;
                      max-width: none !important;
                      width: auto !important;
                    `)
                    
                    // foreignObject의 경우 크기 제한 제거
                    if (textEl.tagName === 'foreignObject') {
                      textEl.removeAttribute('width')
                      textEl.removeAttribute('height')
                      textEl.setAttribute('width', 'auto')
                      textEl.setAttribute('height', 'auto')
                    }
                  })
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
              // viewBox 패딩을 더 크게 설정
              const viewBox = svgElement.getAttribute('viewBox')
              if (viewBox) {
                const [x, y, width, height] = viewBox.split(' ').map(Number)
                const padding = 50 // 20에서 50으로 증가
                svgElement.setAttribute('viewBox', `${x - padding} ${y - padding} ${width + padding * 2} ${height + padding * 2}`)
              }
              
              // SVG 자체 크기 속성 제거하여 반응형으로 만들기
              svgElement.removeAttribute('width')
              svgElement.removeAttribute('height')
              svgElement.setAttribute('width', '100%')
              svgElement.setAttribute('height', 'auto')
              
              // 모든 텍스트 요소 강화 (더 많은 선택자 포함)
              const textSelectors = [
                'text', 'tspan', '.label', '.nodeLabel', '.edgeLabel', 
                'foreignObject', 'div', 'span', '.cluster-label',
                '.flowchart-label', '.titleText'
              ]
              
              textSelectors.forEach(selector => {
                const elements = svgElement.querySelectorAll(selector)
                elements.forEach(textEl => {
                  // 기존 스타일 보존하면서 오버플로우 관련 스타일 추가
                  const currentStyle = textEl.getAttribute('style') || ''
                  textEl.setAttribute('style', `
                    ${currentStyle}
                    overflow: visible !important;
                    text-overflow: visible !important;
                    white-space: nowrap !important;
                    max-width: none !important;
                    width: auto !important;
                  `)
                  
                  // foreignObject의 경우 크기 제한 제거
                  if (textEl.tagName === 'foreignObject') {
                    textEl.removeAttribute('width')
                    textEl.removeAttribute('height')
                    textEl.setAttribute('width', 'auto')
                    textEl.setAttribute('height', 'auto')
                  }
                })
              })
              
              // 노드 박스 크기 증가 처리
              const nodeShapes = svgElement.querySelectorAll('.node rect, .node circle, .node ellipse, .node polygon')
              nodeShapes.forEach(shape => {
                // 기존 크기 가져오기
                const currentWidth = parseFloat(shape.getAttribute('width') || '100')
                const currentHeight = parseFloat(shape.getAttribute('height') || '50')
                
                // 최소 크기 보장 및 크기 증가
                const newWidth = Math.max(currentWidth * 1.3, 120)
                const newHeight = Math.max(currentHeight * 1.2, 50)
                
                if (shape.tagName === 'rect') {
                  shape.setAttribute('width', newWidth.toString())
                  shape.setAttribute('height', newHeight.toString())
                } else if (shape.tagName === 'circle') {
                  const radius = Math.max(newWidth, newHeight) / 2
                  shape.setAttribute('r', radius.toString())
                } else if (shape.tagName === 'ellipse') {
                  shape.setAttribute('rx', (newWidth / 2).toString())
                  shape.setAttribute('ry', (newHeight / 2).toString())
                }
              })
              
              // 노드 라벨 컨테이너 크기 조정
              const labelContainers = svgElement.querySelectorAll('.label-container, .nodeLabel')
              labelContainers.forEach(container => {
                const currentWidth = parseFloat(container.getAttribute('width') || '80')
                const currentHeight = parseFloat(container.getAttribute('height') || '30')
                
                const newWidth = Math.max(currentWidth * 1.2, 100)
                const newHeight = Math.max(currentHeight * 1.2, 40)
                
                container.setAttribute('width', newWidth.toString())
                container.setAttribute('height', newHeight.toString())
                container.setAttribute('style', `
                  ${container.getAttribute('style') || ''}
                  min-width: ${newWidth}px !important;
                  min-height: ${newHeight}px !important;
                  padding: 8px 16px !important;
                `)
                })
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
