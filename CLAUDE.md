# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **notion-based-log**, a fully static Next.js blog that uses Notion as a Content Management System (CMS). The blog supports both standard blog posts and full pages (like resumes), with automatic content synchronization from Notion. All pages are pre-generated at build time for optimal performance and SEO.

## Development Commands

- `yarn dev` - Start development server
- `yarn build` - Build for production (static export to `out/` directory)
- `yarn start` - Start production server (development only)
- `yarn lint` - Run ESLint
- `yarn postbuild` - Generate sitemap and RSS feed (runs automatically after build)
- `npx serve out` - Serve static build locally for testing

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
- Environment variables in `.env.local`:
  - `NOTION_PAGE_ID` (required) - Notion page ID for content source
  - `SUPABASE_URL` (required) - Supabase project URL for database integration
  - `SUPABASE_ANON_KEY` (required) - Anonymous key for client-side operations
  - `SUPABASE_SERVICE_ROLE_KEY` (optional) - Service role key for admin operations
  - `NEXT_PUBLIC_GOOGLE_MEASUREMENT_ID` (optional) - Google Analytics tracking ID
  - `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` (optional) - Google Search Console verification
  - `NEXT_PUBLIC_UTTERANCES_REPO` (required for comments) - GitHub repo for Utterances comments
  - `SYNC_API_SECRET` (optional) - API secret for sync operations
  - `REVALIDATION_SECRET` (optional) - Secret for ISR revalidation
  - `SYNC_WEBHOOK_SECRET` (optional) - Webhook secret for content sync
  - `TOKEN_FOR_REVALIDATE` (optional) - Token for revalidation endpoints

### Environment Management
- **Development**: Use `.env.local` for local development environment variables
- **Production**: Deploy as static export to **Cloudflare Pages** with environment variables configured in dashboard
- **Static Export**: All pages are pre-built as HTML files in the `out/` directory during build process
- **Build-time Variables**: All `NEXT_PUBLIC_*` variables are injected at build time and included in static files
- Never commit sensitive environment variables to repository
- Use `npx serve out` to test static build locally with all environment variables properly injected

### Data Flow
1. Notion content is fetched via `src/apis/notion-client/` during build time
2. Posts are processed and filtered in `src/libs/utils/notion/`
3. React Query hooks in `src/hooks/` manage data fetching and caching
4. Route components in `src/routes/` render the UI
5. Static pages are pre-generated with all content at build time

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
- Canonical URLs standardized with trailing slashes to match sitemap format

### Comments System
- **Utterances Integration**: GitHub Issues-based commenting system
- **Configuration**: Set `NEXT_PUBLIC_UTTERANCES_REPO` in `.env.local`
- **Implementation**: Located in `src/routes/Detail/PostDetail/CommentBox/Utterances.tsx`
- **Issue Fixed**: Removed `hasChildNodes()` condition that was blocking script injection
- **Current Status**: Comments working properly on both development and static builds

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

**IMPORTANT: 모든 신규 작업은 반드시 새로운 브랜치에서 진행해야 합니다.**

#### Branch Creation Rules
1. **신규 작업 시작 전**: 반드시 새로운 브랜치를 생성
2. **브랜치 생성 명령**: `git checkout -b <type>/<description>`
3. **현재 브랜치에서 직접 작업 금지**: main 또는 다른 기존 브랜치에서 직접 코드 수정하지 않기

#### Branch Naming Convention
- `feature/` - 새로운 기능 추가
- `fix/` - 버그 수정
- `refactor/` - 코드 리팩토링
- `docs/` - 문서 수정
- `chore/` - 설정, 빌드 관련 작업

예시:
```bash
git checkout -b feature/add-dark-mode
git checkout -b fix/seo-category-links
git checkout -b refactor/optimize-image-loading
```

#### Workflow
1. 새 브랜치 생성: `git checkout -b <type>/<description>`
2. 작업 완료 후 커밋
3. 원격 저장소에 푸시: `git push -u origin <branch-name>`
4. PR 생성: `gh pr create --base main`
5. 리뷰 및 머지 후 로컬 브랜치 정리

### Deployment Workflow

**IMPORTANT: 이 프로젝트는 완전한 정적 빌드(Static Export)로 배포됩니다.**

