# Velani Content Template & Self-Serve Guide

Use this file to add new letters and library reads yourself.
Everything here is also handled for you if you paste content into the chat.

---

## How It Works

Content lives in two folders:
- Letters → `src/content/letters/`
- Library reads → `src/content/library/`

Each piece of content is a single `.md` file. The filename becomes the URL slug.

---

## File Naming Rules

1. Use the title of the piece, all lowercase
2. Replace spaces with hyphens
3. Remove punctuation (apostrophes, commas, question marks)
4. Add `.md` at the end

**Examples:**
- "The Default Person" → `the-default-person.md`
- "What matters today?" → `what-matters-today.md`
- "Why you've been carrying so much" → `why-youve-been-carrying-so-much.md`

---

## Letter Template

Create `src/content/letters/[your-slug].md` and paste this, filling in all fields:

```markdown
---
title: "Your letter title"
description: "One sentence. Shown in search results and the archive listing."
date: "YYYY-MM-DD"
preview: "2–3 sentences shown on the /letters page card. Hook the reader."
readTime: "X min read"
featured: true
---

Your letter body goes here.

Write in paragraphs. Use a blank line between each paragraph.

*Italics* use single asterisks. **Bold** uses double.

---

*P.S. Optional postscript. Use italic. Link internally like this: [velani.app/audit](/audit)*
```

### Letter frontmatter fields explained

| Field | Required | Notes |
|-------|----------|-------|
| `title` | Yes | Displayed as the page heading |
| `description` | Yes | 1 sentence. Used for SEO meta description and archive |
| `date` | Yes | Format: `"2026-07-06"` (must be in quotes) |
| `preview` | Yes | 2–3 sentences. Shown on the /letters listing card |
| `readTime` | Yes | e.g. `"4 min read"` |
| `featured` | No | Add `featured: true` on ONE letter only — appears in "Start here" |
| `draft` | No | Add `draft: true` to hide until ready to publish |

**Important:** Only one letter should have `featured: true` at a time.
Before adding it to a new letter, remove it from the previous one.

---

## Library Read Template

Create `src/content/library/[your-slug].md` and paste this:

```markdown
---
title: "Your article title"
description: "One sentence. Shown in search results."
date: "YYYY-MM-DD"
category: "start-here"
readTime: "X min"
---

Your article body goes here.

Library reads are timeless — avoid dates, news references, or anything
that will feel stale. Write as if someone might find this two years from now.

Short paragraphs. Practical. Warm.
```

### Library category reference

| Slug | Label | Purpose | Use for |
|------|-------|---------|---------|
| `start-here` | Start Here | Immediate relief | First reads for new visitors |
| `why-it-feels-heavy` | Why It Feels Heavy | Recognition | Why life feels this way |
| `make-room` | Make Room For Yourself | Emotional payoff | Making space for yourself |
| `gentle-rhythms` | Gentle Rhythms | Practical routines | Morning, evening, weekly rhythms |
| `quiet-wins` | Quiet Wins | Reflection | Noticing progress, looking back kindly |

Note: `from-the-letter` is auto-populated from the letters folder. Do not use it as a category in library files.

---

## Scheduling a Future Letter (Draft Method)

To write a letter now and publish it later:

1. Create the file with all content
2. Add `draft: true` to the frontmatter
3. Commit and push — the letter is invisible on the site
4. When ready to publish: remove `draft: true`, commit, push

---

## Step-by-Step: Add a New Letter

1. **Open VS Code** and navigate to `src/content/letters/`
2. **Create a new file** — right-click the folder, New File
3. **Name it** using the slug rules above (e.g. `the-next-letter.md`)
4. **Paste the letter template** and fill in all frontmatter fields
5. **Write or paste the letter body** below the closing `---`
6. **Save the file** (Ctrl+S)
7. **Open the terminal** in VS Code (Ctrl+`)
8. Run:
   ```
   git add src/content/letters/the-next-letter.md
   git commit -m "add letter: the next letter"
   git push
   ```
9. Cloudflare Pages auto-deploys within ~1 minute
10. Visit `velani.app/letters/the-next-letter` to confirm it's live

---

## Step-by-Step: Add a New Library Read

Same as above, but save the file in `src/content/library/` and use the library template.

---

## SEO Checklist for Every New Piece

Before committing, check:

- [ ] `title` — specific, natural phrase (not keyword-stuffed)
- [ ] `description` — 1 sentence, 120–160 characters, includes a keyword naturally
- [ ] `date` — correct date in `"YYYY-MM-DD"` format
- [ ] `readTime` — accurate estimate
- [ ] `preview` (letters only) — compelling 2–3 sentence hook
- [ ] Filename slug — matches the title, no stop words if possible

**Good description example:**
`"The invisible weight of unfinished tasks and open loops — and how to start carrying less of it."`

**Poor description example:**
`"A letter about carrying things."` ← too vague

---

## Sending the File to Claude Instead

If you'd prefer not to do this manually, paste the letter text into the chat.
Claude will create the file, fill all frontmatter, and add the correct SEO fields.
You just review and push.
