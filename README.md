# Velani — Site Setup

## Quick start

```bash
npm install
npm run dev        # → localhost:4321
npm run build      # → /dist (what Cloudflare deploys)
```

## Folder structure

```
velani/
├── public/
│   ├── favicon.svg          ← copy from your favicon files
│   ├── favicon.png
│   ├── favicon.ico
│   └── apple-touch-icon.png
├── src/
│   ├── layouts/
│   │   └── Base.astro       ← nav, footer, <head> — edit once
│   ├── pages/
│   │   ├── index.astro      ← paste your current index.html here
│   │   ├── thankyou/
│   │   │   └── index.astro  ← paste your thankyou.html here
│   │   ├── letter/
│   │   │   └── index.astro  ← newsletter signup + archive
│   │   ├── library/
│   │   │   └── index.astro  ← short reads list
│   │   └── philosophy/
│   │       └── index.astro  ← manifesto + principles
│   ├── styles/
│   │   └── global.css       ← all your brand tokens live here
│   └── content/
│       ├── letter/          ← one .md file per newsletter issue
│       │   └── issue-001-designing-your-week.md
│       └── library/         ← one .md file per library read
│           └── four-domains-of-wealth.md
└── astro.config.mjs
```

## How to add a newsletter issue

1. Create a new file in `src/content/letter/`
2. Name it: `issue-002-your-title.md`
3. Add frontmatter at the top:

```md
---
title: "Your issue title"
description: "One sentence description"
date: "2026-06-15"
issue: 2
---

Your content here in Markdown.
```

4. `git add . && git commit -m "Add issue 2" && git push`
5. Cloudflare deploys in ~30 seconds. Done.

## How to add a library read

Same as above but in `src/content/library/`. Add a `tag` field for grouping:

```md
---
title: "Your title"
description: "One sentence"
date: "2026-06-01"
tag: "Framework"
readTime: "5 min"
---
```

## Deploy to Cloudflare Pages

1. Push this folder to a GitHub repo
2. Cloudflare Dashboard → Workers & Pages → Create → Pages
3. Connect to GitHub → select your repo
4. Build settings:
   - Build command: `npm run build`
   - Output directory: `dist`
5. Save and deploy → auto-deploys on every push forever

## Migrating your existing HTML pages

Open `src/pages/index.astro` and paste your existing `index.html` content
between the `<Base>` tags. Remove the `<html>`, `<head>`, `<body>` tags —
Base.astro handles those. Keep everything inside `<body>`.

Same for thankyou: paste into `src/pages/thankyou/index.astro`.
