import { css } from '@emotion/react'

export const typographySystem = css`
  /* Typography Scale Variables */
  :root {
    /* Font Scale - Perfect Fourth (1.333) */
    --font-scale-ratio: 1.333;
    --font-base: clamp(0.875rem, 2.2vw, 1rem);
    --font-xs: calc(var(--font-base) / var(--font-scale-ratio) / var(--font-scale-ratio));
    --font-sm: calc(var(--font-base) / var(--font-scale-ratio));
    --font-md: var(--font-base);
    --font-lg: calc(var(--font-base) * var(--font-scale-ratio));
    --font-xl: calc(var(--font-lg) * var(--font-scale-ratio));
    --font-2xl: calc(var(--font-xl) * var(--font-scale-ratio));
    --font-3xl: calc(var(--font-2xl) * var(--font-scale-ratio));

    /* Line Height System */
    --line-height-tight: 1.25;   /* Headings */
    --line-height-normal: 1.6;   /* Body text */
    --line-height-relaxed: 1.75; /* Long-form content */

    /* Letter Spacing */
    --letter-spacing-tight: -0.025em;
    --letter-spacing-normal: 0;
    --letter-spacing-wide: 0.025em;

    /* Font Weights */
    --font-weight-normal: 400;
    --font-weight-medium: 500;
    --font-weight-semibold: 600;
    --font-weight-bold: 700;
  }

  /* Dark mode adjustments */
  @media (prefers-color-scheme: dark) {
    :root {
      --font-weight-normal: 300;
      --font-weight-medium: 400;
      --font-weight-semibold: 500;
      --font-weight-bold: 600;
      --letter-spacing-normal: 0.01em;
    }
  }

  /* High contrast mode */
  @media (prefers-contrast: high) {
    :root {
      --font-weight-normal: 500;
      --font-weight-medium: 600;
      --font-weight-semibold: 700;
      --font-weight-bold: 800;
    }
  }
`

export const fluidTypography = css`
  /* Heading Styles */
  .typography-h1 {
    font-size: var(--font-3xl);
    line-height: var(--line-height-tight);
    font-weight: var(--font-weight-bold);
    letter-spacing: var(--letter-spacing-tight);
    margin-top: clamp(1.5rem, 4vw, 2.5rem);
    margin-bottom: clamp(0.75rem, 2vw, 1.25rem);
  }

  .typography-h2 {
    font-size: var(--font-2xl);
    line-height: var(--line-height-tight);
    font-weight: var(--font-weight-bold);
    letter-spacing: var(--letter-spacing-tight);
    margin-top: clamp(1.25rem, 3vw, 2rem);
    margin-bottom: clamp(0.625rem, 1.5vw, 1rem);
  }

  .typography-h3 {
    font-size: var(--font-xl);
    line-height: var(--line-height-tight);
    font-weight: var(--font-weight-semibold);
    letter-spacing: var(--letter-spacing-tight);
    margin-top: clamp(1rem, 2.5vw, 1.75rem);
    margin-bottom: clamp(0.5rem, 1.25vw, 0.875rem);
  }

  /* Body Text Styles */
  .typography-body {
    font-size: var(--font-md);
    line-height: var(--line-height-normal);
    font-weight: var(--font-weight-normal);
    letter-spacing: var(--letter-spacing-normal);
  }

  .typography-body-large {
    font-size: var(--font-lg);
    line-height: var(--line-height-relaxed);
    font-weight: var(--font-weight-normal);
    letter-spacing: var(--letter-spacing-normal);
  }

  .typography-small {
    font-size: var(--font-sm);
    line-height: var(--line-height-normal);
    font-weight: var(--font-weight-normal);
    letter-spacing: var(--letter-spacing-wide);
  }

  .typography-caption {
    font-size: var(--font-xs);
    line-height: var(--line-height-normal);
    font-weight: var(--font-weight-medium);
    letter-spacing: var(--letter-spacing-wide);
  }
`