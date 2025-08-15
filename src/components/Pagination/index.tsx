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
        Prev
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
        Next
      </PageButton>
    </PaginationContainer>
  )
}

export default Pagination

const PaginationContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.0625rem; /* 0.125rem → 0.0625rem로 더 촘촘하게 */
  margin: 1rem 0; /* 1.25rem → 1rem로 더 컴팩트하게 */
  flex-wrap: wrap;
`

const PageButton = styled.button<{ isActive?: boolean }>`
  padding: 0.25rem 0.375rem; /* 0.375rem 0.5rem → 0.25rem 0.375rem로 더 작게 */
  border: none;
  background: ${({ theme, isActive }) =>
    isActive ? theme.colors.gray10 : 'transparent'};
  color: ${({ theme, isActive }) =>
    isActive ? theme.colors.gray1 : theme.colors.gray11};
  border-radius: 0.25rem;
  cursor: pointer;
  font-size: 0.75rem; /* 0.8125rem → 0.75rem로 더 작게 */
  min-width: 1.5rem; /* 1.75rem → 1.5rem로 더 작게 */
  height: 1.5rem; /* 1.75rem → 1.5rem로 더 작게 */
  transition: all 0.15s ease;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover:not(:disabled) {
    background: ${({ theme, isActive }) =>
      isActive ? theme.colors.gray10 : theme.colors.gray2};
  }

  &:active:not(:disabled) {
    transform: scale(0.98);
  }

  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  @media (max-width: 768px) {
    padding: 0.1875rem 0.25rem; /* 더 작게 */
    font-size: 0.6875rem; /* 더 작게 */
    min-width: 1.25rem; /* 더 작게 */
    height: 1.25rem; /* 더 작게 */
  }
`

const Dots = styled.span`
  padding: 0.25rem 0.0625rem; /* 더 작게 */
  color: ${({ theme }) => theme.colors.gray9};
  font-size: 0.75rem; /* 더 작게 */
  display: flex;
  align-items: center;
  justify-content: center;
  height: 1.5rem; /* 더 작게 */
  font-weight: 500;
  
  @media (max-width: 768px) {
    height: 1.25rem; /* 더 작게 */
    font-size: 0.6875rem; /* 더 작게 */
    padding: 0.1875rem 0.0625rem; /* 더 작게 */
  }
`