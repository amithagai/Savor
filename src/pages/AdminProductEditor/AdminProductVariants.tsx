import { useState } from 'react'

import { ApiError, api } from '../../lib/api'
import type { ProductVariant } from '../../types/catalog'
import AdminModelPreview from './AdminModelPreview'

const MAX_GLB_FILE_SIZE_BYTES = 30 * 1024 * 1024
const GLB_FILE_TOO_LARGE_MESSAGE = 'הקובץ גדול מדי. ניתן להעלות מודל GLB בגודל של עד 30MB.'
const INVALID_GLB_FILE_MESSAGE = 'יש להעלות קובץ GLB בלבד.'

type Props = {
  productId: string
  token: string | null
  variants: ProductVariant[]
  onChange: (variants: ProductVariant[]) => void
}

type VariantDraft = {
  color_id: string
  color_label: string
  color_hex: string
  sku: string
  price: string
  sale_price: string
  inventory_tracking: boolean
  initial_stock: string
  stock_quantity: string
  low_stock_threshold: string
  allow_preorder: boolean
  model_url: string
  thumbnail_url: string
  is_active: boolean
  sort_order: string
}

const emptyDraft: VariantDraft = {
  color_id: '',
  color_label: '',
  color_hex: '#f2eee5',
  sku: '',
  price: '',
  sale_price: '',
  inventory_tracking: true,
  initial_stock: '0',
  stock_quantity: '0',
  low_stock_threshold: '5',
  allow_preorder: false,
  model_url: '',
  thumbnail_url: '',
  is_active: false,
  sort_order: '0',
}

function toDraft(variant: ProductVariant): VariantDraft {
  return {
    color_id: variant.color_id,
    color_label: variant.color_label,
    color_hex: String(variant.attributes?.color_hex || '#f2eee5'),
    sku: variant.sku,
    price: String(variant.price),
    sale_price: String(variant.sale_price ?? ''),
    inventory_tracking: variant.inventory_tracking,
    initial_stock: String(variant.initial_stock),
    stock_quantity: String(variant.stock_quantity),
    low_stock_threshold: String(variant.low_stock_threshold),
    allow_preorder: variant.allow_preorder,
    model_url: variant.model_url,
    thumbnail_url: variant.thumbnail_url || '',
    is_active: variant.is_active,
    sort_order: String(variant.sort_order),
  }
}

