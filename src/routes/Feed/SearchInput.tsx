import styled from "@emotion/styled"
import React, { InputHTMLAttributes, ReactNode } from "react"
import { Emoji } from "src/components/Emoji"

interface Props extends InputHTMLAttributes<HTMLInputElement> {}

const SearchInput: React.FC<Props> = ({ ...props }) => {
  return (
    <StyledWrapper>
      <div className="top">
        <Emoji>🔎</Emoji> Search
      </div>
      <input
        className="mid"
        type="text"
        placeholder="Search Keyword..."
        {...props}
      />
    </StyledWrapper>
  )
}

export default SearchInput

const StyledWrapper = styled.div`
  margin-bottom: 0.75rem;

  @media (min-width: 768px) {
    margin-bottom: 2rem;
  }
  
  > .top {
    padding: 0.125rem;
    margin-bottom: 0.5rem;
    font-size: 0.875rem;

    @media (min-width: 768px) {
      padding: 0.25rem;
      margin-bottom: 0.75rem;
      font-size: 1rem;
    }
  }
  
  > .mid {
    padding-top: 0.375rem;
    padding-bottom: 0.375rem;
    padding-left: 0.875rem;
    padding-right: 0.875rem;
    border-radius: 0.75rem;
    outline-style: none;
    width: 100%;
    background-color: ${({ theme }) => theme.colors.gray4};
    font-size: 0.875rem;

    @media (min-width: 768px) {
      padding-top: 0.5rem;
      padding-bottom: 0.5rem;
      padding-left: 1.25rem;
      padding-right: 1.25rem;
      border-radius: 1rem;
      font-size: 1rem;
    }
  }
`
