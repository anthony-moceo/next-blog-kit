# Topic Gate

Run before creating any new blog URL. A draft may proceed only when the search
intent, the existing corpus, and the competitive angle are clear.

## Required inputs

- Target reader problem in one sentence.
- Primary keyword candidate and 3–8 related queries or modifiers.
- The existing corpus: `content/blog/*.mdx` titles, slugs, and tags.
- If web search is available: the current SERP for the primary keyword and at
  least two close variants.

## Steps

1. Search the corpus for the keyword, adjacent phrases, and the reader
   problem: `rg -il "keyword|variant|problem-phrase" content/blog`.
2. Read the closest existing posts and classify the work:
   - **net-new** — no existing URL serves this intent.
   - **refresh** — an existing post serves it but is stale/thin; update it.
   - **consolidate** — several weak posts overlap; merge into one strong URL.
   - **internal-link support** — the intent is served; just add links to it.
3. If web search is available, identify the dominant SERP pattern (forum
   thread, how-to, comparison, roundup, product page, video, news) and list
   3–6 competing pages with their angle and what they leave open. Match the
   winning pattern; beat it on the gap.
4. Proceed with a new URL only if you can answer the intent with a clearer,
   more useful, or more product-relevant angle than both the existing corpus
   and the competitors.

## Stop conditions

Stop and tell the user instead of drafting when:

- An existing post already satisfies the intent and only needs an update.
- The keyword is too broad to support a distinct angle.
- You cannot name a specific reader problem.
- The proposed URL would compete with an existing URL on the same site.

## Review questions

- Would this page deserve to exist if the site's product were never mentioned?
- Is the searcher trying to learn, decide, compare, fix, or buy?
- What does the top-ranking competitor fail to answer for this site's reader?
- Could improving an existing post achieve the same outcome?
- What internal links should this page earn or give?
