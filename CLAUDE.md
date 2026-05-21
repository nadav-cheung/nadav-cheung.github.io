# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development server (hot-reload, serves from memory)
npx hexo server

# Full build to public/ directory
npx hexo clean && npx hexo generate

# Deploy to GitHub Pages (builds + pushes to gh-page branch)
npx hexo clean && npx hexo deploy

# Sync book chapters from external source repos
node scripts/sync-book.js          # agentscope → source/_posts/agentscope-book/
node scripts/sync-claudecode.js    # claudeai    → source/_posts/claudecode-book/
node scripts/sync-qwenpaw.js       # QwenPaw    → source/_posts/qwenpaw-book/
```

## Architecture

**Stack**: Hexo 8.1.2 static site generator + NexT 8.27.0 theme (Gemini scheme, dual-column card layout).

### Theme customization via injection points

All custom code is in `source/_data/`. NexT's `custom_file_path` in `_config.next.yml` maps these files into the theme:

| File | Purpose |
|------|---------|
| `variables.styl` | Design tokens — single source of truth for all colors. Overrides NexT theme variables. |
| `styles.styl` | All custom CSS. References variables.styl only, never hardcodes colors. |
| `body-end.njk` | Bookshelf component (homepage), back-to-top fix, category data JSON |
| `sidebar.njk` | WeChat QR code in sidebar |
| `footer.njk` | Site uptime widget |
| `post-body-start.njk` | QR code before article content |
| `post-body-end.njk` | End-of-article notice |
| `head.njk` | Custom `<head>` content |
| `languages.yml` | Override theme text strings |

### Stylus compilation order

`variables.styl` is compiled BEFORE `styles.styl` by NexT. Variables defined in `variables.styl` are available in `styles.styl` without import. **Gotcha**: Stylus `rgba()` does NOT accept Stylus variables — use hardcoded values or CSS `rgb()` with variables.

### Custom scripts (`scripts/`)

- **`chapter-sort.js`**: Overrides the default category generator to sort posts with a `chapter` front-matter field by chapter number ascending. Necessary because `hexo-generator-category` sorts by `-date` and ignores `before_generate` filters.
- **`sync-book.js`**: Syncs markdown chapters from `/Users/nadav/IdeaProjects/agentscope/teaching/book` into `source/_posts/agentscope-book/`. Uses MD5-based `.source-cache.json` to detect changes. Preserves AI-generated front-matter fields (description, categories, tags) from existing posts.
- **`sync-claudecode.js`**: Syncs Claude Code book from `/Users/nadav/IdeaProjects/claudeai/teaching/book` into `source/_posts/claudecode-book/`. Same MD5-cache pattern (`.claudecode-cache.json`). Walks subdirectories matching `卷*/第*章*.md` and `附录/附录*.md`. Post-processes: rewrites `.md` internal links to abbrlink URLs, assigns chapter ordering and incremental dates.
- **`sync-qwenpaw.js`**: Syncs QwenPaw book from `/Users/nadav/IdeaProjects/QwenPaw/book` into `source/_posts/qwenpaw-book/`. Same pattern (`.qwenpaw-cache.json`). Flat directory (no subdirectory walk). Same post-processing as sync-claudecode.js.

### Content structure

```
source/_posts/
  agentscope-book/   # 39 chapters (ch01–ch36 + 3 appendix), chapter front-matter field
  claudecode-book/   # Claude Code 源码解析书（卷零–卷五 + 附录）
  qwenpaw-book/      # QwenPaw 源码解析书（32 chapters + appendix）
  algorithms/        # 算法文章
  leetcode/          # LeetCode 题解
```

### Key plugins

- **hexo-abbrlink**: Generates short permalinks (`/posts/:abbrlink/`) from CRC32 hash of filename
- **hexo-optimize**: Minifies CSS/JS/HTML. **Caches aggressively** — always `hexo clean` after style changes.
- **hexo-related-posts**: Related post recommendations at end of articles
- **hexo-symbols-count-time**: Reading time and word count
- **hexo-generator-searchdb**: Local search index (`search.xml`)

## Important gotchas

- `npx hexo server` compiles CSS on-the-fly from memory. If style changes don't appear, kill the server and run `npx hexo clean` first.
- `site.categories.toArray()` works in server mode but is undefined during `hexo generate`. Use conditional: `{% if cats.toArray %}{% set catList = cats.toArray() %}{% else %}{% set catList = cats %}{% endif %}`.
- Config files (`_config.yml`, `_config.next.yml`) are in `.gitignore` — they contain API keys and secrets.
- The `gh-page` branch is the deployed output (GitHub Pages). Source is on `1.0.x`.
- Tag workflow: `git tag -d v1.2.0 && git tag v1.2.0 && git push origin v1.2.0 --force`
- Never modify files in `node_modules/hexo-theme-next/` directly — they're overwritten on updates. Override via `source/_data/` injection.
