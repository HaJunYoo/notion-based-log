import { useRouter } from "next/router"
import React from "react"
import { COLOR_SET } from "./constants"
import styled from "@emotion/styled"

export const getColorClassByName = (name: string): string => {
  try {
    let sum = 0
    name.split("").forEach((alphabet) => (sum = sum + alphabet.charCodeAt(0)))
    const colorKey = sum
      .toString(16)
      ?.[sum.toString(16).length - 1].toUpperCase()
    return COLOR_SET[colorKey]
  } catch {
    return COLOR_SET[0]
  }
}

type Props = {
  children: string
  readOnly?: boolean
}

const Category: React.FC<Props> = ({ readOnly = false, children }) => {
  const router = useRouter()

  const handleClick = (value: string) => {
    if (readOnly) return
    router.push(`/?category=${value}`)
  }
  return (
    <StyledWrapper
      onClick={() => handleClick(children)}
      css={{
        backgroundColor: getColorClassByName(children),
        cursor: readOnly ? "default" : "pointer",
      }}
    >
      {children}
    </StyledWrapper>
  )
}

export default Category

const StyledWrapper = styled.div`
  padding-top: 0.125rem;
  padding-bottom: 0.125rem;
  padding-left: 0.25rem;
  padding-right: 0.25rem;
  border-radius: 9999px;
  width: fit-content;
  font-size: 0.625rem;
  line-height: 0.875rem;
  opacity: 0.95;
  color: ${({ theme }) => 
    theme.scheme === "light" ? "rgba(0, 0, 0, 0.8)" : theme.colors.gray1}; /* 라이트 모드에서 어두운 글씨 */
  font-weight: 500; /* 600 → 500으로 덜 볼드하게 */
  text-shadow: ${({ theme }) => 
    theme.scheme === "light" ? "0 0.5px 1px rgba(255, 255, 255, 0.3)" : "none"}; /* 라이트 모드에서 미세한 밝은 섀도우 */

  @media (min-width: 768px) {
    padding-top: 0.2rem;
    padding-bottom: 0.2rem;
    padding-left: 0.4rem;
    padding-right: 0.4rem;
    font-size: 0.75rem;
    line-height: 1rem;
  }
`