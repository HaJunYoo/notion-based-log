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
- **Supabase Integration**: PostgreSQL database for posts, tasks, and analytics via `@supabase/supabase-js`
- **React Query** (`@tanstack/react-query`) for data fetching and caching
- **Emotion** for CSS-in-JS styling
- **TypeScript** for type safety

### Key Directories
- `src/pages/` - Next.js pages and API routes
- `src/routes/` - Main route components (Feed, Detail, Categories, Tags, Error)
- `src/components/` - Reusable UI components
- `src/apis/notion-client/` - Notion API integration
- `src/libs/utils/notion/` - Notion data processing utilities
- `src/libs/supabase/` - Supabase client configuration and database utilities
- `src/hooks/` - Custom React hooks for data fetching and UI logic
- `src/layouts/RootLayout/` - App-wide layout components
- `supabase/` - Database schema and migration files

### Configuration
- `site.config.js` - Main configuration file for blog settings, profile info, and plugin configuration
- Environment variables required:
  - `NOTION_PAGE_ID` (required)
  - `SUPABASE_URL` (required for database integration)
  - `SUPABASE_ANON_KEY` (required for database integration)
  - `NEXT_PUBLIC_GOOGLE_MEASUREMENT_ID` (optional)
  - `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` (optional)
  - `NEXT_PUBLIC_UTTERANCES_REPO` (optional)

### Environment Management
- **Development**: Use `.env.local` for local development environment variables
- **Production**: Deploy to **Vercel** with environment variables configured in Vercel dashboard
- Never commit sensitive environment variables to repository

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

## Task Management Workflow

### Task Completion and Verification Protocol

When starting any new task, **ALWAYS** follow this verification protocol:

1. **Check Current Task Status**: Use Task Master AI MCP to verify what task is currently in progress
2. **Verify Completion**: Before starting a new task, ask the user if the current task is complete:
   - "Is the current task [task name/ID] fully implemented and tested?"
   - Confirm that code implementation is complete
   - Confirm that testing has been done
3. **Auto-commit Completed Work**: If user confirms completion:
   - Generate descriptive commit message automatically based on task details
   - Run `git add .` and `git commit` with the generated message
   - Update task status to 'done' using Task Master AI MCP
4. **Start Next Task**: Proceed to get and start the next available task

### Task Management Commands (via MCP)
- Always use Task Master AI MCP tools for task management
- Use `mcp__task-master-ai__get_task` to check current task details
- Use `mcp__task-master-ai__set_task_status` to update task completion
- Use `mcp__task-master-ai__next_task` to get the next available task
- Use `mcp__task-master-ai__update_subtask` to log progress during implementation

### Commit Message Format
Auto-generate commit messages using this pattern:
```
<type>: <task-description> (task <task-id>)

- <key implementation details>
- <testing completed>
```

Example:
```
feat: implement Supabase client configuration (task 2)

- Added Supabase client with connection pooling
- Configured environment variables
- Added error handling and retry logic
- Unit tests completed
```

### Required Verification Before Task Transition
**NEVER** start a new task without:
1. Asking user to confirm current task completion
2. Verifying code implementation is done
3. Verifying testing is complete
4. Auto-committing the completed work
5. Updating task status to 'done'

### Branch Management
- Create feature branches for new tasks: `git checkout -b feature/task-description`
- Use descriptive branch names that match the task being implemented
- Always work on feature branches, never directly on main
- Merge to main only after task completion and testing

## Task Master AI Instructions
**Import Task Master's development workflow commands and guidelines, treat as if import is in the main CLAUDE.md file.**
@./.taskmaster/CLAUDE.md
