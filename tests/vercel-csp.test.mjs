import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const vercelConfig = JSON.parse(
  await readFile(new URL('../vercel.json', import.meta.url), 'utf8'),
)

const siteHeaders = vercelConfig.headers.find(({ source }) => source === '/(.*)')?.headers ?? []
const policy = siteHeaders.find(({ key }) => key === 'Content-Security-Policy')?.value ?? ''

function directive(name) {
  const value = policy
    .split(';')
    .map((entry) => entry.trim())
    .find((entry) => entry === name || entry.startsWith(`${name} `))

  return value?.split(/\s+/).slice(1) ?? []
}

test('CSP allows the exact inline GTM bootstrap without allowing arbitrary inline scripts', async () => {
  // Browsers normalize CRLF before hashing inline script text.
  // Set CSP_HTML_PATH=dist/index.html to also validate the production build.
  const html = (await readFile(process.env.CSP_HTML_PATH ?? new URL('../index.html', import.meta.url), 'utf8'))
    .replace(/\r\n?/g, '\n')
  const bootstrap = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)]
    .map((match) => match[1])
    .filter((script) => script.includes('GTM-T7LL35J4'))
  assert.equal(bootstrap.length, 1, 'Expected exactly one inline GTM bootstrap')
  const hash = createHash('sha256').update(bootstrap[0]).digest('base64')
  assert(directive('script-src').includes(`'sha256-${hash}'`), 'GTM bootstrap is blocked by CSP')
  assert(!directive('script-src').includes("'unsafe-inline'"))
  assert(!directive('script-src').includes("'unsafe-eval'"))
})

test('CSP allows GTM loading, connections, noscript iframe and preview resources', () => {
  for (const name of ['script-src', 'connect-src', 'frame-src', 'style-src']) {
    assert(directive(name).includes('https://www.googletagmanager.com'), `${name} blocks GTM`)
  }
  assert(directive('connect-src').includes('https://www.google.com'))
  assert(directive('script-src').includes('https://tagmanager.google.com'))
  assert(directive('style-src').includes('https://tagmanager.google.com'))
  assert(directive('font-src').includes('data:'))
})

test('CSP permits the GLTF decoders without enabling JavaScript eval', () => {
  const scripts = directive('script-src')

  assert(scripts.includes("'self'"))
  assert(scripts.includes("'wasm-unsafe-eval'"))
  assert.deepEqual(directive('worker-src'), ["'self'", 'blob:'])
  assert(!scripts.includes("'unsafe-eval'"))
})

test('CSP permits model and decoder downloads from the configured providers', () => {
  const connections = directive('connect-src')

  for (const source of [
    "'self'",
    'blob:',
    'https://*.backblazeb2.com',
    'https://res.cloudinary.com',
    'https://www.gstatic.com',
    'https://raw.githack.com',
    'https://raw.githubusercontent.com',
  ]) {
    assert(connections.includes(source), `connect-src is missing ${source}`)
  }
})

test('CSP permits the LogRocket SDK and session ingest endpoints', () => {
  const scripts = directive('script-src')
  const connections = directive('connect-src')

  for (const source of [
    'https://cdn.logrocket.io',
    'https://cdn.lr-ingest.io',
    'https://cdn.lr-in.com',
    'https://cdn.lr-in-prod.com',
    'https://cdn.lr-ingest.com',
    'https://cdn.ingest-lr.com',
    'https://cdn.lr-intake.com',
    'https://cdn.intake-lr.com',
    'https://cdn.logr-ingest.com',
    'https://cdn.lrkt-in.com',
    'https://cdn.lgrckt-in.com',
    'https://cdn.logr-in.com',
  ]) {
    assert(scripts.includes(source), `script-src is missing ${source}`)
  }

  for (const source of [
    'https://*.logrocket.io',
    'https://*.lr-ingest.io',
    'https://*.logrocket.com',
    'https://*.lr-in.com',
    'https://*.lr-in-prod.com',
    'https://*.lr-ingest.com',
    'https://*.ingest-lr.com',
    'https://*.lr-intake.com',
    'https://*.intake-lr.com',
    'https://*.logr-ingest.com',
    'https://*.lrkt-in.com',
    'https://*.lgrckt-in.com',
    'https://*.logr-in.com',
  ]) {
    assert(connections.includes(source), `connect-src is missing ${source}`)
  }

  assert.deepEqual(directive('child-src'), ["'self'", 'blob:'])
})
