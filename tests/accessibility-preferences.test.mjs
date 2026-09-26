import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'

const source = await readFile(new URL('../src/components/AccessibilityWidget/preferences.ts', import.meta.url), 'utf8')
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } })
const { defaults, normalizePreferences, profiles } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`)

test('stored preferences are validated before they affect page styles', () => {
  const result = normalizePreferences({ fontSize: 900, lineSpacing: -9, zoom: NaN, wordSpacing: 2.7, contrast: 'url(evil)', background: 'red;display:none', text: '#123abc', links: 'true', readable: true, arbitrary: true })
  assert.equal(result.fontSize, 5)
  assert.equal(result.lineSpacing, 0)
  assert.equal(result.zoom, 0)
  assert.equal(result.wordSpacing, 3)
  assert.equal(result.contrast, 'none')
  assert.equal(result.background, '')
  assert.equal(result.text, '#123abc')
  assert.equal(result.links, false)
  assert.equal(result.readable, true)
  assert.equal('arbitrary' in result, false)
})

test('missing and malformed preference values leave the site unchanged', () => {
  for (const value of [null, undefined, false, 'bad', 42, []]) assert.deepEqual(normalizePreferences(value), defaults)
  const copy = normalizePreferences(null)
  copy.fontSize = 5
  assert.equal(defaults.fontSize, 0)
})

test('all offered accessibility profiles produce supported preferences', () => {
  assert.equal(new Set(profiles.map(profile => profile.id)).size, profiles.length)
  for (const profile of profiles) {
    const combined = { ...defaults, ...profile.values }
    assert.deepEqual(normalizePreferences(combined), combined, profile.id)
  }
})
