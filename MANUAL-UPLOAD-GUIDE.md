# Velani: Manual Content Upload Guide
## With SEO Optimization

This guide walks you through adding a new letter or library read on your own,
from writing the file to seeing it live on velani.app — with SEO built in at every step.

---

## Before You Start

You need:
- VS Code open with the Velani project folder
- Git configured (if you've pushed before, you're set)
- The text of your letter or article ready to paste

---

## Part 1 — SEO Basics for Velani Content

Google finds your content through two things: the words on the page and the metadata in the frontmatter. Here's what matters and why.

### The title

The `title` field in frontmatter becomes:
- The browser tab title
- The `<h1>` on the page
- The blue clickable headline in Google search results

**Rules:**
- Be specific. "Why You're So Tired" outperforms "A Letter About Tiredness"
- Use the words your reader would actually search — not buzzwords
- Keep it under 60 characters so it doesn't get cut off in search results
- For letters, the title can be emotional/evocative — Google still indexes emotional language

**Good:**
`"Why productivity stopped working"` (30 chars, natural, searchable)

**Too vague:**
`"On carrying things"` (won't surface for any real search)

**Too long:**
`"The invisible weight of unfinished tasks and how to start clearing them today"` (77 chars — gets cut off)

---

### The description

The `description` field becomes the grey text shown under the title in Google results (the "meta description"). This is your one-line pitch to a stranger.

**Rules:**
- Aim for 120–155 characters
- Include a keyword your reader might search for, used naturally
- Write it like a sentence, not a list of tags
- End with a period

**Good (138 chars):**
`"The invisible weight of unfinished tasks and open loops — and how to start carrying less of it."`

**Too short:**
`"A letter about the mental load."`

**Too generic:**
`"Read this week's Velani letter about carrying less."`

---

### The filename / URL slug

The filename you choose becomes the URL:
`the-default-person.md` → `velani.app/letters/the-default-person`

Google reads the URL. A clear slug helps.

**Rules:**
- Match the title, lowercase, hyphens for spaces
- Remove filler words when possible: "a", "the", "an", "for", "of" (but keep if removing makes it odd)
- No special characters (apostrophes, commas, question marks, colons)
- Under 60 characters

**Examples:**
- "What matters today?" → `what-matters-today.md`
- "Why you've been carrying so much for so long" → `why-youve-been-carrying-so-much.md`
- "The invisible load" → `the-invisible-load.md`

---

### Internal links

Every letter and library read that links somewhere on velani.app gives that page a small SEO boost. When you write a P.S. or mention another article, use a relative link:

```markdown
*P.S. If this resonates, you might start with [the Velani Audit](/audit).*
```

This is already standard practice in the current letters — keep doing it.

---

## Part 2 — Adding a New Letter

### Step 1: Create the file

1. Open VS Code
2. In the Explorer panel on the left, navigate to `src/content/letters/`
3. Right-click the folder → **New File**
4. Name it using slug rules above (e.g. `the-next-letter.md`)

---

### Step 2: Add the frontmatter

Paste this at the very top of the file (the dashes `---` are required):

```markdown
---
title: "Your letter title"
description: "One sentence, 120–155 characters, includes a searchable keyword."
date: "2026-07-06"
preview: "2–3 sentences. This appears on the /letters listing page. Write it as a hook that earns the click."
readTime: "4 min read"
---
```

**Each field:**

| Field | What it does | SEO impact |
|-------|-------------|------------|
| `title` | H1 heading + page title | High |
| `description` | Meta description in Google | High |
| `date` | Shown in archive, sorts content | Low |
| `preview` | Card text on /letters page | None (not indexed) |
| `readTime` | Displayed on cards | None |

**Optional fields:**

```markdown
featured: true   ← Makes this the "Start here" letter. Only one at a time.
draft: true      ← Hides the letter until you remove this line.
```

---

### Step 3: Write the body

Below the closing `---`, paste or write the letter. A few formatting notes:

```markdown
---
title: "..."
...
---

First paragraph here. One idea per paragraph. Leave a blank line between them.

Second paragraph.

*Italic text uses single asterisks.*

**Bold text uses double asterisks.**

---

*P.S. Your postscript here. Great place for an internal link.*
```

No need to write a sign-off ("Warmly, Meagan") — the letter layout template adds it automatically.

---

### Step 4: Check your SEO before saving

Run through this checklist:

- [ ] Title: specific, under 60 characters, readable as a headline
- [ ] Description: 120–155 characters, includes a natural keyword, ends with a period
- [ ] Date: in `"YYYY-MM-DD"` format, in quotes
- [ ] Preview: 2–3 sentences, compelling hook
- [ ] Filename: matches the title, lowercase, hyphens, no punctuation
- [ ] Body: includes at least one internal link if possible (P.S. works great for this)

---

### Step 5: Save and publish

1. **Save the file** — Ctrl+S
2. **Open the terminal** in VS Code — Ctrl+` (backtick)
3. **Stage the file:**
   ```
   git add src/content/letters/your-filename.md
   ```
4. **Commit with a clear message:**
   ```
   git commit -m "add letter: your letter title"
   ```
5. **Push to Cloudflare:**
   ```
   git push
   ```
6. **Wait ~1 minute** — Cloudflare Pages builds automatically
7. **Check it's live:** open `velani.app/letters/your-filename`

---

## Part 3 — Adding a New Library Read

Library reads are different from letters in one important way: they're timeless. No dates in the body, no references to "this week" or "recently." Write them as if someone might find them two years from now.

### Step 1: Create the file

1. Navigate to `src/content/library/`
2. Right-click → **New File**
3. Name it using slug rules (e.g. `how-to-start-small.md`)

---

### Step 2: Add the frontmatter

```markdown
---
title: "Your article title"
description: "One sentence, 120–155 characters."
date: "2026-07-06"
category: "start-here"
readTime: "4 min"
---
```

**Category options:**

| Category slug | Use for |
|--------------|---------|
| `start-here` | First reads for new visitors — immediate relief, easy entry points |
| `why-it-feels-heavy` | Why life feels overwhelming — recognition, not yet solutions |
| `make-room` | Making space for yourself — emotional permission, lighter load |
| `gentle-rhythms` | Morning routines, evening rituals, weekly resets |
| `quiet-wins` | Reflection, noticing progress, looking back kindly |

---

### Step 3: Write the body

Library reads work best when they:
- Open with recognition (the reader feels seen immediately)
- Explain *why* something happens, not just *what* to do
- End with one clear, low-effort action or shift
- Avoid time-sensitive references ("lately," "this year," "recently")

---

### Step 4: Check SEO, save, and publish

Same checklist as letters — but library reads tend to rank better over time because they're evergreen. The `description` is especially important here. Think: what would someone type into Google that should lead them to this article?

For a library read titled "Decision fatigue is real":
- Likely search: "why is making decisions so exhausting"
- Good description: `"Decision fatigue is real — and it compounds when you're managing more than one person's life. Here's why it happens."`

---

## Part 4 — Scheduling a Future Post

Velani doesn't have a built-in scheduler, but you can use the draft flag to write ahead:

1. Create the file with full content
2. Add `draft: true` to the frontmatter
3. Push — it deploys but stays invisible
4. When ready to publish: open the file, delete the `draft: true` line, save, commit, push

You can write a whole month of letters this way and publish them one at a time.

---

## Part 5 — After Publishing: SEO Follow-Up

Once a new letter or read is live:

1. **Submit the URL to Google Search Console** (covered in the separate Google guide)
   — Go to URL Inspection → paste the new URL → Request Indexing
   — Google picks it up within 24–72 hours

2. **Share the URL** — every social share, newsletter link, and backlink helps Google
   understand the page is real and being read

3. **Link to it internally** — if a future letter mentions an older topic, link to it.
   Internal links help Google crawl and rank older content.

---

## Quick Reference Card

```
Letter file:   src/content/letters/[slug].md
Library file:  src/content/library/[slug].md

Slug rules:    lowercase · hyphens · no punctuation · under 60 chars

Title:         Under 60 chars · specific · readable headline
Description:   120–155 chars · 1 keyword naturally · ends with period
Date:          "YYYY-MM-DD" in quotes

Push:
  git add src/content/[folder]/[file].md
  git commit -m "add letter: [title]"
  git push

Check live:    velani.app/letters/[slug]
               velani.app/library/[slug]
```
