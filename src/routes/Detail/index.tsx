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
      overflow: visible !important;
      
      /* 텍스트 요소 스타일링 - 잘림 방지 */
      text {
        font-family: inherit !important;
        font-size: 12px !important;
        overflow: visible !important;
        white-space: nowrap !important;
      }
      
      /* 노드 텍스트 크기 조정 - 잘림 방지 */
      .nodeLabel {
        font-size: 12px !important;
        font-weight: 500 !important;
        overflow: visible !important;
        white-space: nowrap !important;
        text-overflow: visible !important;
      }
      
      .edgeLabel {
        font-size: 11px !important;
        font-weight: 500 !important;
        overflow: visible !important;
        white-space: nowrap !important;
      }
      
      /* 제목 텍스트 크기 */
      .titleText {
        font-size: 14px !important;
        font-weight: 600 !important;
        overflow: visible !important;
      }
      
      /* 플로우차트 노드 스타일링 */
      .flowchart-label {
        font-size: 12px !important;
        overflow: visible !important;
        white-space: nowrap !important;
      }
      
      /* foreignObject 내부 요소들 잘림 방지 */
      foreignObject {
        overflow: visible !important;
        
        div {
          overflow: visible !important;
          white-space: nowrap !important;
          text-overflow: visible !important;
        }
        
        span {
          overflow: visible !important;
          white-space: nowrap !important;
          text-overflow: visible !important;
        }
      }
      
      /* 간트 차트 텍스트 */
      .taskText {
        font-size: 11px !important;
      }
      
      /* 시퀀스 다이어그램 */
      .messageText {
        font-size: 12px !important;
      }
      
      /* 클러스터 라벨 */
      .cluster-label {
        font-size: 12px !important;
      }
    }
  }
  
  /* 모바일에서 Mermaid 다이어그램 최적화 */
  @media (max-width: 768px) {
    code[class*="language-mermaid"],
    pre[class*="language-mermaid"] {
      padding: 0.5rem;
      
      svg {
        /* 모바일에서는 약간 작은 폰트 크기 사용 */
        text {
          font-size: 10px !important;
        }
        
        .nodeLabel {
          font-size: 10px !important;
        }
        
        .edgeLabel {
          font-size: 9px !important;
        }
        
        .titleText {
          font-size: 12px !important;
        }
        
        .flowchart-label {
          font-size: 10px !important;
        }
        
        .taskText {
          font-size: 9px !important;
        }
        
        .messageText {
          font-size: 10px !important;
        }
        
        .cluster-label {
          font-size: 10px !important;
        }
      }
    }
  }
`
