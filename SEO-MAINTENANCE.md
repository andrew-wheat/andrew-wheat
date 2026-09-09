# Search indexing maintenance

The preferred public URLs are the 19 pages in `sitemap.xml`. Keep internal links on these clean, HTTPS URLs. Work filter parameters intentionally share the `/work/` canonical.

## Safe metadata updates

Run from this repository:

```sh
node scripts/build-seo.mjs --metadata-only
python scripts/serve-preview.py --port 4173
node scripts/seo-audit.mjs http://127.0.0.1:4173
```

The metadata-only build preserves existing body markup and graphics. The default build also regenerates page content and should only be used when that is intended. Project metadata and JSON-LD are generated in HTML; browser rendering preserves them. Modification dates are omitted until accurate per-page dates are maintained, rather than reporting a fixed date for every page.

## Legacy URLs and expected exclusions

- `/work.html`, `/about.html`, `/contact.html`, and `/project/` immediately redirect to their preferred destinations. GitHub Pages does not expose custom HTTP redirect rules; these use Google's supported immediate HTML refresh, with an early script to preserve query parameters and fragments.
- `/project.html?id=...` uses an early script because its destination depends on the query. It has no unrelated static canonical or initial `noindex` that could prevent Google rendering the redirect.
- `/selected/` remains intentionally excluded; its five individual collection pages are indexable.
- Retired projects and nonexistent URLs return 404 and should stay out of the index.
- “Page with redirect” and “Alternate page with proper canonical tag” can be expected for old or duplicate URLs. They do not mean the destination page is broken.

## Search Console follow-up

On September 9, 2026, the report (last updated September 3) showed four indexed pages and five expected exclusions: redirects for `https://www.andrew-wheat.com/`, `http://andrew-wheat.com/`, `http://www.andrew-wheat.com/`, and `http://andrew-wheat.com/index.html`; and a canonical duplicate at `https://andrew-wheat.com/index.html`. These all consolidate to the preferred homepage. The redirect validation failure dated July 25 does not require removing these correct redirects.

Read the affected example URLs and exact exclusion reason before starting validation. Inspect the preferred destination, run **Test live URL**, and request indexing when appropriate. Confirm `https://andrew-wheat.com/sitemap.xml` is submitted. Do not request indexing for redirects, retired projects, or intentionally excluded routes.

Search Console access requires the owner's signed-in Google session. Passing a crawl audit does not establish whether Google has indexed a page or guarantee future indexing.

## Google and AI discovery

Public pages provide crawlable HTML, descriptive metadata, image alternatives, canonical URLs, and structured data. The supplementary `llms.txt` and `llms-full.txt` reflect the same content; they do not guarantee AI inclusion. Google's AI search features depend on normal search eligibility.

References: [Redirects](https://developers.google.com/search/docs/crawling-indexing/301-redirects), [canonical URLs](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls), [AI search guidance](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide).
