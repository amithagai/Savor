import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const editorSource = readFileSync(new URL('../src/pages/AdminProductEditor/index.tsx', import.meta.url), 'utf8')
const variantsSource = readFileSync(new URL('../src/pages/AdminProductEditor/AdminProductVariants.tsx', import.meta.url), 'utf8')

test('saving product details does not overwrite a concurrently saved variant snapshot', () => {
  const saveStart = editorSource.indexOf('const handleSave = async')
  const saveEnd = editorSource.indexOf('const uploadInstallationPdf', saveStart)
  const saveSource = editorSource.slice(saveStart, saveEnd)

  assert.doesNotMatch(saveSource, /setVariants\(result\.variants/)
})

test('a failed create reloads and adopts an already persisted matching variant', () => {
  assert.match(variantsSource, /api\.get<AdminProductDetail>\(`\/admin\/products\/\$\{productId\}`\)/)
  assert.match(variantsSource, /normalizeColorId\(variant\.color_id\) === colorId/)
  assert.match(variantsSource, /variant\.sku\.trim\(\)\.toLowerCase\(\) === payload\.sku\.toLowerCase\(\)/)
  assert.match(variantsSource, /setNotice\(VARIANT_RECOVERED_MESSAGE\)/)
})
