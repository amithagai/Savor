import assert from 'node:assert/strict'
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
