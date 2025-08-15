import styled from "@emotion/styled"
import React from "react"

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  const getVisiblePages = () => {
    const delta = 2 // 현재 페이지 주변에 보여줄 페이지 수
    const range = []
    const rangeWithDots = []

    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i)
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, "...")
    } else {
      rangeWithDots.push(1)
    }

    rangeWithDots.push(...range)

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push("...", totalPages)
    } else {
      if (totalPages > 1) {
        rangeWithDots.push(totalPages)
      }
    }

    return rangeWithDots.filter((item, index, arr) => arr.indexOf(item) === index)
  }

  if (totalPages <= 1) return null

  const visiblePages = getVisiblePages()

  return (
    <PaginationContainer>
      <PageButton
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        이전
      </PageButton>

      {visiblePages.map((page, index) => (
        <React.Fragment key={index}>
          {page === "..." ? (
            <Dots>...</Dots>
          ) : (
            <PageButton
              onClick={() => onPageChange(page as number)}
              isActive={page === currentPage}
            >
              {page}
            </PageButton>
          )}
        </React.Fragment>
      ))}

      <PageButton
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        다음
      </PageButton>
    </PaginationContainer>
  )
}

export default Pagination

const PaginationContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  margin: 2rem 0;
  flex-wrap: wrap;
`

const PageButton = styled.button<{ isActive?: boolean }>`
  padding: 0.5rem 0.75rem;
  border: 1px solid ${({ theme }) => theme.colors.gray5};
  background: ${({ theme, isActive }) =>
    isActive ? theme.colors.gray10 : theme.colors.gray1};
  color: ${({ theme, isActive }) =>
    isActive ? theme.colors.gray1 : theme.colors.gray10};
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 0.875rem;
  min-width: 2.5rem;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: ${({ theme, isActive }) =>
      isActive ? theme.colors.gray10 : theme.colors.gray3};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  @media (max-width: 768px) {
    padding: 0.375rem 0.5rem;
    font-size: 0.75rem;
    min-width: 2rem;
  }
`

const Dots = styled.span`
  padding: 0.5rem 0.25rem;
  color: ${({ theme }) => theme.colors.gray7};
`