#### 빌드 프로세스
```bash
yarn build          # 정적 파일 생성 (out/ 디렉토리)
npx serve out       # 로컬에서 정적 빌드 테스트 (필수!)
```

#### 배포 전 필수 테스트
1. `yarn build` 실행하여 정적 파일 생성
2. `npx serve out` 실행하여 로컬에서 테스트
3. 모든 페이지 동작 확인 (테마 전환, 카테고리 토글 등)
4. 문제 없으면 GitHub에 푸시 → Cloudflare Pages 자동 배포

#### Cloudflare Pages 설정
- **Build Command**: `yarn build`
- **Output Directory**: `out`
- **Environment Variables**: Cloudflare Pages 대시보드에서 설정
  - 모든 `NEXT_PUBLIC_*` 변수는 빌드 시점에 주입됨

#### 생성되는 SEO 파일
- `sitemap.xml` - 사이트맵
- `robots.txt` - 크롤러 설정
- `feed.xml`, `atom.xml`, `feed.json` - RSS 피드

### SEO Configuration
- **Meta Tags**: Complete HTML meta tags with Korean language support (`lang="ko-KR"`)
- **Open Graph**: Full OG meta tags for social media sharing
- **Twitter Cards**: `summary_large_image` card type with proper image URLs
- **Google Search Console**: Verification tag configured via `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`
- **Google Analytics**: Tracking configured via `NEXT_PUBLIC_GOOGLE_MEASUREMENT_ID`
- **Sitemap**: Auto-generated XML sitemap with all pages and posts
- **RSS Feed**: Auto-generated RSS/Atom feed in both XML and JSON formats
- **Robots.txt**: Configured with AI bot restrictions and sitemap location
- **Canonical URLs**: Proper canonical URLs with trailing slashes matching sitemap format

## Supabase MCP Integration

### Overview
This project uses Supabase MCP (Model Context Protocol) server for database management operations. The Supabase MCP provides tools for managing projects, executing SQL, handling migrations, and working with Edge Functions.

### Configuration
Supabase MCP is configured in `.mcp.json`:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--access-token",
        "YOUR_SUPABASE_ACCESS_TOKEN"
      ]
    }
  }
}
```

### Environment Variables
Required for Supabase integration:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Anonymous/public key for client-side operations
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for admin operations (optional)
- `SUPABASE_ACCESS_TOKEN` - Personal access token for MCP server authentication

### Database Schema Management

#### Schema Files Location
- `supabase/schema.sql` - Main database schema with tables, indexes, and triggers
- `supabase/rls-policies.sql` - Row Level Security policies

#### Core Tables
1. **posts** - Blog post content and metadata
   - `notion_id` - Unique identifier from Notion CMS
   - `title`, `slug`, `content` (JSONB), `status`
   - `tags` (array), `category`, `published_at`

2. **tasks** - Task management for project workflow
   - `title`, `description`, `status`, `priority`
   - `due_date`, foreign key to `posts`

3. **page_views** - Analytics data
   - `post_id`, `view_count`, `unique_views`
   - `last_viewed` timestamp

#### Manual Schema Application
Since programmatic schema application requires additional authentication, use the Supabase Dashboard:

1. Go to `https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql`
2. Execute `supabase/schema.sql` first
3. Then execute `supabase/rls-policies.sql`

### Available MCP Tools

#### Project Management
- `mcp__supabase__list_projects` - List all Supabase projects
- `mcp__supabase__get_project` - Get project details
- `mcp__supabase__create_project` - Create new project
- `mcp__supabase__pause_project` / `mcp__supabase__restore_project` - Project lifecycle

#### Database Operations
- `mcp__supabase__list_tables` - List database tables
- `mcp__supabase__execute_sql` - Execute raw SQL queries
- `mcp__supabase__apply_migration` - Apply DDL migrations
- `mcp__supabase__list_migrations` - View migration history

#### Branch Management (for Database Branching)
- `mcp__supabase__create_branch` - Create development branch
- `mcp__supabase__list_branches` - List project branches
- `mcp__supabase__merge_branch` - Merge branch to production
- `mcp__supabase__delete_branch` - Remove branch

#### Monitoring & Debugging
- `mcp__supabase__get_logs` - Retrieve service logs (api, postgres, auth, storage, etc.)
- `mcp__supabase__get_advisors` - Security and performance recommendations

#### Edge Functions
- `mcp__supabase__list_edge_functions` - List deployed functions
- `mcp__supabase__deploy_edge_function` - Deploy new function version

#### API & Keys
- `mcp__supabase__get_project_url` - Get project API URL
- `mcp__supabase__get_anon_key` - Retrieve anonymous key
- `mcp__supabase__generate_typescript_types` - Generate TypeScript definitions

### Testing and Verification

#### Connection Testing
Use the built-in test script:
```bash
node scripts/test-supabase.js
```

This script verifies:
- Database connection with configured credentials
- Client configuration and performance
- Health check and latency measurement

#### Manual Table Verification
```javascript
// Check if tables exist (temporary script)
const { createClient } = require('@supabase/supabase-js')
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)

