# notion-based-log

> 📝 A Next.js-based static blog platform using Notion as CMS

A personal blog project that leverages Notion's powerful editing capabilities to manage blog content and automatically deploy it as a static site.

## ✨ Key Features

### 📚 Content Management
- **Notion CMS Integration**: Automatic synchronization of Notion pages as blog posts
- **Categories & Tags**: Systematic post classification and management
- **Multi-language Support**: Korean/English UI support (ko-KR, en-US)
- **Pagination**: Efficient post list navigation

### 🎨 User Experience
- **Dark/Light Mode**: Automatic theme switching with system settings integration
- **Responsive Design**: Optimized UI from mobile to desktop
- **Fast Search**: Real-time post search functionality
- **Comment System**: Utterances or Cusdis integration support

### 🚀 Performance & SEO
- **Static Site Generation**: Fast loading speeds with Next.js ISR
- **Auto Sitemap**: Automatic sitemap.xml generation for SEO optimization
- **OG Images**: Dynamic OG image generation for social media optimization
- **Google Analytics**: Visitor statistics and analytics

### 🔧 Technical Features
- **Supabase Integration**: PostgreSQL-based database (optional)
- **Hybrid Architecture**: Dual data source with Notion + Supabase
- **Auto Synchronization**: Automatic content updates via Cron jobs
- **Type Safety**: TypeScript-based development

## 🛠️ Tech Stack

### Frontend
- **Next.js 13** - React framework (App Router)
- **TypeScript** - Type safety
- **Emotion** - CSS-in-JS styling
- **React Query** - Server state management

### Backend & CMS
- **Notion API** - Content management system
- **Supabase** - PostgreSQL database (optional)
- **Vercel** - Deployment and hosting

### UI & Styling
- **react-notion-x** - Notion content rendering
- **Radix UI Colors** - Consistent color system
- **Prism.js** - Code highlighting
- **Mermaid** - Diagram rendering

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Yarn package manager
- Notion account and API token

### 1. Project Installation
```bash
git clone https://github.com/HaJunYoo/notion-log.git
cd notion-log
yarn install
```

### 2. Environment Variables Setup
Create a `.env.local` file and configure the following variables:

```bash
# Required environment variables
NOTION_PAGE_ID=your_notion_page_id

# Optional - Supabase database
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional - Google Analytics
NEXT_PUBLIC_GOOGLE_MEASUREMENT_ID=your_ga_measurement_id
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=your_google_verification

# Optional - Comment system
NEXT_PUBLIC_UTTERANCES_REPO=your_github_repo
```

### 3. Blog Configuration
Modify your personal information in the `site.config.js` file:
```javascript
const CONFIG = {
  profile: {
    name: "Your Name",
    image: "/notion-avatar.svg",
    role: "your role",
    bio: "your bio",
    email: "your.email@example.com",
    // ... other social media links
  },
  blog: {
    title: "Your Blog Title",
    description: "Blog description",
  },
  // ... other configurations
}
```

### 4. Development Server
```bash
# Local development with Yarn
yarn dev

# Or local development with Makefile
make local
```

Open http://localhost:3000 in your browser to view the blog.

## 📝 Development Commands

### Yarn Commands
```bash
yarn dev        # Start development server
yarn build      # Production build
yarn start      # Start production server
yarn lint       # Run ESLint
yarn postbuild  # Generate sitemap (runs automatically after build)
```

### Makefile Commands
```bash
# Local development environment
make local                    # Start local development server (yarn dev)

# Docker environment development
make setup                    # Build Docker image and setup environment
make dev                      # Run development server in Docker container
make run                      # Access Docker container bash

# Cache invalidation (for deployed site)
make revalidate-all                    # Invalidate all page caches
make revalidate-post SLUG=post-slug    # Invalidate specific post cache
```

> **Note**: For Docker and cache invalidation commands, add the following environment variables to `.env.local`:
> - `NEXT_JS_SITE_URL`: Deployed site URL
> - `TOKEN_FOR_REVALIDATE`: API revalidation token

## 📁 Project Structure

```
├── src/
│   ├── apis/           # API clients (Notion, Supabase)
│   ├── components/     # Reusable UI components
│   ├── hooks/          # Custom React hooks
│   ├── layouts/        # Layout components
│   ├── libs/           # Utility libraries
│   ├── pages/          # Next.js pages and API routes
│   ├── routes/         # Main route components
│   ├── styles/         # Style system
│   └── types/          # TypeScript type definitions
├── supabase/           # Database schema
├── scripts/            # Utility scripts
└── public/             # Static files
```

## 🔧 Configuration & Customization

### Notion Setup
1. Create a new page in Notion and convert it to a database
2. Add properties for blog posts (title, status, category, tags, etc.)
3. Get Notion API key and set it in environment variables

### Supabase Setup (Optional)
1. Create a Supabase project
2. Execute `supabase/schema.sql` to create tables
3. Set Supabase URL and keys in environment variables

### Deployment (Vercel)
1. Connect your project to Vercel
2. Configure environment variables in Vercel dashboard
3. Complete automatic deployment setup

## 🤝 Contributing

Please register bug reports or feature suggestions in [Issues](https://github.com/HaJunYoo/notion-log/issues).

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

This project is based on [morethan-log](https://github.com/morethanmin/morethan-log). Thanks for the excellent work.

---

<div align="center">

**[🌐 Live Demo](https://www.yukis-dev-log.site)** | **[📚 Documentation](https://github.com/HaJunYoo/notion-log/wiki)**

Made with by [HaJunYoo](https://github.com/HaJunYoo)

</div>
