# notion-based-log

> 📝 A Next.js static blog platform using Notion as CMS

A personal static blog that uses Notion as a content management system and generates fast, SEO-optimized static HTML files for deployment anywhere.

## ✨ Key Features

### 📚 Content Management
- **Notion CMS Integration**: Use Notion as your blog editor and content manager
- **Categories & Tags**: Organize posts with systematic classification
- **Multi-language Support**: Korean/English UI support (ko-KR, en-US)
- **Static Generation**: All content pre-built at compile time

### 🎨 User Experience
- **Dark/Light Mode**: Theme switching with system settings integration
- **Responsive Design**: Mobile-first design optimized for all devices
- **Fast Search**: Client-side search functionality
- **Comment System**: Utterances integration support

### 🚀 Performance & SEO
- **Static Site Export**: Ultra-fast loading with pre-generated HTML
- **Auto Sitemap**: Automatic sitemap.xml and RSS feed generation
- **Canonical URLs**: SEO-optimized URLs with trailing slashes
- **Image Optimization**: Optimized Notion image handling
- **Google Analytics**: Built-in analytics support

## 🛠️ Tech Stack

- **Next.js 15** - React framework with static export
- **TypeScript** - Type safety and better development experience
- **Emotion** - CSS-in-JS styling system
- **Notion API** - Content management and data source
- **react-notion-x** - Notion block rendering
- **Prism.js** - Syntax highlighting for code blocks
- **Mermaid** - Diagram and flowchart rendering

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- npm or yarn package manager
- Notion account with a database page

### 1. Clone and Install
```bash
git clone https://github.com/HaJunYoo/notion-log.git
cd notion-log
npm install
```

### 2. Environment Setup
Create a `.env.local` file with the required variables:

```bash
# Required
NOTION_PAGE_ID=your_notion_database_page_id

# Optional - Analytics
NEXT_PUBLIC_GOOGLE_MEASUREMENT_ID=your_ga_measurement_id
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=your_google_verification

# Optional - Comments
NEXT_PUBLIC_UTTERANCES_REPO=your_github_repo
```

### 3. Configure Your Blog
Edit `site.config.js` with your information:

```javascript
const CONFIG = {
  profile: {
    name: "Your Name",
    image: "/notion-avatar.svg",
    role: "Developer",
    bio: "Your bio here",
    email: "your.email@example.com",
    // Add your social links
  },
  blog: {
    title: "Your Blog Title",
    description: "Your blog description",
  }
  // ... other settings
}
```

### 4. Build and Deploy
```bash
# Build static files
npm run build

# Serve locally to test
npx serve out
```

The static files will be generated in the `out/` directory, ready for deployment.

## 📝 Available Commands

```bash
# Development
npm run dev         # Start development server (http://localhost:3000)
npm run build       # Build static files for production
npm run lint        # Run ESLint code linting

# Utilities
npm run postbuild   # Generate sitemap and RSS (runs automatically after build)
npm run generate-rss # Generate RSS feed only
```

### Alternative Commands (Makefile)
```bash
make build          # Build static files (npx next build)
make local          # Serve built files locally (npx serve out)
make install        # Install dependencies (npm install)
```

## 📁 Project Structure

```
├── src/
│   ├── apis/           # Notion API client
│   ├── components/     # Reusable UI components
│   ├── hooks/          # Custom React hooks
│   ├── layouts/        # Layout components
│   ├── libs/           # Utility libraries
│   ├── pages/          # Next.js pages and routes
│   ├── routes/         # Main route components
│   ├── styles/         # Theme and style system
│   └── types/          # TypeScript definitions
├── scripts/            # Build and utility scripts
├── public/             # Static assets
├── out/                # Generated static files (after build)
└── site.config.js      # Blog configuration
```

## 🔧 Notion Setup

1. **Create a Notion Database**
   - Create a new page in Notion
   - Add a database with these properties:
     - Title (Title)
     - Status (Select: Published, Draft)
     - Category (Select)
     - Tags (Multi-select)
     - Date (Date)

2. **Get Your Database ID**
   - Share your database publicly or get the page ID from the URL
   - Add the ID to your `.env.local` file as `NOTION_PAGE_ID`

## 🚀 Deployment

This blog generates static files that can be deployed anywhere:

### Cloudflare Pages (Recommended)
1. Connect your GitHub repository
2. Build command: `npm run build`
3. Output directory: `out`
4. Add environment variables in dashboard

### Other Static Hosts
- **Netlify**: Same build settings as Cloudflare Pages
- **Vercel**: Works with static export settings
- **GitHub Pages**: Upload `out/` directory contents
- **AWS S3**: Upload `out/` directory as static website

### Manual Deployment
```bash
npm run build        # Generate static files
# Upload contents of 'out/' directory to your hosting provider
```

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
