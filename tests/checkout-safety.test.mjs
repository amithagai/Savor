import assert from 'node:assert/strict'
import test from 'node:test'

import { apiErrorFields, formatApiErrorDetail } from '../src/lib/apiError.ts'
import { isCartReferenceValid, sanitizeStoredCart } from '../src/lib/cartStorage.ts'
import { normalizeCheckoutText, normalizeIsraeliMobile } from '../src/lib/checkoutInput.ts'

const productId = '5e93ad71-3750-4c6d-8df9-3f64c81e9b6f'

test('formats FastAPI validation details without object coercion', () => {
  const message = formatApiErrorDetail([
    { type: 'uuid_type', loc: ['body', 'product_id'], msg: 'UUID input should be a string' },
  ], 'Unprocessable Entity')

  assert.equal(message, 'UUID input should be a string')
  assert.notEqual(message, '[object Object]')
  assert.deepEqual(apiErrorFields([
    { loc: ['body', 'shipping_address', 'phone'], msg: 'Invalid phone' },
  ]), ['phone'])
})

test('uses nested messages and a safe fallback for unknown API errors', () => {
  assert.equal(formatApiErrorDetail({ detail: { message: 'Try again' } }, 'fallback'), 'Try again')
  assert.equal(formatApiErrorDetail({ input: { email: 'private@example.com' } }, 'fallback'), 'fallback')
})

test('keeps current cart items and drops legacy numeric IDs', () => {
  const cart = sanitizeStoredCart([
    { id: productId, name: 'Current product', quantity: 1, price: 10 },
    { id: 1, name: 'Legacy product', quantity: 1, price: 10 },
  ])

  assert.equal(cart.length, 1)
  assert.equal(cart[0].id, productId)
})

test('drops malformed cart references and quantities', () => {
  assert.deepEqual(sanitizeStoredCart([
    { id: productId, name: 'Bad variant', variantId: '', quantity: 1, price: 10 },
    { id: productId, name: 'Bad quantity', quantity: 101, price: 10 },
  ]), [])
  assert.equal(isCartReferenceValid({ id: productId, variantId: '' }), false)
})

test('normalizes mobile autofill before validation and submission', () => {
  assert.equal(normalizeIsraeliMobile('050\u00a0377-5626'), '0503775626')
  assert.equal(normalizeIsraeliMobile('+972 50 377 5626'), '0503775626')
  assert.equal(normalizeIsraeliMobile('050abc3775626'), '')
  assert.equal(normalizeCheckoutText('  עמית\u00a0  חגי  '), 'עמית חגי')
})
