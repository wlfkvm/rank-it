import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// No dependencies or build step. Run from any directory with Node.js 18+.
const root = fileURLToPath(new URL('../public/', import.meta.url));
const origin = 'https://rank.it.kr';
const args = process.argv.slice(2);
assert(args.length === 0 || (args.length === 2 && args[0] === '--base-url'),
  'Usage: node scripts/check-social-meta.mjs [--base-url https://rank.it.kr]');
const base = args[1] ? new URL(args[1]) : null;
if (base) assert(['http:', 'https:'].includes(base.protocol), 'Expected an HTTP(S) base URL');

async function pages(dir = root) {
  const found = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) found.push(...await pages(file));
    else if (entry.name === 'index.html') found.push(file);
  }
  return found.sort();
}

// Read the literal head, as a crawler can, without running page JavaScript.
function metadata(html) {
  const head = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1];
  assert(head, 'Missing head');
  const markup = head.replace(/<!--[\s\S]*?-->|<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
  const result = new Map();
  function add(key, value) {
    assert(!result.has(key), `Duplicate ${key}`);
    assert(value?.trim(), `Empty ${key}`);
    result.set(key, value);
  }
  for (const tag of markup.matchAll(/<(meta|link)\b([^>]*?)>/gi)) {
    const attrs = Object.fromEntries([...tag[2].matchAll(/([\w:-]+)\s*=\s*(["'])(.*?)\2/g)]
      .map((attr) => [attr[1].toLowerCase(), attr[3]]));
    if (tag[1].toLowerCase() === 'meta') {
      const key = attrs.property || attrs.name;
      if (key === 'description' || /^(og:|twitter:)/.test(key || '')) {
        if (key.startsWith('og:')) assert(attrs.property, `${key} must use property`);
        if (key.startsWith('twitter:')) assert(attrs.name, `${key} must use name`);
        add(key, attrs.content);
      }
    } else if (attrs.rel === 'canonical') add('canonical', attrs.href);
  }
  const titles = [...markup.matchAll(/<title>([^<]*)<\/title>/gi)];
  assert.equal(titles.length, 1, 'Expected one title');
  add('title', titles[0][1]);
  return result;
}

async function response(url, type) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Twitterbot/1.0' },
    signal: AbortSignal.timeout(15000),
  });
  assert.equal(res.status, 200, `${url}: HTTP ${res.status}`);
  assert(res.headers.get('content-type')?.includes(type), `${url}: expected ${type}`);
  assert(!/noindex|none/i.test(res.headers.get('x-robots-tag') || ''), `${url}: blocked by X-Robots-Tag`);
  return res;
}

const urls = new Set();
const titles = new Set();
const descriptions = new Set();
const images = new Set();
const files = await pages();
for (const file of files) {
  const relative = path.relative(root, file).split(path.sep).join('/');
  const route = '/' + relative.replace(/index\.html$/, '');
  const meta = metadata(await readFile(file, 'utf8'));
  const expected = origin + route;
  for (const key of ['og:type', 'og:site_name', 'og:locale', 'og:title', 'og:description',
    'og:url', 'og:image', 'og:image:secure_url', 'og:image:type', 'og:image:width',
    'og:image:height', 'og:image:alt', 'twitter:card', 'twitter:title',
    'twitter:description', 'twitter:image', 'twitter:image:alt']) {
    assert(meta.has(key), `${route}: missing ${key}`);
  }
  assert.equal(meta.get('canonical'), expected, `${route}: canonical mismatch`);
  assert.equal(meta.get('og:url'), expected, `${route}: og:url mismatch`);
  assert.equal(meta.get('og:type'), 'website');
  assert.equal(meta.get('og:site_name'), '랭크잇');
  assert.equal(meta.get('og:locale'), 'ko_KR');
  assert.equal(meta.get('twitter:card'), 'summary_large_image');
  for (const prefix of ['og:', 'twitter:']) {
    assert.equal(meta.get(prefix + 'title'), meta.get('title'), `${route}: title mismatch`);
    assert.equal(meta.get(prefix + 'description'), meta.get('description'), `${route}: description mismatch`);
  }
  assert(!titles.has(meta.get('title')), `${route}: reused title`);
  assert(!descriptions.has(meta.get('description')), `${route}: reused description`);
  assert(meta.get('title').length <= 70, `${route}: title too long`);
  assert(meta.get('description').length <= 200, `${route}: description too long`);
  titles.add(meta.get('title'));
  descriptions.add(meta.get('description'));
  urls.add(expected);
  const image = new URL(meta.get('og:image'));
  assert.equal(image.origin, origin, `${route}: image must be an absolute first-party HTTPS URL`);
  assert(!image.search && !image.hash, 'Use a versioned image filename');
  assert.equal(meta.get('twitter:image'), image.href);
  assert.equal(meta.get('og:image:secure_url'), image.href);
  assert.equal(meta.get('twitter:image:alt'), meta.get('og:image:alt'));
  assert.equal(meta.get('og:image:type'), 'image/png');
  const bytes = await readFile(path.join(root, image.pathname));
  assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', 'Invalid PNG signature');
  assert.equal(bytes.toString('ascii', 12, 16), 'IHDR');
  assert.equal(bytes.readUInt32BE(16), 1200);
  assert.equal(bytes.readUInt32BE(20), 630);
  assert.equal(meta.get('og:image:width'), String(bytes.readUInt32BE(16)));
  assert.equal(meta.get('og:image:height'), String(bytes.readUInt32BE(20)));
  assert(bytes.length < 5 * 1024 * 1024, 'Share image must be under 5 MB');
  images.add(image.href);
  if (base) {
    const served = metadata(await (await response(new URL(route, base), 'text/html')).text());
    assert.deepEqual(served, meta, `${route}: served metadata differs from local files`);
  }
  console.log(`PASS ${route} — ${meta.get('title')}`);
}
const sitemap = await readFile(path.join(root, 'sitemap.xml'), 'utf8');
assert.deepEqual(urls, new Set([...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1])),
  'Sitemap and checked page URLs differ');
assert.equal(images.size, 1, 'Expected one common share image');
if (base) {
  for (const src of images) {
    const pathname = new URL(src).pathname;
    const bytes = Buffer.from(await (await response(new URL(pathname, base), 'image/png')).arrayBuffer());
    assert(bytes.equals(await readFile(path.join(root, pathname))), 'Served image differs from local PNG');
  }
  console.log(`PASS HTTP metadata and image content at ${base.origin}`);
}
console.log(`PASS ${files.length} pages; unique titles/descriptions; canonical URLs; one 1200×630 PNG`);
