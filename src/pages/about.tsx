import { GetStaticProps } from "next"
import { CONFIG } from "site.config"
import MetaConfig from "src/components/MetaConfig"
import { getMarkdownContent } from "src/libs/utils/markdown"
import { NextPageWithLayout } from "../types"
import styled from "@emotion/styled"

interface AboutPageProps {
  content: string
}

const AboutContainer = styled.div`
  max-width: 768px;
  margin: 0 auto;
  padding: 2rem 1rem;
  
  h1 {
    font-size: 1.75rem;
    font-weight: 700;
    margin-bottom: 1.5rem;
    color: var(--colors-gray-12);
  }
  
  h2 {
    font-size: 1.375rem;
    font-weight: 600;
    margin: 1.5rem 0 0.75rem 0;
    color: var(--colors-gray-11);
  }
  
  h3 {
    font-size: 1.125rem;
    font-weight: 600;
    margin: 1.25rem 0 0.5rem 0;
    color: var(--colors-gray-11);
  }
  
  h4 {
    font-size: 1rem;
    font-weight: 600;
    margin: 1rem 0 0.5rem 0;
    color: var(--colors-gray-11);
  }
  
  h5 {
    font-size: 0.875rem;
    font-weight: 600;
    margin: 1rem 0 0.5rem 0;
    color: var(--colors-gray-11);
  }
  
  p {
    line-height: 1.7;
    margin-bottom: 1rem;
    color: var(--colors-gray-10);
  }
  
  ul {
    padding-left: 1.5rem;
    margin-bottom: 1rem;
  }
  
  li {
    margin-bottom: 0.5rem;
    line-height: 1.7;
    color: var(--colors-gray-10);
  }
  
  hr {
    border: none;
    border-top: 1px solid var(--colors-gray-4);
    margin: 2rem 0;
  }
  
  code {
    background: var(--colors-gray-3);
    padding: 0.2rem 0.4rem;
    border-radius: 0.25rem;
    font-size: 0.9em;
    color: var(--colors-gray-12);
  }
  
  strong {
    font-weight: 600;
    color: var(--colors-gray-12);
  }

  blockquote {
    background: transparent;
    border: 1px solid hsl(0, 0%, 30.0%);
    padding: 1rem 1.5rem;
    margin: 1.5rem 0;
    border-radius: 0.5rem;
    
    p {
      margin: 0.5rem 0;
      color: var(--colors-gray-10);
      
      &:first-of-type {
        margin-top: 0;
      }
      
      &:last-of-type {
        margin-bottom: 0;
      }
    }
    
    a {
      color: hsl(206, 100%, 50.0%);
      text-decoration: none;
      
      &:hover {
        text-decoration: underline;
      }
    }
  }
`

export const getStaticProps: GetStaticProps = async () => {
  try {
    const content = await getMarkdownContent('about')
    
    return {
      props: {
        content,
      },
      revalidate: CONFIG.revalidateTime,
    }
  } catch (error) {
    return {
      notFound: true,
    }
  }
}

const AboutPage: NextPageWithLayout<AboutPageProps> = ({ content }) => {
  const meta = {
    title: "About",
    description: "About page",
    type: "Page",
    url: `${CONFIG.link}/about`,
  }

  return (
    <>
      <MetaConfig {...meta} />
      <AboutContainer>
        <div dangerouslySetInnerHTML={{ __html: content }} />
      </AboutContainer>
    </>
  )
}

AboutPage.getLayout = (page) => {
  return <>{page}</>
}

export default AboutPage