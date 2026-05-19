'use strict';

/**
 * Sync QwenPaw book chapters from source repository into Hexo blog posts.
 *
 * Usage (standalone):
 *   node scripts/sync-qwenpaw.js
 *
 * Config in _config.yml:
 *   qwenpaw_book_sync:
 *     enable: true
 *     source_root: /Users/nadav/IdeaProjects/QwenPaw/book
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const CACHE_FILE = '.qwenpaw-cache.json';

const CHAPTER_ORDER = {
  '00-序章-启程之前.md': 1,
  '01-浏览器按下回车之后.md': 2,
  '02-请求到达Runner.md': 3,
  '03-Agent的诞生.md': 4,
  '04-系统提示词的拼装.md': 5,
  '05-进入ReAct循环.md': 6,
  '06-调用大语言模型.md': 7,
  '07-工具的执行.md': 8,
  '08-响应的归途.md': 9,
  '09-源码的地图.md': 10,
  '10-Agent的身世.md': 11,
  '11-Provider的棋局.md': 12,
  '12-Channel的变装.md': 13,
  '13-Security的围栏.md': 14,
  '14-Skills的工坊.md': 15,
  '15-造一把新工具.md': 16,
  '16-造一个新技能.md': 17,
  '17-接入一个新模型.md': 18,
  '18-接入一个新频道.md': 19,
  '19-从零到PR.md': 20,
  '20-配置的秘密.md': 21,
  '21-记忆的宫殿.md': 22,
  '22-自治任务.md': 23,
  '23-多智能体协作.md': 24,
  '24-插件系统.md': 25,
  '25-命令行与部署.md': 26,
  '26-测试与质量.md': 27,
  '附录A-环境变量速查.md': 28,
  '附录B-CLI命令速查.md': 29,
  '附录C-源码结构总览.md': 30,
  '附录D-错误代码速查.md': 31,
  '附录E-术语索引.md': 32,
};

// ----- helpers -----

function md5File(filePath) {
  return crypto.createHash('md5').update(fs.readFileSync(filePath)).digest('hex');
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

function fixPostLinks(postsDir, fileCache) {
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

    if (!/^chapter:\s*\d+$/m.test(content)) {
      content = content.replace(/^(date:.*)\n/m, '$1\nchapter: ' + order + '\n');
    }

    const mins = order - 1;
    const hh = String(Math.floor(mins / 60)).padStart(2, '0');
    const mm = String(mins % 60).padStart(2, '0');
    const dateStr = '2026-05-19 ' + hh + ':' + mm + ':00';
    content = content.replace(/^(date:\s*).*$/m, '$1' + dateStr);

    atomicWrite(postPath, content);
  }
}

// ----- main sync logic -----

function syncBook(config) {
  const sourceRoot = config.source_root;
  if (!sourceRoot || !fs.existsSync(sourceRoot)) {
    console.error('[qwenpaw-sync] source_root not found:', sourceRoot);
    return;
  }

  const projectRoot = config.base_dir || process.cwd();
  const cachePath = path.join(projectRoot, CACHE_FILE);
  const postsDir = path.join(projectRoot, 'source', '_posts', 'qwenpaw-book');

  let cache = {};
  try {
    if (fs.existsSync(cachePath)) {
      cache = JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
    }
  } catch (e) {
    console.warn('[qwenpaw-sync] Could not load cache, starting fresh');
  }
  const oldFiles = cache.files || {};
  const newFiles = {};

  fs.mkdirSync(postsDir, { recursive: true });

  let synced = 0, skipped = 0, removed = 0;

  for (const entry of fs.readdirSync(sourceRoot, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith('.md')) continue;
    if (entry.name === 'README.md') continue;

    const full = path.join(sourceRoot, entry.name);
    const rel = entry.name;

    const md5 = md5File(full);
    const old = oldFiles[rel];

    if (old && old.md5 === md5 && old.integrated && old.post_path &&
        fs.existsSync(path.join(projectRoot, old.post_path))) {
      newFiles[rel] = old;
      skipped++;
      continue;
    }

    const content = fs.readFileSync(full, 'utf-8');
    const { title, body } = extractTitleAndBody(content);
    const abbrlink = makeAbbrlink(rel);
    const destPath = path.join(postsDir, rel);

    const chapter = CHAPTER_ORDER[rel];
    const chapterLine = chapter ? `\nchapter: ${chapter}` : '';

    let preserved = '';
    if (old && old.post_path && fs.existsSync(destPath)) {
      const existing = fs.readFileSync(destPath, 'utf-8');
      const parsed = parseFrontMatter(existing);
      if (parsed) {
        const descMatch = parsed.fm.match(/^description:\s*(.+)$/m);
        const catsMatch = parsed.fm.match(/^categories:\s*[\s\S]*?(?=\n\w|$)/m);
        const tagsMatch = parsed.fm.match(/^tags:\s*[\s\S]*?(?=\n\w|$)/m);
        if (descMatch) preserved += '\ndescription: ' + descMatch[1];
        if (catsMatch) preserved += '\n' + catsMatch[0];
        if (tagsMatch) preserved += '\n' + tagsMatch[0];
      }
    }

    const post = `---\ntitle: ${title}\nabbrlink: ${abbrlink}\ndate: 2026-05-19 00:00:00${chapterLine}${preserved}\n---\n\n${body}\n`;

    atomicWrite(destPath, post);

    newFiles[rel] = {
      md5: md5,
      integrated: true,
      post_abbrlink: abbrlink,
      post_path: path.relative(projectRoot, destPath)
    };
    synced++;
    console.log(`[qwenpaw-sync] ${old && old.md5 !== md5 ? '⟳' : '+'} ${rel} → ${newFiles[rel].post_path}`);
  }

  // Detect removed source files
  for (const rel of Object.keys(oldFiles)) {
    if (!newFiles[rel] && oldFiles[rel].integrated && oldFiles[rel].post_path) {
      const postPath = path.join(projectRoot, oldFiles[rel].post_path);
      if (fs.existsSync(postPath)) {
        console.log(`[qwenpaw-sync] Source removed, deleting post: ${oldFiles[rel].post_path}`);
        fs.unlinkSync(postPath);
        removed++;
      }
    }
  }

  fixPostLinks(postsDir, newFiles);
  fixChapterDates(postsDir);

  cache.files = newFiles;
  cache.source_root = sourceRoot;
  cache.generated_at = new Date().toISOString();
  atomicWrite(cachePath, JSON.stringify(cache, null, 2));

  console.log(`[qwenpaw-sync] Done: ${synced} synced, ${skipped} unchanged, ${removed} removed`);
}

// ----- Hexo integration -----

function registerHexoExtension(hexo) {
  const config = hexo.config.qwenpaw_book_sync || {};
  if (!config.enable) return;

  hexo.extend.filter.register('before_generate', function () {
    config.base_dir = hexo.base_dir;
    config.source_root = config.source_root ||
      '/Users/nadav/IdeaProjects/QwenPaw/book';
    syncBook(config);
  });
}

// If loaded as Hexo script
if (typeof hexo !== 'undefined') {
  registerHexoExtension(hexo);
}

// Run directly
if (require.main === module) {
  syncBook({
    source_root: '/Users/nadav/IdeaProjects/QwenPaw/book',
    base_dir: path.resolve(__dirname, '..')
  });
}

module.exports = { syncBook, registerHexoExtension };
