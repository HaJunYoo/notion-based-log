import styled from "@emotion/styled"
import { useRouter } from "next/router"
import React from "react"

type TOrder = "asc" | "desc"

type Props = {}

const OrderButtons: React.FC<Props> = () => {
  const router = useRouter()

  const currentOrder = `${router.query.order || ``}` || ("desc" as TOrder)

  const handleClickOrderBy = (value: TOrder) => {
    router.push({
      query: {
        ...router.query,
        order: value,
      },
    })
  }
  return (
    <StyledWrapper>
      <a
        data-active={currentOrder === "desc"}
        onClick={() => handleClickOrderBy("desc")}
      >
        Desc
      </a>
      <a
        data-active={currentOrder === "asc"}
        onClick={() => handleClickOrderBy("asc")}
      >
        Asc
      </a>
    </StyledWrapper>
  )
}

export default OrderButtons

const StyledWrapper = styled.div`
  display: flex;
  gap: 0.5rem;
  font-size: 0.875rem;
  line-height: 1.25rem;
  flex-shrink: 0;
  
  @media (max-width: 480px) {
    justify-content: center;
    gap: 0.5rem;
    font-size: 0.75rem;
  }
  
  a {
    cursor: pointer;
    color: ${({ theme }) => theme.colors.gray10};
    padding: 0.25rem 0.5rem;
    border-radius: 0.5rem;
    transition: background-color 0.2s ease;

    &[data-active="true"] {
      font-weight: 700;
      color: ${({ theme }) => theme.colors.gray12};
      background-color: ${({ theme }) => theme.colors.gray4};
    }
    
    :hover {
      background-color: ${({ theme }) => theme.colors.gray3};
    }
    
    @media (max-width: 480px) {
      padding: 0.125rem 0.5rem;
      font-weight: 500;
      font-size: 0.75rem;
    }
  }
`
