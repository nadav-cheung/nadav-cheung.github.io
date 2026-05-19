'use strict';

/**
 * Sync book chapters from AgentScope source repository into Hexo blog posts.
 *
 * Usage (as Hexo script, placed in scripts/):
 *   Automatically runs before generation if config.enable is true.
 *
 * Usage (standalone):
 *   node scripts/sync-book.js
 *
 * How it works:
 *   1. Reads .source-cache.json to get MD5 snapshots of all source files
 *   2. Compares current MD5 hashes against cached values
 *   3. For changed/new chapters: generates Hexo post with front matter
 *   4. For unchanged chapters: skips (preserves existing post including AI-generated fields)
 *   5. Updates .source-cache.json with new MD5 values
 *
 * Config in _config.yml:
 *   book_sync:
 *     enable: true
 *     source_root: /Users/nadav/IdeaProjects/agentscope/teaching/book
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const CACHE_FILE = '.source-cache.json';
const CHAPTER_PATTERNS = [
  /^volume-\d.*\/[^/]+\.md$/,
  /^appendix\/[^/]+\.md$/,
];

// ----- helpers -----

function md5File(filePath) {
  return crypto.createHash('md5').update(fs.readFileSync(filePath)).digest('hex');
}

function isChapter(relPath) {
  return CHAPTER_PATTERNS.some(p => p.test(relPath));
}

function makeAbbrlink(relPath) {
  return crypto.createHash('md5').update(relPath).digest('hex').slice(0, 8);
}

function extractTitleAndBody(content) {
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^# (.+)/);
    if (m && !lines[i].startsWith('## ')) {
      return {
        title: m[1].trim(),
        body: lines.slice(i + 1).join('\n').trim()
      };
    }
  }
  return { title: 'Untitled', body: content };
}

function atomicWrite(filePath, content) {
  const tmp = filePath + '.tmp';
  fs.writeFileSync(tmp, content, 'utf-8');
  fs.renameSync(tmp, filePath);
}

function parseFrontMatter(raw) {
  const start = raw.indexOf('---');
  if (start === -1) return null;
  const end = raw.indexOf('\n---', start + 3);
  if (end === -1) return null;
  return {
    fm: raw.slice(start + 3, end),
    body: raw.slice(end + 4)
  };
}

// ----- post-processors -----

const CHAPTER_ORDER = {
  'ch01-what-is-llm.md': 1, 'ch02-what-is-agent.md': 2, 'ch03-toolbox.md': 3,
  'ch04-message-born.md': 4, 'ch05-agent-receives.md': 5, 'ch06-memory-store.md': 6,
  'ch07-retrieval-knowledge.md': 7, 'ch08-formatter.md': 8, 'ch09-model.md': 9,
  'ch10-toolkit.md': 10, 'ch11-loop-return.md': 11, 'ch12-journey-review.md': 12,
  'ch13-module-system.md': 13, 'ch14-inheritance.md': 14, 'ch15-metaclass-hooks.md': 15,
  'ch16-formatter-strategy.md': 16, 'ch17-schema-factory.md': 17, 'ch18-middleware.md': 18,
  'ch19-pubsub.md': 19, 'ch20-observability.md': 20, 'ch21-dev-setup.md': 21,
  'ch22-new-tool.md': 22, 'ch23-new-model.md': 23, 'ch24-new-memory.md': 24,
  'ch25-new-agent.md': 25, 'ch26-mcp-server.md': 26, 'ch27-advanced-extension.md': 27,
  'ch28-integration-capstone.md': 28, 'ch29-msg-interface.md': 29, 'ch30-no-decorator.md': 30,
  'ch31-god-class.md': 31, 'ch32-compile-time-hooks.md': 32, 'ch33-typedict-union.md': 33,
  'ch34-contextvar.md': 34, 'ch35-formatter-separate.md': 35, 'ch36-panorama.md': 36,
  'python-primer.md': 37, 'glossary.md': 38, 'source-map.md': 39,
};

function fixPostLinks(postsDir, fileCache) {
  // Build basename → abbrlink map
  const nameToAbbr = {};
  for (const [rel, info] of Object.entries(fileCache)) {
    if (info.integrated && info.post_abbrlink) {
      nameToAbbr[path.basename(rel)] = info.post_abbrlink;
    }
  }

  for (const fname of fs.readdirSync(postsDir)) {
    if (!fname.endsWith('.md')) continue;
    const postPath = path.join(postsDir, fname);
    let content = fs.readFileSync(postPath, 'utf-8');
    const original = content;

    // Replace [text](path/to/file.md) with [text](/posts/abbrlink/)
    content = content.replace(
      /\[([^\]]+)\]\(([^)]+\.md)\)/g,
      (match, text, target) => {
        const basename = path.basename(target);
        if (nameToAbbr[basename]) {
          return `[${text}](/posts/${nameToAbbr[basename]}/)`;
        }
        return match;
      }
    );

    if (content !== original) {
      atomicWrite(postPath, content);
    }
  }
}

function fixChapterDates(postsDir) {
  for (const fname of fs.readdirSync(postsDir)) {
    if (!fname.endsWith('.md')) continue;
    const order = CHAPTER_ORDER[fname];
    if (!order) continue;

    const postPath = path.join(postsDir, fname);
    let content = fs.readFileSync(postPath, 'utf-8');

    // Ensure chapter field exists
    if (!/^chapter:\s*\d+$/m.test(content)) {
      content = content.replace(/^(date:.*)\n/m, '$1\nchapter: ' + order + '\n');
    }

    // Generate date: 2024-03-01 + (order-1) days
    const d = new Date(2024, 2, order);
    const dateStr = d.toISOString().slice(0, 10) + ' 00:00:00';
    content = content.replace(/^(date:\s*).*$/m, '$1' + dateStr);

    atomicWrite(postPath, content);
  }
}

// ----- main sync logic -----

function syncBook(config) {
  const sourceRoot = config.source_root;
  if (!sourceRoot || !fs.existsSync(sourceRoot)) {
    console.error('[book-sync] source_root not found:', sourceRoot);
    return;
  }

  const projectRoot = config.base_dir || process.cwd();
  const cachePath = path.join(projectRoot, CACHE_FILE);
  const postsDir = path.join(projectRoot, 'source', '_posts', 'agentscope-book');

  // Load cache
  let cache = {};
  try {
    if (fs.existsSync(cachePath)) {
      cache = JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
    }
  } catch (e) {
    console.warn('[book-sync] Could not load cache, starting fresh');
  }
  const oldFiles = cache.files || {};
  const newFiles = {};

  // Ensure posts directory exists
  fs.mkdirSync(postsDir, { recursive: true });

  let synced = 0, skipped = 0, removed = 0;

  // Walk source
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        const name = entry.name;
        if (name === '.venv' || name === '__pycache__') continue;
        walk(full);
        continue;
      }
      if (entry.name === '.env' || entry.name === '.env.example' ||
          entry.name === '.gitignore' || entry.name === '.DS_Store' ||
          entry.name.endsWith('.pyc')) continue;

      const rel = path.relative(sourceRoot, full);
      if (!isChapter(rel) || !rel.endsWith('.md')) {
        newFiles[rel] = { md5: md5File(full), integrated: false };
        continue;
      }

      const md5 = md5File(full);
      const old = oldFiles[rel];

      if (old && old.md5 === md5 && old.integrated && old.post_path &&
          fs.existsSync(path.join(projectRoot, old.post_path))) {
        // Unchanged - preserve
        newFiles[rel] = old;
        skipped++;
        continue;
      }

      // New or changed - integrate
      const content = fs.readFileSync(full, 'utf-8');
      const { title, body } = extractTitleAndBody(content);
      const abbrlink = makeAbbrlink(rel);
      const fname = path.basename(rel);
      const destPath = path.join(postsDir, fname);

      const chapter = CHAPTER_ORDER[fname];
      const chapterLine = chapter ? `\nchapter: ${chapter}` : '';
      const dateStr = new Date(2024, 2, chapter || 1).toISOString().slice(0, 10) + ' 00:00:00';

      // If post already exists, preserve AI-generated front matter fields
      let preserved = '';
      if (old && old.post_path && fs.existsSync(destPath)) {
        const existing = fs.readFileSync(destPath, 'utf-8');
        const parsed = parseFrontMatter(existing);
        if (parsed) {
          // Extract description, categories, tags from existing post
          const descMatch = parsed.fm.match(/^description:\s*(.+)$/m);
          const catsMatch = parsed.fm.match(/^categories:\s*[\s\S]*?(?=\n\w|$)/m);
          const tagsMatch = parsed.fm.match(/^tags:\s*[\s\S]*?(?=\n\w|$)/m);
          if (descMatch) preserved += '\ndescription: ' + descMatch[1];
          if (catsMatch) preserved += '\n' + catsMatch[0];
          if (tagsMatch) preserved += '\n' + tagsMatch[0];
        }
      }

      const post = `---\ntitle: ${title}\nabbrlink: ${abbrlink}\ndate: ${dateStr}${chapterLine}${preserved}\n---\n\n${body}\n`;

      atomicWrite(destPath, post);

      newFiles[rel] = {
        md5: md5,
        integrated: true,
        post_abbrlink: abbrlink,
        post_path: path.relative(projectRoot, destPath)
      };
      synced++;
      console.log(`[book-sync] ${old && old.md5 !== md5 ? '⟳' : '+' } ${rel} → ${newFiles[rel].post_path}`);
    }
  }

  walk(sourceRoot);

  // Detect removed source files (in cache but no longer in source)
  for (const rel of Object.keys(oldFiles)) {
    if (!newFiles[rel] && oldFiles[rel].integrated && oldFiles[rel].post_path) {
      const postPath = path.join(projectRoot, oldFiles[rel].post_path);
      if (fs.existsSync(postPath)) {
        console.log(`[book-sync] Source removed, deleting post: ${oldFiles[rel].post_path}`);
        fs.unlinkSync(postPath);
        removed++;
      }
    }
  }

  // Post-process: fix cross-reference links and chapter ordering
  fixPostLinks(postsDir, newFiles);
  fixChapterDates(postsDir);

  // Write updated cache
  cache.files = newFiles;
  cache.source_root = sourceRoot;
  cache.generated_at = new Date().toISOString();
  atomicWrite(cachePath, JSON.stringify(cache, null, 2));

  console.log(`[book-sync] Done: ${synced} synced, ${skipped} unchanged, ${removed} removed`);
}

// ----- Hexo integration -----

function registerHexoExtension(hexo) {
  const config = hexo.config.book_sync || {};
  if (!config.enable) return;

  hexo.extend.filter.register('before_generate', function () {
    config.base_dir = hexo.base_dir;
    config.source_root = config.source_root ||
      '/Users/nadav/IdeaProjects/agentscope/teaching/book';
    syncBook(config);
  });
}

// If loaded as Hexo script
if (typeof hexo !== 'undefined') {
  registerHexoExtension(hexo);
}

// If run directly
if (require.main === module) {
  syncBook({
    source_root: '/Users/nadav/IdeaProjects/agentscope/teaching/book',
    base_dir: path.resolve(__dirname, '..')
  });
}

module.exports = { syncBook, registerHexoExtension };
