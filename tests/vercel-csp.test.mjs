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
  assert.deepEqual(directive('script-src'), ["'self'", "'wasm-unsafe-eval'"])
  assert.deepEqual(directive('worker-src'), ["'self'", 'blob:'])
  assert(!directive('script-src').includes("'unsafe-eval'"))
})

test('CSP permits model and decoder downloads from the configured providers', () => {
  const connections = directive('connect-src')

  for (const source of [
    "'self'",
    'https://*.backblazeb2.com',
    'https://res.cloudinary.com',
    'https://www.gstatic.com',
    'https://raw.githack.com',
  ]) {
    assert(connections.includes(source), `connect-src is missing ${source}`)
  }
})
