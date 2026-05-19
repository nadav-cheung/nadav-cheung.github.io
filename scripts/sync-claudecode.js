'use strict';

/**
 * Sync Claude Code book chapters from source repository into Hexo blog posts.
 *
 * Usage (standalone):
 *   node scripts/sync-claudecode.js
 *
 * Config in _config.yml:
 *   claudecode_book_sync:
 *     enable: true
 *     source_root: /Users/nadav/IdeaProjects/claudeai/teaching/book
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const CACHE_FILE = '.claudecode-cache.json';

// Only chapters and appendices (exclude README)
const CHAPTER_PATTERNS = [
  /^卷[零一二三四五]-.*\/第.+\.md$/,
  /^附录\/附录.+\.md$/,
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
  // 卷零 (1-2)
  '第01章-你和AI的第一次对话.md': 1,
  '第02章-什么是Agentic-Loop.md': 2,
  // 卷一 (3-16)
  '第03章-准备工具箱.md': 3,
  '第04章-回车键之后.md': 4,
  '第05章-消息被装进信封.md': 5,
  '第06章-工具的注册与发现.md': 6,
  '第07章-信封飞向远方.md': 7,
  '第08章-文字一个字一个字地回来.md': 8,
  '第09章-AI说要执行命令.md': 9,
  '第10章-命令真的被执行了.md': 10,
  '第11章-你确定吗.md': 11,
  '第12章-结果回到AI手中.md': 12,
  '第13章-对话越来越长.md': 13,
  '第14章-屏幕上的每一帧.md': 14,
  '第15章-循环的终点与起点.md': 15,
  '第16章-你的第一次追踪.md': 16,
  // 卷二 (17-28)
  '第17章-打开引擎室的门.md': 17,
  '第18章-主入口一切的起点.md': 18,
  '第19章-React在终端里奔跑.md': 19,
  '第20章-工具的DNA.md': 20,
  '第21章-工具执行引擎.md': 21,
  '第22章-安全门卫.md': 22,
  '第23章-斜杠命令与插件系统.md': 23,
  '第24章-Hook系统.md': 24,
  '第25章-外部世界的入口.md': 25,
  '第26章-Agent的克隆与协作.md': 26,
  '第27章-跨越会话的记忆.md': 27,
  '第28章-API通信的暗面.md': 28,
  // 卷三 (29-40)
  '第29章-搭建你的工坊.md': 29,
  '第30章-第一次修改.md': 30,
  '第31章-创建你的第一个工具.md': 31,
  '第32章-处理用户输入-Zod验证.md': 32,
  '第33章-添加权限规则.md': 33,
  '第34章-接入MCP-Server.md': 34,
  '第35章-构建多Agent协作.md': 35,
  '第36章-开发完整插件.md': 36,
  '第37章-编写测试.md': 37,
  '第38章-调试的艺术.md': 38,
  '第39章-从代码到贡献.md': 39,
  '第40章-第一个真实贡献.md': 40,
  // 卷四 (41-52, 52.5, 53)
  '第41章-为什么是TypeScript.md': 41,
  '第42章-为什么是React-Ink.md': 42,
  '第43章-为什么用Zod.md': 43,
  '第44章-工具系统的演进.md': 44,
  '第45章-安全与便利的平衡.md': 45,
  '第46章-有限窗口的智慧.md': 46,
  '第47章-为什么query.ts是大AsyncGenerator.md': 47,
  '第48章-Agent架构的取舍.md': 48,
  '第49章-开放协议的价值.md': 49,
  '第50章-性能的故事.md': 50,
  '第51章-安全的纵深防御.md': 51,
  '第52章-稳定历史与未来.md': 52,
  '第52.5章-Token经济学.md': 53,
  // 卷五 (54-67)
  '第53章-一个HTTP请求之外.md': 54,
  '第54章-消息的形状.md': 55,
  '第55章-文字如溪流.md': 56,
  '第56章-工具调用的双面人生.md': 57,
  '第57章-MCP的双面.md': 58,
  '第58章-MCP原语的三位一体.md': 59,
  '第59章-思维被拉长了.md': 60,
  '第60章-聪明的缓存.md': 61,
  '第61章-输出的精确控制.md': 62,
  '第62章-配置的多重宇宙.md': 63,
  '第63章-循环的引擎.md': 64,
  '第64章-工具的路由与调度.md': 65,
  '第65章-技能的编织.md': 66,
  '第66章-你的Agent框架.md': 67,
  // 附录 (68-78)
  '附录A-TypeScript速成.md': 68,
  '附录B-Java到TypeScript迁移.md': 69,
  '附录C-术语表.md': 70,
  '附录D-命令速查与源码路径.md': 71,
  '附录E-AI生态全景图.md': 72,
  '附录F-AI概念关系形式化分析.md': 73,
  '附录G-AI评估与Agent-Benchmarking.md': 74,
  '附录H-Agent框架的CI-CD与配置管理.md': 75,
  '附录I-向量数据库-Agent的记忆引擎.md': 76,
  '附录J-分布式Agent架构.md': 77,
  '附录K-Prompt-Engineering系统工程.md': 78,
};

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
    console.error('[claudecode-sync] source_root not found:', sourceRoot);
    return;
  }

  const projectRoot = config.base_dir || process.cwd();
  const cachePath = path.join(projectRoot, CACHE_FILE);
  const postsDir = path.join(projectRoot, 'source', '_posts', 'claudecode-book');

  let cache = {};
  try {
    if (fs.existsSync(cachePath)) {
      cache = JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
    }
  } catch (e) {
    console.warn('[claudecode-sync] Could not load cache, starting fresh');
  }
  const oldFiles = cache.files || {};
  const newFiles = {};

  fs.mkdirSync(postsDir, { recursive: true });

  let synced = 0, skipped = 0, removed = 0;

  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
        continue;
      }
      if (entry.name === '.DS_Store') continue;

      const rel = path.relative(sourceRoot, full);
      if (!isChapter(rel)) {
        newFiles[rel] = { md5: md5File(full), integrated: false };
        continue;
      }

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
      const fname = path.basename(rel);
      const destPath = path.join(postsDir, fname);

      const chapter = CHAPTER_ORDER[fname];
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
      console.log(`[claudecode-sync] ${old && old.md5 !== md5 ? '⟳' : '+'} ${rel} → ${newFiles[rel].post_path}`);
    }
  }

  walk(sourceRoot);

  for (const rel of Object.keys(oldFiles)) {
    if (!newFiles[rel] && oldFiles[rel].integrated && oldFiles[rel].post_path) {
      const postPath = path.join(projectRoot, oldFiles[rel].post_path);
      if (fs.existsSync(postPath)) {
        console.log(`[claudecode-sync] Source removed, deleting post: ${oldFiles[rel].post_path}`);
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

  console.log(`[claudecode-sync] Done: ${synced} synced, ${skipped} unchanged, ${removed} removed`);
}

// ----- Hexo integration -----

function registerHexoExtension(hexo) {
  const config = hexo.config.claudecode_book_sync || {};
  if (!config.enable) return;

  hexo.extend.filter.register('before_generate', function () {
    config.base_dir = hexo.base_dir;
    config.source_root = config.source_root ||
      '/Users/nadav/IdeaProjects/claudeai/teaching/book';
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
    source_root: '/Users/nadav/IdeaProjects/claudeai/teaching/book',
    base_dir: path.resolve(__dirname, '..')
  });
}

module.exports = { syncBook, registerHexoExtension };
