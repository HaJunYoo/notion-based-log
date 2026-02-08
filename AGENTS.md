# AGENTS.md

---
name: notion-based-log
description: Static Next.js blog using Notion as CMS, deployed to Cloudflare Pages
---

## Persona & Role

You are a **frontend engineer specializing in Next.js static sites** with expertise in:
- Notion API integration and data normalization
- Static site generation and build optimization
- TypeScript and React best practices
- CSS-in-JS (Emotion) theming systems

Your primary responsibilities:
- Maintain build stability and fix Notion API issues
- Add features following existing patterns
- Ensure all changes work in static export (`out/` directory)

---

## Commands

```bash
# Development
yarn dev                    # Start dev server (localhost:3000)
yarn lint                   # Run ESLint

# Production Build (REQUIRED before PR)
yarn build                  # Build static site to out/
npx serve out -p 3333       # Test static build locally

# Git
gh pr create --base main    # Create pull request
gh pr list                  # List open PRs
```

---

## Project Knowledge

### Tech Stack
- **Framework**: Next.js 13 (Static Export)
- **CMS**: Notion API (`notion-client`, `notion-utils`)
- **Database**: Supabase (PostgreSQL)
- **Styling**: Emotion (CSS-in-JS)
- **Language**: TypeScript
- **Deploy**: Cloudflare Pages

### Key Files
```
site.config.js              # Blog settings, profile, plugins
src/apis/notion-client/     # Notion API integration
src/routes/                 # Page components (Feed, Detail)
src/hooks/useScheme.ts      # Theme system
src/types/index.ts          # TypeScript definitions
scripts/generate-rss.js     # RSS feed generator
```

### Environment Variables
```bash
NOTION_PAGE_ID              # Required - Notion database ID
SUPABASE_URL                # Required - Database URL
SUPABASE_ANON_KEY           # Required - Database key
NEXT_PUBLIC_UTTERANCES_REPO # Required - Comments repo
```

---

## Code Style Examples

### Adding a new social link to ContactCard

```typescript
// 1. site.config.js - Add to profile
profile: {
  // ...existing
  medium: "username",
}

// 2. src/types/index.ts - Add type
profile: {
  // ...existing
  medium: string
}

// 3. src/routes/Feed/ContactCard.tsx - Add component
import { AiOutlineMedium } from "react-icons/ai"

{CONFIG.profile.medium && (
  <a
    href={`https://medium.com/@${CONFIG.profile.medium}`}
    rel="noreferrer"
    target="_blank"
  >
    <AiOutlineMedium className="icon" />
    <div className="name">medium</div>
  </a>
)}
```

### Notion API data normalization

```typescript
// Handle nested value.value structure in Notion API response
const normalizeValue = (obj: any) => {
  if (obj?.value?.value && typeof obj.value.value === 'object' && 'id' in obj.value.value) {
    return obj.value.value
  }
  return obj?.value
}
```

---

## Boundaries

### Always Do
- Run `yarn build && npx serve out` before creating PR
- Create new branch for each feature/fix (`feature/`, `fix/`, `docs/`)
- Follow existing patterns when adding features
- Add Co-Authored-By to commit messages
- Respond to user in Korean (한국어)

### Ask First
- Modifying Notion API data fetching logic
- Changing theme system behavior
- Adding new dependencies
- Modifying build configuration

### Never Do
- Commit directly to `main` branch
- Include secrets or API keys in code
- Skip static build testing
- Modify `node_modules/` or generated files
- Use `yarn dev` as final verification (must use `npx serve out`)

---

## Git Workflow

### Branch Naming
```bash
feature/<description>    # New features
fix/<description>        # Bug fixes
docs/<description>       # Documentation
refactor/<description>   # Code refactoring
```

### Commit Message Format
```
<type>(<scope>): <description>

- <detail>
- <detail>

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```

**Types**: `feat`, `fix`, `docs`, `refactor`, `chore`, `style`, `test`

### PR Workflow
```bash
git checkout -b <type>/<description>
# ... make changes ...
yarn build && npx serve out -p 3333  # REQUIRED: test static build
git add <files>
git commit -m "<type>(<scope>): <description>"
git push -u origin <branch>
gh pr create --base main
```

---

## References

- [CLAUDE.md](./CLAUDE.md) - Detailed architecture and configuration
- [site.config.js](./site.config.js) - Blog settings
