import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const source = readFileSync(new URL('../src/pages/Configurator/index.tsx', import.meta.url), 'utf8')

test('the configurator refreshes published products when the page becomes active again', () => {
  assert.match(source, /window\.addEventListener\('focus', loadProducts\)/)
  assert.match(source, /document\.addEventListener\('visibilitychange', refreshVisibleCatalog\)/)
  assert.match(source, /document\.visibilityState === 'visible'/)
})

test('catalog refresh listeners are removed when leaving the configurator', () => {
  assert.match(source, /window\.removeEventListener\('focus', loadProducts\)/)
  assert.match(source, /document\.removeEventListener\('visibilitychange', refreshVisibleCatalog\)/)
})
