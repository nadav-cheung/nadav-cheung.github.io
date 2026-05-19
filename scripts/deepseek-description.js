'use strict';

const fs = require('fs');
const path = require('path');
const https = require('https');

const CACHE_FILE = path.join(hexo.base_dir, '.deepseek-cache.json');
const CONFIG_KEY = 'deepseek_description';

function getConfig() {
  const cfg = hexo.config[CONFIG_KEY] || {};
  const provider = cfg.provider || 'openai';
  return {
    enable: cfg.enable !== false,
    provider,
    apiKey: cfg.api_key || process.env.DEEPSEEK_API_KEY || '',
    baseUrl: cfg.base_url || (provider === 'anthropic'
      ? 'https://api.deepseek.com/anthropic'
      : 'https://api.deepseek.com'),
    model: cfg.model || (provider === 'anthropic'
      ? 'deepseek-v4-pro[1m]'
      : 'deepseek-chat')
  };
}

function loadCache() {
  try {
    if (fs.existsSync(CACHE_FILE)) return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
  } catch (_) {}
  return {};
}

function saveCache(cache) {
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf-8');
}

function httpsPost(urlStr, headers, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function callLLM(config, prompt) {
  const body = config.provider === 'anthropic'
    ? JSON.stringify({ model: config.model, max_tokens: 4096, messages: [{ role: 'user', content: prompt }] })
    : JSON.stringify({ model: config.model, messages: [{ role: 'user', content: prompt }], max_tokens: 256, temperature: 0.3 });

  const headers = config.provider === 'anthropic'
    ? { 'x-api-key': config.apiKey, 'anthropic-version': '2023-06-01' }
    : { 'Authorization': `Bearer ${config.apiKey}` };

  const endpoint = config.provider === 'anthropic'
    ? config.baseUrl + '/v1/messages'
    : config.baseUrl + '/chat/completions';

  const data = await httpsPost(endpoint, headers, body);
  const json = JSON.parse(data);

  if (config.provider === 'anthropic') {
    if (json.content) {
      const textBlock = json.content.find(b => b.type === 'text');
      if (textBlock && textBlock.text) return textBlock.text.trim();
    }
  } else {
    if (json.choices && json.choices[0] && json.choices[0].message) {
      return json.choices[0].message.content.trim();
    }
  }

  if (json.error) throw new Error(`API error: ${json.error.message || JSON.stringify(json.error)}`);
  throw new Error(`Unexpected response: ${data.slice(0, 300)}`);
}

function extractContent(text) {
  text = text.replace(/<!-- more -->/gi, '');
  text = text.replace(/!\[.*?\]\(.*?\)/g, '');
  text = text.replace(/```[\s\S]*?```/g, '');
  text = text.replace(/<[^>]+>/g, '');
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  text = text.replace(/[#*_`~>|]/g, '');
  text = text.replace(/\n{2,}/g, '\n');
  return text.slice(0, 4000).trim();
}

function parseFrontMatter(raw) {
  const start = raw.indexOf('---');
  if (start === -1) return null;
  const end = raw.indexOf('\n---', start + 3);
  if (end === -1) return null;
  return {
    fm: raw.slice(start + 3, end),
    body: raw.slice(end + 4),
    end
  };
}

function needsValue(fm, key) {
  const re = new RegExp(`^${key}:\\s*(.+)$`, 'm');
  const m = fm.match(re);
  if (!m) return true;
  const val = m[1].trim().replace(/^['"]|['"]$/g, '');
  return val.length === 0;
}

function needsList(fm, key) {
  const inline = fm.match(new RegExp(`${key}:\\s*\\[([^\\]]*)\\]`));
  if (inline && inline[1].trim()) return false;
  const block = fm.match(new RegExp(`${key}:\\s*\\n(\\s+-\\s+\\S)`));
  return !block;
}

function sanitizeYaml(val) {
  return val.replace(/\x60{3,}/g, '').replace(/[<>|&`]/g, '').trim();
}

function removeEmptyKey(fm, key) {
  return fm.replace(new RegExp(`^${key}:\\s*\\n(?!\\s*-)`, 'gm'), '');
}

function atomicWrite(filePath, content) {
  const tmp = filePath + '.tmp';
  fs.writeFileSync(tmp, content, 'utf-8');
  fs.renameSync(tmp, filePath);
}

hexo.extend.filter.register('before_generate', async function () {
  const config = getConfig();
  if (!config.enable) return;
  if (!config.apiKey) {
    hexo.log.warn('[deepseek-ai] No API key. Set DEEPSEEK_API_KEY env var.');
    return;
  }

  const cache = loadCache();
  const postsDir = path.join(hexo.source_dir, '_posts');
  let descGenerated = 0, tagsGenerated = 0, catsGenerated = 0, fromCache = 0;

  const files = [];
  (function collect(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) { collect(full); continue; }
      if (entry.name.endsWith('.md')) files.push(full);
    }
  })(postsDir);

  for (const full of files) {
    const raw = fs.readFileSync(full, 'utf-8');
    const parsed = parseFrontMatter(raw);
    if (!parsed) continue;

    let { fm, body } = parsed;

    const abbrMatch = fm.match(/abbrlink:\s*['"]?(\S+)/);
    const abbrlink = abbrMatch ? abbrMatch[1] : null;
    const key = abbrlink || full;

    const titleMatch = fm.match(/title:\s*['"]?(.+?)[\n'"]?$/m);
    const title = titleMatch ? titleMatch[1].trim() : path.basename(full);
    const content = extractContent(body);
    if (content.length < 50) continue;

    let modified = false;

    if (needsValue(fm, 'description')) {
      const cacheKey = `desc:${key}`;
      if (cache[cacheKey]) {
        const desc = cache[cacheKey].replace(/"/g, '\\"');
        fm += `\ndescription: "${desc}"`;
        fromCache++;
        modified = true;
      } else {
        try {
          hexo.log.info(`[deepseek-ai] desc → ${title}`);
          const desc = sanitizeYaml(await callLLM(config, `请为以下技术博客文章生成一段 80-120 字的中文摘要，直接输出摘要文本，不要加引号、标题或任何前缀：\n\n${content}`));
          fm += `\ndescription: "${desc.replace(/"/g, '\\"')}"`;
          cache[cacheKey] = desc;
          descGenerated++;
          modified = true;
          await new Promise(r => setTimeout(r, 300));
        } catch (e) {
          hexo.log.error(`[deepseek-ai] desc failed "${title}": ${e.message}`);
        }
      }
    }

    if (needsList(fm, 'categories')) {
      fm = removeEmptyKey(fm, 'categories');
      const cacheKey = `cats:${key}`;
      if (cache[cacheKey]) {
        fm += `\n${cache[cacheKey]}`;
        fromCache++;
        modified = true;
      } else {
        try {
          hexo.log.info(`[deepseek-ai] categories → ${title}`);
          const resp = await callLLM(config, `请为以下技术博客文章分配合适的分类。只能从以下分类中选择一个：\n- 算法与数据结构\n- LeetCode刷题笔记\n\n直接输出 YAML 格式的 categories 字段（如 "categories:\\n  - 算法与数据结构"），不要加其他内容：\n\n${content}`);
          const catsMatch = resp.match(/categories:\s*\n(\s+-\s+.+)/s);
          if (catsMatch) {
            const catsYaml = `categories:\n${catsMatch[1].trim().split('\n').map(c => '  - ' + sanitizeYaml(c.replace(/^\s*-\s*/, ''))).filter(c => c !== '  - ').join('\n')}`;
            fm += `\n${catsYaml}`;
            cache[cacheKey] = catsYaml;
            catsGenerated++;
            modified = true;
          }
          await new Promise(r => setTimeout(r, 300));
        } catch (e) {
          hexo.log.error(`[deepseek-ai] categories failed "${title}": ${e.message}`);
        }
      }
    }

    if (needsList(fm, 'tags')) {
      fm = removeEmptyKey(fm, 'tags');
      const cacheKey = `tags:${key}`;
      if (cache[cacheKey]) {
        fm += `\n${cache[cacheKey]}`;
        fromCache++;
        modified = true;
      } else {
        try {
          hexo.log.info(`[deepseek-ai] tags → ${title}`);
          const resp = await callLLM(config, `请为以下技术博客文章生成 3-5 个标签。要求：直接输出 YAML 格式的 tags 字段（如 "tags:\\n  - 标签1\\n  - 标签2"），不要加其他内容：\n\n${content}`);
          const tagsMatch = resp.match(/tags:\s*\n(\s+-\s+.+)/s);
          if (tagsMatch) {
            const tagsYaml = `tags:\n${tagsMatch[1].trim().split('\n').map(t => '  - ' + sanitizeYaml(t.replace(/^\s*-\s*/, ''))).filter(t => t !== '  - ').join('\n')}`;
            fm += `\n${tagsYaml}`;
            cache[cacheKey] = tagsYaml;
            tagsGenerated++;
            modified = true;
          }
          await new Promise(r => setTimeout(r, 300));
        } catch (e) {
          hexo.log.error(`[deepseek-ai] tags failed "${title}": ${e.message}`);
        }
      }
    }

    if (modified) {
      atomicWrite(full, '---\n' + fm + '\n---' + body);
    }
  }

  if (descGenerated + tagsGenerated + catsGenerated > 0) saveCache(cache);
  if (descGenerated + tagsGenerated + catsGenerated + fromCache > 0) {
    hexo.log.info(`[deepseek-ai] ${descGenerated} desc, ${tagsGenerated} tags, ${catsGenerated} categories generated, ${fromCache} from cache.`);
  }
});
