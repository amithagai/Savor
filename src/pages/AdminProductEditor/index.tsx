import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import './AdminProductEditor.css'
import { ApiError, api } from '../../lib/api'
import { DEFAULT_IMAGE_DISPLAY, IMAGE_DISPLAY_ATTRIBUTE, parseImageDisplayMap } from '../../lib/imageDisplay'
import { useAdminAuth } from '../../context/useAdminAuth'
import type { AdminProductDetail, Category, ImageDisplayMap, ImageDisplaySettings, ProductType, ProductVariant } from '../../types/catalog'
import AdminProductVariants from './AdminProductVariants'

type FormState = {
  name: string
  slug: string
  description: string
  product_type: ProductType
  category_id: string
  price: string
  sale_price: string
  size: string
  model: string
  color: string
  material: string
  delivery_days: string
  sku: string
  inventory_tracking: boolean
  initial_stock: string
  stock_quantity: string
  low_stock_threshold: string
  allow_preorder: boolean
  configurator_enabled: boolean
  configurator_category: string
  configurator_subtitle: string
  width_cm: string
  height_cm: string
  depth_cm: string
  images: string[]
  image_display: ImageDisplayMap
  installation_pdf_url: string
  is_active: boolean
}

const emptyForm: FormState = {
  name: '', slug: '', description: '', product_type: 'KITCHEN', category_id: '', price: '', sale_price: '',
  size: '', model: '', color: '', material: '', delivery_days: '14', sku: '', images: [], image_display: {},
  inventory_tracking: true, initial_stock: '0', stock_quantity: '0', low_stock_threshold: '5', allow_preorder: false,
  configurator_enabled: false, configurator_category: 'תחתונים', configurator_subtitle: '',
  width_cm: '', height_cm: '', depth_cm: '', installation_pdf_url: '', is_active: false,
}

function toSlug(value: string) {
  const slug = value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  return slug || `product-${Date.now().toString().slice(-6)}`
}

function detailToForm(product: AdminProductDetail): FormState {
  const attr = product.attributes || {}
  return {
    name: product.name,
    slug: product.slug,
    description: product.description || '',
    product_type: product.product_type,
    category_id: product.category_id || '',
    price: String(product.regular_price ?? product.current_price ?? ''),
    sale_price: product.original_price != null ? String(product.current_price ?? '') : '',
    size: String(attr.size ?? ''),
    model: String(attr.model ?? ''),
    color: String(attr.color ?? ''),
    material: String(attr.material ?? ''),
    delivery_days: String(attr.delivery_days ?? ''),
    sku: String(product.sku ?? attr.sku ?? ''),
    inventory_tracking: product.inventory_tracking,
    initial_stock: String(product.initial_stock ?? 0),
    stock_quantity: String(product.stock_quantity ?? 0),
    low_stock_threshold: String(product.low_stock_threshold ?? 5),
    allow_preorder: product.allow_preorder,
    configurator_enabled: Boolean(attr.configurator_enabled),
    configurator_category: String(attr.configurator_category ?? 'תחתונים'),
    configurator_subtitle: String(attr.configurator_subtitle ?? ''),
    width_cm: String(attr.width_cm ?? ''),
    height_cm: String(attr.height_cm ?? ''),
    depth_cm: String(attr.depth_cm ?? ''),
    images: product.images || [],
    image_display: parseImageDisplayMap(attr[IMAGE_DISPLAY_ATTRIBUTE]),
    installation_pdf_url: product.installation_pdf_url || '',
    is_active: product.is_active,
  }
}

