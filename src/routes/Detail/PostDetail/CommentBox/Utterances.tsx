import { CONFIG } from "site.config"
import { useEffect } from "react"
import styled from "@emotion/styled"
import useScheme from "src/hooks/useScheme"
//TODO: useRef?

type Props = {
  issueTerm: string
}

const Utterances: React.FC<Props> = ({ issueTerm }) => {
  const [scheme] = useScheme()

  useEffect(() => {
    const theme = `github-${scheme}`
    const anchor = document.getElementById("comments")
    if (!anchor) return
    
    // utterances script가 이미 있는지 확인
    if (anchor.querySelector('script[src*="utteranc.es"]')) return

    const script = document.createElement("script")
    script.setAttribute("src", "https://utteranc.es/client.js")
    script.setAttribute("repo", CONFIG.utterances.config.repo)
    script.setAttribute("crossorigin", "anonymous")
    script.setAttribute("async", `true`)
    script.setAttribute("issue-term", issueTerm)
    script.setAttribute("theme", theme)
    const config: Record<string, string> = CONFIG.utterances.config
    Object.keys(config).forEach((key) => {
      if (key !== "repo") { // repo는 이미 설정했으므로 중복 방지
        script.setAttribute(key, config[key])
      }
    })
    
    anchor.appendChild(script)
    
    return () => {
      if (anchor && anchor.parentNode) {
        anchor.innerHTML = ""
      }
    }
  }, [scheme, issueTerm])
  return (
    <>
      <StyledWrapper id="comments" />
    </>
  )
}

export default Utterances

const StyledWrapper = styled.div`
  @media (min-width: 768px) {
    margin-left: -4rem;
  }
`
