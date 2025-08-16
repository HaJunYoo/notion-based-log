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
      
      /* 텍스트 요소 스타일링 - 작은 반응형 폰트 크기 */
      text {
        font-family: inherit !important;
        font-size: clamp(10px, 1.8vw, 12px) !important;
        fill: currentColor !important;
        text-anchor: middle !important; /* 텍스트 중앙 정렬 */
        dominant-baseline: middle !important; /* 수직 중앙 정렬 */
      }
      
      /* 노드 텍스트 크기 조정 - 작은 반응형 */
      .nodeLabel {
        font-size: clamp(9px, 1.6vw, 11px) !important;
        font-weight: 500 !important;
        padding: 4px 8px !important;
        text-align: center !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        white-space: nowrap !important;
        overflow: visible !important;
        width: auto !important;
        min-width: fit-content !important;
      }
      
      .edgeLabel {
        font-size: clamp(8px, 1.4vw, 10px) !important;
        font-weight: 500 !important;
        text-align: center !important;
      }
      
      /* 제목 텍스트 크기 - 작은 반응형 */
      .titleText {
        font-size: clamp(11px, 2.2vw, 14px) !important;
        font-weight: 600 !important;
        text-align: center !important;
      }
      
      /* 플로우차트 노드 스타일링 - 작은 반응형 */
      .flowchart-label {
        font-size: clamp(9px, 1.6vw, 11px) !important;
        padding: 4px 8px !important;
        text-align: center !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        white-space: nowrap !important;
        width: auto !important;
        min-width: fit-content !important;
      }
      
      /* 노드 박스 크기를 텍스트에 맞춰 자동 조정 */
      .node rect,
      .node circle,
      .node ellipse,
      .node polygon {
        width: auto !important;
        height: auto !important;
        min-width: fit-content !important;
        min-height: fit-content !important;
      }
      
      /* foreignObject 내부 요소들 - 텍스트 길이에 맞춘 크기 */
      foreignObject {
        text-align: center !important;
        width: auto !important;
        height: auto !important;
        
        div {
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          text-align: center !important;
          width: auto !important;
          height: auto !important;
          min-width: fit-content !important;
          white-space: nowrap !important;
          padding: 4px 8px !important;
        }
        
        span {
          text-align: center !important;
          display: inline-block !important;
          width: auto !important;
          white-space: nowrap !important;
          font-size: clamp(9px, 1.6vw, 11px) !important;
        }
      }
      
      /* 간트 차트 텍스트 - 작은 반응형 */
      .taskText {
        font-size: clamp(8px, 1.4vw, 10px) !important;
        text-align: center !important;
      }
      
      /* 시퀀스 다이어그램 - 작은 반응형 */
      .messageText {
        font-size: clamp(9px, 1.6vw, 11px) !important;
        text-align: center !important;
      }
      
      /* 라벨 컨테이너 - 텍스트 길이에 맞춘 크기 */
      .label-container {
        text-align: center !important;
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        width: auto !important;
        height: auto !important;
        min-width: fit-content !important;
        min-height: fit-content !important;
      }
      
      /* 클러스터 라벨 - 작은 반응형 */
      .cluster-label {
        text-align: center !important;
        font-size: clamp(9px, 1.6vw, 11px) !important;
      }
    }
  }
  
  /* 모바일에서 Mermaid 다이어그램 최적화 */
  @media (max-width: 768px) {
    code[class*="language-mermaid"],
    pre[class*="language-mermaid"] {
      padding: 0.5rem;
      
      svg {
        /* 모바일에서는 더 작은 폰트 크기 사용 */
        text {
          font-size: clamp(8px, 2.2vw, 10px) !important;
        }
        
        .nodeLabel {
          font-size: clamp(7px, 2vw, 9px) !important;
          padding: 3px 6px !important;
        }
        
        .edgeLabel {
          font-size: clamp(6px, 1.8vw, 8px) !important;
        }
        
        .titleText {
          font-size: clamp(9px, 2.5vw, 12px) !important;
        }
        
        .flowchart-label {
          font-size: clamp(7px, 2vw, 9px) !important;
          padding: 3px 5px !important;
        }
        
        .taskText {
          font-size: clamp(6px, 1.8vw, 8px) !important;
        }
        
        .messageText {
          font-size: clamp(7px, 2vw, 9px) !important;
        }
        
        .cluster-label {
          font-size: clamp(7px, 2vw, 9px) !important;
        }
        
        foreignObject {
          div {
            padding: 3px 6px !important;
          }
          
          span {
            font-size: clamp(7px, 2vw, 9px) !important;
          }
        }
      }
    }
  }
`
