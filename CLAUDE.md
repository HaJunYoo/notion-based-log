# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **notion-based-log**, a Next.js static blog that uses Notion as a Content Management System (CMS). The blog supports both standard blog posts and full pages (like resumes), with automatic content synchronization from Notion.

## Development Commands

- `yarn dev` - Start development server
- `yarn build` - Build for production
- `yarn start` - Start production server
- `yarn lint` - Run ESLint
- `yarn postbuild` - Generate sitemap (runs automatically after build)

## Architecture

### Core Structure
- **Next.js 13** with App Router patterns
- **Notion Integration**: Uses `notion-client`, `notion-types`, and `notion-utils` for content fetching
- **React Query** (`@tanstack/react-query`) for data fetching and caching
- **Emotion** for CSS-in-JS styling
- **TypeScript** for type safety

### Key Directories
- `src/pages/` - Next.js pages and API routes
- `src/routes/` - Main route components (Feed, Detail, Categories, Tags, Error)
- `src/components/` - Reusable UI components
- `src/apis/notion-client/` - Notion API integration
- `src/libs/utils/notion/` - Notion data processing utilities
- `src/hooks/` - Custom React hooks for data fetching and UI logic
- `src/layouts/RootLayout/` - App-wide layout components

### Configuration
- `site.config.js` - Main configuration file for blog settings, profile info, and plugin configuration
- Environment variables required:
  - `NOTION_PAGE_ID` (required)
  - `NEXT_PUBLIC_GOOGLE_MEASUREMENT_ID` (optional)
  - `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` (optional)
  - `NEXT_PUBLIC_UTTERANCES_REPO` (optional)

### Data Flow
1. Notion content is fetched via `src/apis/notion-client/`
2. Posts are processed and filtered in `src/libs/utils/notion/`
3. React Query hooks in `src/hooks/` manage data fetching and caching
4. Route components in `src/routes/` render the UI
5. Revalidation occurs every 21600 * 7 seconds (configured in site.config.js)

### Styling System
- Uses Emotion with a custom theme system
- Color definitions in `src/styles/colors.ts`
- Theme switching support (light/dark/system)
- Responsive design with media queries in `src/styles/media.ts`

### Content Rendering
- Uses `react-notion-x` for rendering Notion content
- Custom NotionRenderer component handles specific styling
- Supports Mermaid diagrams, syntax highlighting, and custom blocks
- Custom image URL mapping for optimized loading

## Task Master AI Instructions
**Import Task Master's development workflow commands and guidelines, treat as if import is in the main CLAUDE.md file.**
@./.taskmaster/CLAUDE.md