// Test table access
await supabase.from('posts').select('*').limit(1)
```

### Authentication Requirements

#### MCP Server Access
- Requires personal access token from Supabase Dashboard
- Token must have appropriate permissions for project management

#### Database Operations
- `SUPABASE_ANON_KEY` - Read access to public tables
- `SUPABASE_SERVICE_ROLE_KEY` - Full database access (admin operations)

### Common Operations

#### Creating Tables
1. Use MCP: `mcp__supabase__apply_migration` with DDL SQL
2. Manual: Copy SQL from `supabase/schema.sql` to Dashboard SQL editor

#### Querying Data
```javascript
// Using MCP
mcp__supabase__execute_sql({ 
  project_id: "your-project-id", 
  query: "SELECT * FROM posts WHERE status = 'published'" 
})
```

#### Deployment Workflow
1. Test locally with `node scripts/test-supabase.js`
2. Apply migrations via Dashboard or MCP
3. Verify with connection tests
4. Update production environment variables

### Security Considerations

#### Row Level Security (RLS)
- All tables have RLS enabled by default
- Public read access for published content
- Authenticated access for admin operations
- Service role bypass for API operations

#### API Key Management
- Never commit service role keys to repository
- Use environment variables for all credentials
- Rotate keys regularly through Supabase Dashboard

### Troubleshooting

#### Common Issues
1. **"Unauthorized" errors**: Check access token configuration
2. **Table not found**: Verify schema has been applied
3. **Connection timeout**: Check network and project URL
4. **RLS policy errors**: Verify authentication and policies

#### Debug Commands
```bash
# Test connection
node scripts/test-supabase.js

# Check project status
mcp__supabase__get_project({ project_id: "your-id" })

# View logs
mcp__supabase__get_logs({ project_id: "your-id", service: "postgres" })
```

## Current Development Status

### Recently Completed
- ✅ **Theme System Bug Fix**: Fixed category toggle triggering dark mode transition
  - `src/hooks/useScheme.ts`: Changed SSR fallback from `"dark"` to `"light"` for system mode
  - Explicit `"light"` or `"dark"` config settings are still respected
  - Prevents theme flicker on light-mode systems
- ✅ **Utterances Comments System**: Fixed script injection issue in `Utterances.tsx`
  - Removed blocking `hasChildNodes()` condition
  - Comments now work properly on both development and static builds
- ✅ **Static Export Configuration**: Complete static build setup
  - All pages pre-generated at build time in `out/` directory
  - Environment variables properly injected during build process
  - Local testing available via `npx serve out`
- ✅ **SEO Optimization**: Comprehensive SEO implementation
  - Complete meta tags, Open Graph, Twitter Cards
  - Auto-generated sitemap, robots.txt, RSS feeds

### Environment Variables Status
All environment variables in `.env.local` are properly configured:
- ✅ Notion integration (`NOTION_PAGE_ID`)
- ✅ Supabase database connection (`SUPABASE_URL`, `SUPABASE_ANON_KEY`)
- ✅ Google services (`NEXT_PUBLIC_GOOGLE_MEASUREMENT_ID`, `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`)
- ✅ Utterances comments (`NEXT_PUBLIC_UTTERANCES_REPO`)

## Task Master AI Instructions
**Import Task Master's development workflow commands and guidelines, treat as if import is in the main CLAUDE.md file.**
@./.taskmaster/CLAUDE.md
