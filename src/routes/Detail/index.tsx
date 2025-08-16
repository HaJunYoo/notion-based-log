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
  /** Reference: https://github.com/chriskempson/tomorrow-theme **/
  code[class*="language-mermaid"],
  pre[class*="language-mermaid"] {
    background-color: ${({ theme }) => theme.colors.gray5};
    padding: 1rem;
    border-radius: 8px;
    overflow-x: auto;
    overflow-y: visible;
    
    /* Mermaid SVG 스타일링 */
    svg {
      max-width: 100%;
      height: auto;
      display: block;
      margin: 0 auto;
      
      /* 텍스트 요소 스타일링 */
      text {
        font-family: inherit !important;
        font-size: 12px !important;
        fill: currentColor !important;
      }
      
      /* 노드 텍스트 크기 조정 */
      .nodeLabel,
      .edgeLabel {
        font-size: 11px !important;
        font-weight: 500 !important;
      }
      
      /* 제목 텍스트 크기 */
      .titleText {
        font-size: 14px !important;
        font-weight: 600 !important;
      }
      
      /* 노드(박스) 크기 증가 */
      .node rect,
      .node circle,
      .node ellipse,
      .node polygon {
        stroke-width: 2px !important;
        /* 최소 크기 설정 */
        min-width: 120px !important;
        min-height: 50px !important;
      }
      
      /* 노드 내부 패딩 대폭 증가 */
      .nodeLabel {
        padding: 12px 20px !important;
        font-size: 13px !important;
        font-weight: 500 !important;
        min-width: 80px !important;
        min-height: 30px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        text-align: center !important;
      }
      
      /* foreignObject 내부 div 크기 조정 */
      .nodeLabel foreignObject,
      .nodeLabel foreignObject > div {
        min-width: 100px !important;
        min-height: 40px !important;
        padding: 8px 16px !important;
      }
      
      /* 플로우차트 노드 스타일링 */
      .flowchart-label {
        font-size: 13px !important;
        padding: 10px 16px !important;
        min-width: 100px !important;
        min-height: 40px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
      }
      
      /* 노드 텍스트 컨테이너 크기 조정 */
      .label-container {
        min-width: 120px !important;
        min-height: 50px !important;
        padding: 8px 16px !important;
      }
      
      /* 다이어그램 전체 여백 증가 */
      g.root {
        transform: scale(1.1);
        transform-origin: center;
      }
    }
  }
  
  /* 모바일에서 Mermaid 다이어그램 최적화 */
  @media (max-width: 768px) {
    code[class*="language-mermaid"],
    pre[class*="language-mermaid"] {
      padding: 0.5rem;
      
      svg {
        text {
          font-size: 10px !important;
        }
        
        .nodeLabel,
        .edgeLabel {
          font-size: 9px !important;
        }
        
        .titleText {
          font-size: 12px !important;
        }
      }
    }
  }
`