export default function AdminProductVariants({ productId, token, variants, onChange }: Props) {
  const [drafts, setDrafts] = useState<Record<string, VariantDraft>>({ new: emptyDraft })
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')

  const setDraftField = <K extends keyof VariantDraft>(key: string, field: K, value: VariantDraft[K]) => {
    setDrafts((current) => ({
      ...current,
      [key]: {
        ...(current[key] || (key === 'new'
          ? emptyDraft
          : toDraft(variants.find((variant) => variant.id === key)!))),
        [field]: value,
      },
    }))
  }

  const upload = async (key: string, kind: 'model_url' | 'thumbnail_url', file?: File) => {
    if (!file) return
    if (kind === 'model_url' && !file.name.toLowerCase().endsWith('.glb')) {
      setError(INVALID_GLB_FILE_MESSAGE)
      return
    }
    if (kind === 'model_url' && file.size > MAX_GLB_FILE_SIZE_BYTES) {
      setError(GLB_FILE_TOO_LARGE_MESSAGE)
      return
    }
    setBusy(`${key}-${kind}`)
    setError('')
    try {
      const result = await api.upload<{ url: string }>('/admin/media', file, token)
      setDraftField(key, kind, result.url)
    } catch (uploadError) {
      setError(uploadError instanceof ApiError ? uploadError.message : 'העלאת הקובץ נכשלה')
    } finally {
      setBusy('')
    }
  }

  const save = async (key: string) => {
    const draft = drafts[key]
    const price = Number(draft.price)
    const salePrice = draft.sale_price.trim() ? Number(draft.sale_price) : null
    const initialStock = Number(draft.initial_stock)
    const stockQuantity = Number(draft.stock_quantity)
    const lowStockThreshold = Number(draft.low_stock_threshold)
    if (!draft.color_id || !draft.color_label || !draft.sku || !draft.model_url || !Number.isFinite(price) || price <= 0) {
      setError('יש למלא צבע, שם צבע, מק״ט, מחיר ומודל GLB')
      return
    }
    if (salePrice != null && (!Number.isFinite(salePrice) || salePrice <= 0 || salePrice >= price)) {
      setError('מחיר המבצע חייב להיות נמוך מהמחיר הרגיל')
      return
    }
    if (![initialStock, stockQuantity, lowStockThreshold].every((value) => Number.isInteger(value) && value >= 0)) {
      setError('כמויות המלאי חייבות להיות מספרים שלמים ולא שליליים')
      return
    }
    setBusy(`${key}-save`)
    setError('')
    const payload = {
      color_id: draft.color_id.trim().toLowerCase(),
      color_label: draft.color_label.trim(),
      sku: draft.sku.trim(),
      price,
      sale_price: salePrice,
      inventory_tracking: draft.inventory_tracking,
      initial_stock: initialStock,
      stock_quantity: stockQuantity,
      low_stock_threshold: lowStockThreshold,
      allow_preorder: draft.allow_preorder,
      model_url: draft.model_url,
      thumbnail_url: draft.thumbnail_url || null,
      attributes: { color_hex: draft.color_hex },
      is_active: draft.is_active,
      sort_order: Number(draft.sort_order) || 0,
    }
    try {
      const saved = key === 'new'
        ? await api.post<ProductVariant>(`/admin/products/${productId}/variants`, payload, token)
        : await api.patch<ProductVariant>(`/admin/products/${productId}/variants/${key}`, payload, token)
      const next = key === 'new'
        ? [...variants, saved]
        : variants.map((variant) => variant.id === saved.id ? saved : variant)
      onChange(next.sort((first, second) => first.sort_order - second.sort_order))
      setDrafts((current) => ({
        ...current,
        new: key === 'new' ? emptyDraft : current.new,
        [saved.id]: toDraft(saved),
      }))
    } catch (saveError) {
      setError(saveError instanceof ApiError ? saveError.message : 'שמירת הווריאציה נכשלה')
    } finally {
      setBusy('')
    }
  }

  const remove = async (variant: ProductVariant) => {
    if (!window.confirm(`למחוק את וריאציית ${variant.color_label}?`)) return
    setBusy(`${variant.id}-delete`)
    setError('')
    try {
      await api.delete(`/admin/products/${productId}/variants/${variant.id}`, token)
      onChange(variants.filter((item) => item.id !== variant.id))
      setDrafts((current) => {
        const next = { ...current }
        delete next[variant.id]
        return next
      })
    } catch (deleteError) {
      setError(deleteError instanceof ApiError ? deleteError.message : 'מחיקת הווריאציה נכשלה')
    } finally {
      setBusy('')
    }
  }

  const cards = [...variants.map((variant) => ({ key: variant.id, variant })), { key: 'new', variant: null }]

  return (
    <section className="admin-product-editor__card admin-variants">
      <div className="admin-variants__heading">
        <div>
          <h2>דגמי הקונפיגורטור לפי צבע</h2>
          <p className="admin-product-editor__hint">כל צבע הוא וריאציה מלאה עם מחיר, מק״ט וקובץ GLB משלו.</p>
        </div>
        <span>{variants.length} וריאציות</span>
      </div>
      {error && <div className="admin-product-editor__error" role="alert">{error}</div>}

      <div className="admin-variants__list">
        {cards.map(({ key, variant }) => {
          const draft = drafts[key] || (variant ? toDraft(variant) : emptyDraft)
          return (
            <article className="admin-variant" key={key}>
              <div className="admin-variant__preview">
                {draft.model_url
                  ? <AdminModelPreview key={draft.model_url} url={draft.model_url} />
                  : <div className="admin-variant__preview-state">טרם הועלה מודל</div>}
              </div>
              <div className="admin-variant__fields">
                <div className="admin-product-editor__grid">
                  <label className="admin-product-editor__field">מזהה צבע
                    <input dir="ltr" value={draft.color_id} onChange={(event) => setDraftField(key, 'color_id', event.target.value.replace(/[^a-z0-9-]/g, ''))} placeholder="cream" />
                  </label>
                  <label className="admin-product-editor__field">שם צבע
                    <input value={draft.color_label} onChange={(event) => setDraftField(key, 'color_label', event.target.value)} placeholder="CREAM" />
                  </label>
                  <label className="admin-product-editor__field">מק״ט וריאציה
                    <input dir="ltr" value={draft.sku} onChange={(event) => setDraftField(key, 'sku', event.target.value)} />
                  </label>
                  <label className="admin-product-editor__field">מחיר
                    <div className="admin-product-editor__price-input"><input type="number" min="1" value={draft.price} onChange={(event) => setDraftField(key, 'price', event.target.value)} /><span>₪</span></div>
                  </label>
                  <label className="admin-product-editor__field">מחיר מבצע (אופציונלי)
                    <div className="admin-product-editor__price-input"><input type="number" min="1" value={draft.sale_price} onChange={(event) => setDraftField(key, 'sale_price', event.target.value)} placeholder="ללא מבצע" /><span>₪</span></div>
                  </label>
                  <label className="admin-product-editor__field">כמות התחלתית
                    <input type="number" min="0" step="1" value={draft.initial_stock} onChange={(event) => { setDraftField(key, 'initial_stock', event.target.value); if (key === 'new') setDraftField(key, 'stock_quantity', event.target.value) }} />
                  </label>
                  <label className="admin-product-editor__field">מלאי נוכחי
                    <input type="number" min="0" step="1" value={draft.stock_quantity} onChange={(event) => setDraftField(key, 'stock_quantity', event.target.value)} />
                  </label>
                  <label className="admin-product-editor__field">התראת מלאי נמוך
                    <input type="number" min="0" step="1" value={draft.low_stock_threshold} onChange={(event) => setDraftField(key, 'low_stock_threshold', event.target.value)} />
                  </label>
                  <label className="admin-product-editor__field">צבע לתצוגה
                    <input type="color" value={draft.color_hex} onChange={(event) => setDraftField(key, 'color_hex', event.target.value)} />
                  </label>
                  <label className="admin-product-editor__field">סדר תצוגה
                    <input type="number" min="0" value={draft.sort_order} onChange={(event) => setDraftField(key, 'sort_order', event.target.value)} />
                  </label>
                </div>

                <div className="admin-variant__uploads">
                  <label className="admin-variant__upload">
                    <input type="file" accept=".glb,model/gltf-binary" disabled={busy !== ''} onChange={(event) => upload(key, 'model_url', event.target.files?.[0])} />
                    <strong>{busy === `${key}-model_url` ? 'מעלה מודל…' : draft.model_url ? 'החלפת מודל GLB' : 'העלאת מודל GLB'}</strong>
                    <span>קובץ GLB עצמאי בלבד, עד 30MB</span>
                  </label>
                  <label className="admin-variant__upload admin-variant__upload--thumb">
                    <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" disabled={busy !== ''} onChange={(event) => upload(key, 'thumbnail_url', event.target.files?.[0])} />
                    <strong>{busy === `${key}-thumbnail_url` ? 'מעלה תמונה…' : 'העלאת thumbnail'}</strong>
                    <span>{draft.thumbnail_url ? 'קיימת תמונה' : 'אופציונלי'}</span>
                  </label>
                </div>

                <div className="admin-variant__footer">
                  <div className="admin-variant__toggles">
                    <label className="admin-product-editor__toggle">
                      <input type="checkbox" checked={draft.is_active} onChange={(event) => setDraftField(key, 'is_active', event.target.checked)} />
                      <span>{draft.is_active ? 'מפורסם בקונפיגורטור' : 'טיוטה'}</span>
                    </label>
                    <label className="admin-product-editor__toggle">
                      <input type="checkbox" checked={draft.inventory_tracking} onChange={(event) => setDraftField(key, 'inventory_tracking', event.target.checked)} />
                      <span>מעקב מלאי</span>
                    </label>
                    <label className="admin-product-editor__toggle">
                      <input type="checkbox" checked={draft.allow_preorder} onChange={(event) => setDraftField(key, 'allow_preorder', event.target.checked)} />
                      <span>Pre-order</span>
                    </label>
                  </div>
                  <div>
                    {variant && <button type="button" className="admin-variant__delete" disabled={busy !== ''} onClick={() => remove(variant)}>מחיקה</button>}
                    <button type="button" className="admin-product-editor__primary" disabled={busy !== ''} onClick={() => save(key)}>
                      {busy === `${key}-save` ? 'שומר…' : variant ? 'שמירת וריאציה' : '+ הוספת וריאציה'}
                    </button>
                  </div>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
