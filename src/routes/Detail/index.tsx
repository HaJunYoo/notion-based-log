import useMermaidEffect from "./hooks/useMermaidEffect"
import PostDetail from "./PostDetail"
import PageDetail from "./PageDetail"
import styled from "@emotion/styled"
import usePostQuery from "src/hooks/usePostQuery"

type Props = {}

const Detail: React.FC<Props> = () => {
  const data = usePostQuery()
  useMermaidEffect()

  if (!data) return null
  return (
    <StyledWrapper data-type={data.type}>
      {data.type[0] === "Page" && <PageDetail />}
      {data.type[0] !== "Page" && <PostDetail />}
    </StyledWrapper>
  )
}

export default Detail

const StyledWrapper = styled.div`
  padding: 2rem 0;

  &[data-type="Paper"] {
    padding: 40px 0;
  }
  /** 미니멀한 Mermaid 스타일링 **/
  code[class*="language-mermaid"],
  pre[class*="language-mermaid"] {
    background: ${({ theme }) => theme.colors.gray5};
    padding: 1rem;
    border-radius: 8px;
    overflow-x: auto;
    overflow-y: visible;
    
    svg {
      height: auto;
      display: block;
      margin: 0 auto;
      overflow: visible !important;
      
      /* 텍스트가 잘리지 않도록 */
      text {
        font-family: inherit;
        overflow: visible !important;
      }
      
      /* 노드 라벨 최소 너비 설정 */
      .nodeLabel {
        min-width: 120px !important;
        white-space: normal !important;
        word-wrap: break-word !important;
        text-align: center !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        width: 100% !important;
        height: 100% !important;
        padding: 4px 8px !important;
        box-sizing: border-box !important;
      }
      
      /* 원형 노드 특별 처리 */
      .node circle + g .nodeLabel,
      .node circle ~ g .nodeLabel {
        position: absolute !important;
        top: 50% !important;
        left: 50% !important;
        transform: translate(-50%, -50%) !important;
        width: auto !important;
        height: auto !important;
        max-width: 80% !important;
      }
      
      /* 사각형 노드 라벨 컨테이너 */
      .basic.label-container {
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
      }
      
      /* 엣지 라벨 최소 너비 설정 */
      .edgeLabel {
        min-width: 60px !important;
        white-space: nowrap !important;
      }
      
      foreignObject {
        overflow: visible !important;
        min-width: 100px !important;
        
        div {
          overflow: visible !important;
          white-space: normal !important;
          word-wrap: break-word !important;
          word-break: break-word !important;
          text-align: center !important;
          line-height: 1.2 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          height: 100% !important;
          padding: 4px 8px !important;
        }
      }
    }
  }
`
