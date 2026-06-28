# Velani: Google Search Console Setup Guide
## Step-by-Step, From Scratch

This guide gets velani.app indexed in Google — so when someone searches for what you write about,
your site has a chance to show up.

Estimated time: 30 minutes total, most of it waiting on Google.

---

## What You're Setting Up

**Google Search Console** is a free Google tool that:
- Tells Google your site exists and what pages it contains
- Shows you which search terms people use to find you
- Lets you submit new pages for indexing after you publish them
- Alerts you to any crawl errors or issues

You don't need Google Analytics for this (that's a separate tool for traffic data). Search Console is specifically for search indexing.

---

## Part 1 — Create a Google Search Console Account

### Step 1: Go to Search Console

Open this URL in your browser:
```
https://search.google.com/search-console
```

Sign in with your Google account (theglowupclub.web@gmail.com works, or any Google account you want to use for site management).

---

### Step 2: Add your property

After signing in, you'll see a prompt to add a property. Click **"Add property"** (or it may appear automatically if this is your first time).

You'll see two options:

**Option A: Domain**
Covers all versions of your site (http, https, www, non-www).
Requires adding a DNS record in Cloudflare.

**Option B: URL prefix**
Covers exactly the URL you enter.
Can verify via an HTML file or meta tag.

**Use Option A (Domain)** — it's more complete and Cloudflare makes the DNS step easy.

---

### Step 3: Enter your domain

In the Domain field, type:
```
velani.app
```

(No https://, no www — just the bare domain)

Click **Continue**.

---

## Part 2 — Verify Ownership via Cloudflare DNS

Google needs to confirm you own velani.app. The easiest method is adding a TXT record in Cloudflare.

### Step 4: Copy the verification code

After entering your domain, Google shows you a TXT record to add. It looks like:

```
google-site-verification=abcdefgh1234567890...
```

Copy the full string (everything including `google-site-verification=`).

---

### Step 5: Add the TXT record in Cloudflare

1. Open a new tab and go to [dash.cloudflare.com](https://dash.cloudflare.com)
2. Sign in and click on **velani.app** in your dashboard
3. In the left sidebar, click **DNS** → **Records**
4. Click **Add record**
5. Fill in:
   - **Type:** `TXT`
   - **Name:** `@` (this means the root domain)
   - **Content:** paste the full verification string from Google
   - **TTL:** Auto
6. Click **Save**

---

### Step 6: Verify in Google Search Console

Go back to the Google Search Console tab.

Click **Verify**.

Google checks for the TXT record. It usually confirms within 30 seconds, but can take up to a few minutes if DNS hasn't propagated yet.

If it fails the first time, wait 5 minutes and try again. DNS changes are nearly instant with Cloudflare but Google's checker can be slow.

Once verified, you'll see a success screen. Click **Go to property**.

---

## Part 3 — Submit Your Sitemap

A sitemap is a file that lists every page on your site. Astro generates one automatically. Submitting it tells Google exactly what to crawl.

### Step 7: Confirm your sitemap exists

Open a new browser tab and visit:
```
https://velani.app/sitemap-index.xml
```

You should see an XML file listing your sitemap. If you see it, you're ready. If not, check that your site is deployed (Cloudflare Pages should handle this automatically with Astro).

---

### Step 8: Submit the sitemap

Back in Search Console:

1. In the left sidebar, click **Sitemaps**
2. In the "Add a new sitemap" field, type:
   ```
   sitemap-index.xml
   ```
3. Click **Submit**

Google shows "Success" and a status of "Pending." It starts crawling your site within 24–72 hours. You'll see pages appearing in Search Console after that.

---

## Part 4 — Request Indexing for Existing Pages

Submitting the sitemap tells Google about all pages at once, but for important pages you can also request indexing individually — it's faster.

### Step 9: Use URL Inspection

In Search Console, at the top of the screen there's a search bar that says "Inspect any URL in [velani.app]."

Start with your most important pages:

1. Paste `https://velani.app` → press Enter → click **Request Indexing**
2. Paste `https://velani.app/letters` → Request Indexing
3. Paste `https://velani.app/library` → Request Indexing
4. Paste `https://velani.app/about` → Request Indexing
5. Paste each letter URL:
   - `https://velani.app/letters/the-default-person`
   - `https://velani.app/letters/why-youve-been-carrying-so-much`
   - `https://velani.app/letters/what-matters-today`
   - `https://velani.app/letters/the-invisible-load`
   - `https://velani.app/letters/the-thing-nobody-designed-a-system-for`
   - `https://velani.app/letters/the-system-nobody-builds`
   - `https://velani.app/letters/one-clear-move-at-a-time`

You can do about 10–15 requests per day. Do the most important ones first.

---

## Part 5 — What Happens Next

### Timeline

| When | What happens |
|------|-------------|
| Day 1 | Sitemap submitted, Google starts crawling |
| Day 2–5 | Pages begin appearing in Google's index |
| Week 1–2 | First search impressions appear in Search Console |
| Week 4+ | You start seeing click data for real searches |

Velani is a new domain, so it takes a few weeks before pages rank for anything. This is normal — domain age and backlinks build over time.

---

### Checking your progress

After a week or two, open Search Console and look at:

**Performance** (left sidebar): Shows impressions (how often you appeared in search), clicks, and average position. This is the most useful view. When you see impressions for specific queries, you know Google is picking up your content.

**Coverage** (left sidebar): Shows indexed vs. not indexed. If pages show "Excluded — Crawled, not indexed," it usually means the content is thin — the solution is stronger, longer articles (library reads especially).

**URL Inspection**: Paste any URL to see its current index status. Use this every time you publish something new.

---

## Part 6 — Ongoing: Index New Content as You Publish

Every time you publish a new letter or library read:

1. Wait for Cloudflare to deploy (about 1 minute after `git push`)
2. Go to Search Console → URL Inspection
3. Paste the new page URL (e.g. `https://velani.app/letters/your-new-letter`)
4. Click **Request Indexing**

This gets new content into Google within 24–48 hours instead of waiting for the next automatic crawl.

---

## Summary Checklist

- [ ] Sign in to Search Console at `search.google.com/search-console`
- [ ] Add Domain property: `velani.app`
- [ ] Copy TXT verification code from Google
- [ ] Add TXT record in Cloudflare DNS (Type: TXT, Name: @, Content: paste code)
- [ ] Click Verify in Search Console
- [ ] Submit sitemap: `sitemap-index.xml`
- [ ] Request indexing for home, /letters, /library, /about, and each letter URL
- [ ] Check back in 1–2 weeks to see first data in Performance report
- [ ] From now on: request indexing every time you publish something new

---

## Troubleshooting

**"Couldn't verify" after adding the TXT record**
Wait 5 minutes for DNS propagation and try again. If it still fails, double-check you used `@` as the Name in Cloudflare (not `velani.app` or `www`).

**Sitemap shows an error**
Visit `https://velani.app/sitemap-index.xml` directly. If the page doesn't exist, the sitemap may not be generating. Come back to this and ask Claude Code to check the Astro sitemap config.

**Pages show "Crawled, not indexed"**
This usually means Google visited the page but didn't find it valuable enough to index. The fix is more content — longer articles, stronger writing. Library reads especially should aim for 400–800 words minimum.

**No impressions after 2 weeks**
Normal for a new domain. Keep publishing, keep submitting new URLs. Domain authority builds with time and backlinks (social shares, other sites linking to you).
