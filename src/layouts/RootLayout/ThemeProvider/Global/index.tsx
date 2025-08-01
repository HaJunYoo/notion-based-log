import { Global as _Global, css, useTheme } from "@emotion/react"

import { ThemeProvider as _ThemeProvider } from "@emotion/react"
import { pretendard, notoSerifKR } from "src/assets"
import { typographySystem, fluidTypography } from "src/styles/typography"

export const Global = () => {
  const theme = useTheme()

  return (
    <_Global
      styles={css`
        ${typographySystem}
        ${fluidTypography}
        
        :root {
          --font-sans: ${pretendard.style.fontFamily};
          --font-serif: ${notoSerifKR.style.fontFamily};
        }
        
        body {
          margin: 0;
          padding: 0;
          color: ${theme.colors.gray12};
          background-color: ${theme.colors.gray2};
          font-family: var(--font-sans);
          font-weight: ${pretendard.style.fontWeight};
          font-style: ${pretendard.style.fontStyle};
          font-size: 100%; /* Respect user's browser settings */
        }

        * {
          color-scheme: ${theme.scheme};
          box-sizing: border-box;
        }

        h1,
        h2,
        h3,
        h4,
        h5,
        h6 {
          margin: 0;
          font-weight: inherit;
          font-style: inherit;
        }

        a {
          all: unset;
          cursor: pointer;
        }

        ul {
          padding: 0;
        }

        // init button
        button {
          all: unset;
          cursor: pointer;
        }

        // init input
        input {
          all: unset;
          box-sizing: border-box;
        }

        // init textarea
        textarea {
          border: none;
          background-color: transparent;
          font-family: inherit;
          padding: 0;
          outline: none;
          resize: none;
          color: inherit;
        }

        hr {
          width: 100%;
          border: none;
          margin: 0;
          border-top: 1px solid ${theme.colors.gray6};
        }

        /* Accessibility improvements */
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
            scroll-behavior: auto !important;
          }
        }

        /* Dark mode font adjustments for better readability */
        @media (prefers-color-scheme: dark) {
          body {
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }
        }

        /* High contrast mode support */
        @media (prefers-contrast: high) {
          body {
            font-weight: 500;
          }
        }

        /* Focus visible for keyboard navigation */
        *:focus-visible {
          outline: 2px solid ${theme.colors.blue8};
          outline-offset: 2px;
          border-radius: 2px;
        }
      `}
    />
  )
}