export default function AdminProductEditor() {
  const { productId } = useParams()
  const isNew = productId === 'new'
  const { token, logout } = useAdminAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState<FormState>(emptyForm)
  const [categories, setCategories] = useState<Category[]>([])
  const [variants, setVariants] = useState<ProductVariant[]>([])
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadingPdf, setUploadingPdf] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [categoryName, setCategoryName] = useState('')

  useEffect(() => {
    api.get<Category[]>('/admin/categories', token).then(setCategories).catch(() => setError('טעינת הקטגוריות נכשלה'))
    if (!isNew && productId) {
      api.get<AdminProductDetail>(`/admin/products/${productId}`, token)
        .then((product) => {
          setForm(detailToForm(product))
          setVariants(product.variants || [])
        })
        .catch((err) => {
          if (err instanceof ApiError && err.status === 401) {
            logout()
            navigate('/admin/login')
            return
          }
          setError('טעינת המוצר נכשלה')
        })
        .finally(() => setLoading(false))
    }
  }, [isNew, productId, token, logout, navigate])

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }))
    setSaved(false)
  }

  const uploadFiles = async (files: FileList | null) => {
    if (!files?.length) return
    setUploading(true)
    setError('')
    try {
      const urls: string[] = []
      for (const file of Array.from(files)) {
        const result = await api.upload<{ url: string }>('/admin/media', file, token)
        urls.push(result.url)
      }
      setForm((current) => {
        const images = [...current.images, ...urls].slice(0, 20)
        const imageDisplay = { ...current.image_display }
        images.forEach((image) => {
          imageDisplay[image] ??= { ...DEFAULT_IMAGE_DISPLAY }
        })
        return { ...current, images, image_display: imageDisplay }
      })
      setSaved(false)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'העלאת התמונות נכשלה')
    } finally {
      setUploading(false)
    }
  }

  const moveImage = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= form.images.length) return
    const next = [...form.images]
    ;[next[index], next[target]] = [next[target], next[index]]
    setField('images', next)
  }

  const updateImageDisplay = (image: string, patch: Partial<ImageDisplaySettings>) => {
    setForm((current) => ({
      ...current,
      image_display: {
        ...current.image_display,
        [image]: { ...DEFAULT_IMAGE_DISPLAY, ...current.image_display[image], ...patch },
      },
    }))
    setSaved(false)
  }

  const removeImage = (index: number) => {
    setForm((current) => {
      const image = current.images[index]
      const imageDisplay = { ...current.image_display }
      if (image) delete imageDisplay[image]
      return {
        ...current,
        images: current.images.filter((_, imageIndex) => imageIndex !== index),
        image_display: imageDisplay,
      }
    })
    setSaved(false)
  }

  const createCategory = async () => {
    if (categoryName.trim().length < 2) return
    try {
      const category = await api.post<Category>('/admin/categories', {
        name: categoryName.trim(), slug: toSlug(categoryName), parent_id: null, sort_order: categories.length,
      }, token)
      setCategories((current) => [...current, category])
      setField('category_id', category.id)
      setCategoryName('')
      setShowCategoryForm(false)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'יצירת הקטגוריה נכשלה')
    }
  }

  const handleSave = async (publish?: boolean) => {
    setError('')
    const price = Number(form.price)
    const salePrice = form.sale_price.trim() ? Number(form.sale_price) : null
    const initialStock = Number(form.initial_stock)
    const stockQuantity = Number(form.stock_quantity)
    const lowStockThreshold = Number(form.low_stock_threshold)
    if (!form.name.trim() || !form.slug.trim() || !Number.isFinite(price) || price <= 0) {
      setError('יש למלא שם, כתובת מוצר ומחיר תקין')
      return
    }
    if (salePrice != null && (!Number.isFinite(salePrice) || salePrice <= 0 || salePrice >= price)) {
      setError('מחיר המבצע חייב להיות נמוך מהמחיר הרגיל')
      return
    }
    if (form.inventory_tracking && !form.sku.trim()) {
      setError('יש להזין מק״ט כאשר ניהול המלאי פעיל')
      return
    }
    if (![initialStock, stockQuantity, lowStockThreshold].every((value) => Number.isInteger(value) && value >= 0)) {
      setError('כמויות המלאי חייבות להיות מספרים שלמים ולא שליליים')
      return
    }
    setSaving(true)
    const imageDisplay = Object.fromEntries(
      form.images.map((image) => [image, form.image_display[image] ?? DEFAULT_IMAGE_DISPLAY]),
    )
    const payload = {
      name: form.name.trim(), slug: form.slug.trim(), description: form.description.trim() || null,
      product_type: form.product_type, category_id: form.category_id || null, price, sale_price: salePrice,
      sku: form.sku.trim() || null,
      inventory_tracking: form.inventory_tracking,
      initial_stock: initialStock,
      stock_quantity: stockQuantity,
      low_stock_threshold: lowStockThreshold,
      allow_preorder: form.allow_preorder,
      attributes: {
        size: form.size.trim(), model: form.model.trim(), color: form.color.trim(),
        material: form.material.trim(), delivery_days: Number(form.delivery_days) || null, sku: form.sku.trim(),
        configurator_enabled: form.configurator_enabled,
        configurator_category: form.configurator_category,
        configurator_subtitle: form.configurator_subtitle.trim(),
        width_cm: Number(form.width_cm) || null,
        height_cm: Number(form.height_cm) || null,
        depth_cm: Number(form.depth_cm) || null,
        [IMAGE_DISPLAY_ATTRIBUTE]: imageDisplay,
      },
      images: form.images, installation_pdf_url: form.installation_pdf_url.trim() || null,
      is_active: publish ?? form.is_active,
    }
    try {
      const result = isNew
        ? await api.post<AdminProductDetail>('/admin/products', payload, token)
        : await api.patch<AdminProductDetail>(`/admin/products/${productId}`, payload, token)
      setForm(detailToForm(result))
      setVariants(result.variants || [])
      setSaved(true)
      if (isNew) navigate(`/admin/products/${result.id}`, { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'שמירת המוצר נכשלה')
    } finally {
      setSaving(false)
    }
  }

  const uploadInstallationPdf = async (file: File | undefined) => {
    if (!file) return
    setUploadingPdf(true)
    setError('')
    try {
      const result = await api.upload<{ url: string }>('/admin/media', file, token)
      setField('installation_pdf_url', result.url)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'העלאת חוברת ההרכבה נכשלה')
    } finally {
      setUploadingPdf(false)
    }
  }

  const handleDelete = async () => {
    if (isNew || !productId) return
    if (!window.confirm(`למחוק לצמיתות את המוצר "${form.name}"? לא ניתן לבטל פעולה זו.`)) return
    setDeleting(true)
    setError('')
    try {
      await api.delete(`/admin/products/${productId}`, token)
      navigate('/admin/products', { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'מחיקת המוצר נכשלה')
      setDeleting(false)
    }
  }

  if (loading) return <p className="admin-product-editor__state">טוען מוצר…</p>

  return (
    <div className="admin-product-editor">
      <div className="admin-product-editor__top">
        <div>
          <Link to="/admin/products" className="admin-product-editor__back">→ חזרה למוצרים</Link>
          <h1>{isNew ? 'מוצר חדש' : `עריכת ${form.name}`}</h1>
        </div>
        <div className="admin-product-editor__actions">
          {saved && <span className="admin-product-editor__saved">נשמר ✓</span>}
          <button type="button" className="admin-product-editor__secondary" disabled={saving} onClick={() => handleSave(false)}>שמירת טיוטה</button>
          <button type="button" className="admin-product-editor__primary" disabled={saving} onClick={() => handleSave(true)}>{saving ? 'שומר…' : 'שמירה ופרסום'}</button>
        </div>
      </div>

      {error && <div className="admin-product-editor__error" role="alert">{error}</div>}

      <div className="admin-product-editor__layout">
        <div className="admin-product-editor__main">
          <section className="admin-product-editor__card">
            <h2>פרטי המוצר</h2>
            <label className="admin-product-editor__field admin-product-editor__field--full">שם המוצר
              <input value={form.name} onChange={(e) => { setField('name', e.target.value); if (isNew) setField('slug', toSlug(e.target.value)) }} placeholder="לדוגמה: מטבח CREAM ‏1.5 מטר" />
            </label>
            <label className="admin-product-editor__field admin-product-editor__field--full">תיאור
              <textarea rows={6} value={form.description} onChange={(e) => setField('description', e.target.value)} placeholder="תיאור שיופיע בעמוד המוצר" />
            </label>
            <div className="admin-product-editor__grid">
              <label className="admin-product-editor__field">סוג
                <select value={form.product_type} onChange={(e) => setField('product_type', e.target.value as ProductType)}>
                  <option value="KITCHEN">מטבח</option><option value="CABINET">מוצר בודד (יחידת ארון)</option><option value="ACCESSORY">מוצר משלים</option><option value="COMPONENT">רכיב לקונפיגורטור</option>
                </select>
              </label>
              <label className="admin-product-editor__field">מחיר
                <div className="admin-product-editor__price-input"><input type="number" min="1" value={form.price} onChange={(e) => setField('price', e.target.value)} /><span>₪</span></div>
              </label>
              <label className="admin-product-editor__field">מחיר מבצע (אופציונלי)
                <div className="admin-product-editor__price-input"><input type="number" min="1" value={form.sale_price} onChange={(e) => setField('sale_price', e.target.value)} placeholder="ללא מבצע" /><span>₪</span></div>
                <small className="admin-product-editor__hint">המחיר הרגיל יוצג עם קו חוצה</small>
              </label>
              <label className="admin-product-editor__field">קטגוריה
                <select value={form.category_id} onChange={(e) => setField('category_id', e.target.value)}>
                  <option value="">ללא קטגוריה</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                </select>
              </label>
              <button type="button" className="admin-product-editor__inline-action" onClick={() => setShowCategoryForm((value) => !value)}>+ קטגוריה חדשה</button>
            </div>
            {showCategoryForm && <div className="admin-product-editor__category-form"><input value={categoryName} onChange={(e) => setCategoryName(e.target.value)} placeholder="שם הקטגוריה" /><button type="button" onClick={createCategory}>הוספה</button></div>}
          </section>

          <section className="admin-product-editor__card">
            <h2>תמונות</h2>
            <p className="admin-product-editor__hint">התמונה הראשונה משמשת כתמונה הראשית. לכל תמונה ניתן לבחור אם למלא את המסגרת או להציג אותה בשלמותה, ולכוון את המיקום שלה.</p>
            <label className={`admin-product-editor__dropzone ${uploading ? 'admin-product-editor__dropzone--busy' : ''}`}>
              <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple disabled={uploading} onChange={(e) => uploadFiles(e.target.files)} />
              <strong>{uploading ? 'מעלה תמונות…' : 'לחצו לבחירת תמונות'}</strong><span>JPG, PNG, WebP או AVIF · עד 12MB</span>
            </label>
            {form.images.length > 0 && <div className="admin-product-editor__images">
              {form.images.map((image, index) => {
                const display = form.image_display[image] ?? DEFAULT_IMAGE_DISPLAY
                return <div className="admin-product-editor__image" key={`${image}-${index}`}>
                  <div className="admin-product-editor__image-preview">
                    <img src={image} alt={`תצוגה מקדימה לתמונה ${index + 1}`} style={{ objectFit: display.fit, objectPosition: `${display.positionX}% ${display.positionY}%` }} />
                    {index === 0 && <span className="admin-product-editor__image-primary">ראשית</span>}
                    <div className="admin-product-editor__image-actions">
                      <button type="button" disabled={index === 0} onClick={() => moveImage(index, -1)} aria-label="הזזת תמונה ימינה">→</button>
                      <button type="button" disabled={index === form.images.length - 1} onClick={() => moveImage(index, 1)} aria-label="הזזת תמונה שמאלה">←</button>
                      <button type="button" onClick={() => removeImage(index)} aria-label="מחיקת תמונה">×</button>
                    </div>
                  </div>
                  <div className="admin-product-editor__image-settings">
                    <span>התאמה למסגרת</span>
                    <div className="admin-product-editor__image-fit" role="group" aria-label={`התאמת תמונה ${index + 1} למסגרת`}>
                      <button type="button" className={display.fit === 'cover' ? 'admin-product-editor__image-fit--active' : ''} aria-pressed={display.fit === 'cover'} onClick={() => updateImageDisplay(image, { fit: 'cover' })}>מילוי המסגרת</button>
                      <button type="button" className={display.fit === 'contain' ? 'admin-product-editor__image-fit--active' : ''} aria-pressed={display.fit === 'contain'} onClick={() => updateImageDisplay(image, { fit: 'contain' })}>תמונה מלאה</button>
                    </div>
                    <label>מיקום אופקי
                      <input dir="ltr" type="range" min="0" max="100" step="1" value={display.positionX} onChange={(event) => updateImageDisplay(image, { positionX: Number(event.target.value) })} />
                    </label>
                    <label>מיקום אנכי
                      <input dir="ltr" type="range" min="0" max="100" step="1" value={display.positionY} onChange={(event) => updateImageDisplay(image, { positionY: Number(event.target.value) })} />
                    </label>
                    <button type="button" className="admin-product-editor__image-center" onClick={() => updateImageDisplay(image, { positionX: 50, positionY: 50 })}>מרכוז התמונה</button>
                  </div>
                </div>
              })}
            </div>}
          </section>

          <section className="admin-product-editor__card">
            <h2>מידע טכני</h2>
            <div className="admin-product-editor__grid">
              <label className="admin-product-editor__field">מידה<input value={form.size} onChange={(e) => setField('size', e.target.value)} placeholder="1.5 מטר" /></label>
              <label className="admin-product-editor__field">דגם<input value={form.model} onChange={(e) => setField('model', e.target.value)} placeholder="CREAM" /></label>
              <label className="admin-product-editor__field">צבע<input value={form.color} onChange={(e) => setField('color', e.target.value)} /></label>
              <label className="admin-product-editor__field">חומר / גימור<input value={form.material} onChange={(e) => setField('material', e.target.value)} /></label>
              <label className="admin-product-editor__field">זמן אספקה בימים<input type="number" min="0" value={form.delivery_days} onChange={(e) => setField('delivery_days', e.target.value)} /></label>
            </div>
          </section>

          <section className="admin-product-editor__card">
            <h2>ניהול מלאי</h2>
            <label className="admin-product-editor__toggle admin-product-editor__field--full">
              <input type="checkbox" checked={form.inventory_tracking} onChange={(e) => setField('inventory_tracking', e.target.checked)} />
              <span>מעקב מלאי פעיל למוצר</span>
            </label>
            <div className="admin-product-editor__grid">
              <label className="admin-product-editor__field">מק״ט
                <input dir="ltr" value={form.sku} onChange={(e) => setField('sku', e.target.value)} placeholder="SKU-001" />
              </label>
              <label className="admin-product-editor__field">כמות התחלתית
                <input type="number" min="0" step="1" value={form.initial_stock} onChange={(e) => { setField('initial_stock', e.target.value); if (isNew) setField('stock_quantity', e.target.value) }} />
              </label>
              <label className="admin-product-editor__field">מלאי נוכחי
                <input type="number" min="0" step="1" value={form.stock_quantity} onChange={(e) => setField('stock_quantity', e.target.value)} />
              </label>
              <label className="admin-product-editor__field">התראת מלאי נמוך
                <input type="number" min="0" step="1" value={form.low_stock_threshold} onChange={(e) => setField('low_stock_threshold', e.target.value)} />
              </label>
            </div>
            <label className="admin-product-editor__toggle admin-product-editor__field--full">
              <input type="checkbox" checked={form.allow_preorder} onChange={(e) => setField('allow_preorder', e.target.checked)} />
              <span>לאפשר Pre-order גם כשהמלאי מגיע ל־0</span>
            </label>
            <p className="admin-product-editor__hint">כניסות סחורה שוטפות מומלץ לעדכן במסך „מלאי”. שינוי הכמות כאן יירשם כתיקון ידני.</p>
          </section>

          <section className="admin-product-editor__card">
            <h2>הגדרות קונפיגורטור</h2>
            <label className="admin-product-editor__toggle admin-product-editor__field--full">
              <input type="checkbox" checked={form.configurator_enabled} onChange={(e) => setField('configurator_enabled', e.target.checked)} />
              <span>המוצר זמין לניהול בקונפיגורטור</span>
            </label>
            <div className="admin-product-editor__grid">
              <label className="admin-product-editor__field">סוג פריט
                <select value={form.configurator_category} onChange={(e) => setField('configurator_category', e.target.value)}>
                  <option value="תחתונים">תחתונים</option>
                  <option value="עליונים">עליונים</option>
                  <option value="גבוהים">גבוהים</option>
                  <option value="כיור">כיור</option>
                  <option value="ברז">ברז</option>
                </select>
              </label>
              <label className="admin-product-editor__field">תיאור חזית
                <input value={form.configurator_subtitle} onChange={(e) => setField('configurator_subtitle', e.target.value)} placeholder="לדוגמה: חזית 2 דלתות" />
              </label>
              <label className="admin-product-editor__field">רוחב בס״מ
                <input type="number" min="1" value={form.width_cm} onChange={(e) => setField('width_cm', e.target.value)} />
              </label>
              <label className="admin-product-editor__field">גובה בס״מ
                <input type="number" min="1" value={form.height_cm} onChange={(e) => setField('height_cm', e.target.value)} />
              </label>
              <label className="admin-product-editor__field">עומק בס״מ
                <input type="number" min="1" value={form.depth_cm} onChange={(e) => setField('depth_cm', e.target.value)} />
              </label>
            </div>
          </section>

          {!isNew && productId && (
            <AdminProductVariants
              productId={productId}
              token={token}
              variants={variants}
              onChange={setVariants}
            />
          )}
        </div>

        <aside className="admin-product-editor__side">
          <section className="admin-product-editor__card">
            <h2>פרסום</h2>
            <label className="admin-product-editor__toggle"><input type="checkbox" checked={form.is_active} onChange={(e) => setField('is_active', e.target.checked)} /><span>{form.is_active ? 'המוצר מפורסם באתר' : 'המוצר נשמר כטיוטה'}</span></label>
          </section>
          <section className="admin-product-editor__card">
            <h2>כתובת המוצר</h2>
            <label className="admin-product-editor__field"><span className="admin-product-editor__ltr">{form.product_type === 'CABINET' ? '/single-products/' : form.product_type === 'ACCESSORY' ? '/accessories/' : '/catalog/'}</span><input dir="ltr" value={form.slug} onChange={(e) => setField('slug', toSlug(e.target.value))} /></label>
            <p className="admin-product-editor__hint">אותיות אנגליות, מספרים ומקפים בלבד.</p>
          </section>
          <section className="admin-product-editor__card">
            <h2>מסמך התקנה</h2>
            <label className="admin-product-editor__field">קישור ל-PDF<input dir="ltr" value={form.installation_pdf_url} onChange={(e) => setField('installation_pdf_url', e.target.value)} placeholder="https://…" /></label>
            <label className={`admin-product-editor__dropzone admin-product-editor__pdf-upload${uploadingPdf ? ' admin-product-editor__dropzone--busy' : ''}`}>
              <input type="file" accept="application/pdf,.pdf" disabled={uploadingPdf} onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ''; void uploadInstallationPdf(file) }} />
              <strong>{uploadingPdf ? 'מעלה את החוברת…' : 'העלאת חוברת PDF'}</strong>
              <span>עד 30MB · תוצג אוטומטית בעמוד חוברות ההרכבה לאחר שמירת המוצר</span>
            </label>
            {form.installation_pdf_url && <button type="button" className="admin-product-editor__remove-pdf" onClick={() => setField('installation_pdf_url', '')}>הסרת החוברת</button>}
          </section>
          {!isNew && <section className="admin-product-editor__card admin-product-editor__danger-zone">
            <h2>מחיקת מוצר</h2>
            <p className="admin-product-editor__hint">המחיקה קבועה ותסיר את המוצר גם מסלים ומרשימות משאלות.</p>
            <button type="button" className="admin-product-editor__danger" disabled={deleting || saving} onClick={handleDelete}>
              {deleting ? 'מוחק…' : 'מחיקת המוצר'}
            </button>
          </section>}
        </aside>
      </div>
    </div>
  )
}
