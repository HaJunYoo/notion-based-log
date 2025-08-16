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
      
      /* 텍스트 요소 스타일링 - 반응형 폰트 크기 */
      text {
        font-family: inherit !important;
        font-size: clamp(12px, 2.5vw, 16px) !important;
        fill: currentColor !important;
        text-anchor: middle !important; /* 텍스트 중앙 정렬 */
        dominant-baseline: middle !important; /* 수직 중앙 정렬 */
      }
      
      /* 노드 텍스트 크기 조정 - 반응형 */
      .nodeLabel {
        font-size: clamp(11px, 2.2vw, 14px) !important;
        font-weight: 500 !important;
        padding: 8px 12px !important;
        text-align: center !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
      }
      
      .edgeLabel {
        font-size: clamp(10px, 2vw, 12px) !important;
        font-weight: 500 !important;
        text-align: center !important;
      }
      
      /* 제목 텍스트 크기 - 반응형 */
      .titleText {
        font-size: clamp(14px, 3vw, 18px) !important;
        font-weight: 600 !important;
        text-align: center !important;
      }
      
      /* 플로우차트 노드 스타일링 - 반응형 */
      .flowchart-label {
        font-size: clamp(11px, 2.2vw, 14px) !important;
        padding: 6px 10px !important;
        text-align: center !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
      }
      
      /* foreignObject 내부 요소들 중앙 정렬 */
      foreignObject {
        text-align: center !important;
        
        div {
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          text-align: center !important;
          width: 100% !important;
          height: 100% !important;
        }
        
        span {
          text-align: center !important;
          display: block !important;
          width: 100% !important;
        }
      }
      
      /* 간트 차트 텍스트 - 반응형 */
      .taskText {
        font-size: clamp(10px, 2vw, 13px) !important;
        text-align: center !important;
      }
      
      /* 시퀀스 다이어그램 - 반응형 */
      .messageText {
        font-size: clamp(11px, 2.2vw, 14px) !important;
        text-align: center !important;
      }
      
      /* 라벨 컨테이너 중앙 정렬 */
      .label-container {
        text-align: center !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
      }
      
      /* 클러스터 라벨 중앙 정렬 */
      .cluster-label {
        text-align: center !important;
        font-size: clamp(11px, 2.2vw, 14px) !important;
      }
    }
  }
  
  /* 모바일에서 Mermaid 다이어그램 최적화 */
  @media (max-width: 768px) {
    code[class*="language-mermaid"],
    pre[class*="language-mermaid"] {
      padding: 0.5rem;
      
      svg {
        /* 모바일에서는 clamp의 최소값을 더 작게 설정 */
        text {
          font-size: clamp(10px, 3vw, 14px) !important;
        }
        
        .nodeLabel {
          font-size: clamp(9px, 2.8vw, 12px) !important;
          padding: 6px 8px !important;
        }
        
        .edgeLabel {
          font-size: clamp(8px, 2.5vw, 10px) !important;
        }
        
        .titleText {
          font-size: clamp(12px, 3.5vw, 16px) !important;
        }
        
        .flowchart-label {
          font-size: clamp(9px, 2.8vw, 12px) !important;
          padding: 4px 6px !important;
        }
        
        .taskText {
          font-size: clamp(8px, 2.5vw, 11px) !important;
        }
        
        .messageText {
          font-size: clamp(9px, 2.8vw, 12px) !important;
        }
        
        .cluster-label {
          font-size: clamp(9px, 2.8vw, 12px) !important;
        }
      }
    }
  }
`
