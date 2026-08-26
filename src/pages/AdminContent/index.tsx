import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import './AdminContent.css'
import { useAdminAuth } from '../../context/useAdminAuth'
import { ApiError, api } from '../../lib/api'
import { adminLoginPath } from '../../lib/adminRoutes'
import { DEFAULT_SIZE_GUIDE_CONTENT, normalizeSizeGuideContent } from '../../lib/sizeGuide'
import type {
  ContactContent,
  ContentPageData,
  FooterContent,
  HomeContent,
  SeoContent,
  SizeGuideContent,
  SiteContentResponse,
} from '../../types/content'
import type { CatalogProduct } from '../../types/catalog'

type ContentTab = 'home' | 'pages' | 'site'
type Notice = { tone: 'success' | 'error'; text: string } | null

const PAGE_LABELS: Record<string, string> = {
  about: 'אודות',
  terms: 'תנאי השימוש',
  warranty: 'אחריות והחזרות',
  'size-guide': 'מדריך מידות',
}

const DEFAULT_SEO_CONTENT: SeoContent = {
  site_title: 'Savor Kitchens',
  meta_description: '',
  favicon_url: '',
}

function getImageDimensions(file: File) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      URL.revokeObjectURL(objectUrl)
      resolve({ width: image.naturalWidth, height: image.naturalHeight })
    }
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Invalid image'))
    }
    image.src = objectUrl
  })
}

export default function AdminContent() {
  const { token, logout } = useAdminAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState<ContentTab>('home')
  const [home, setHome] = useState<SiteContentResponse<HomeContent> | null>(null)
  const [homeProducts, setHomeProducts] = useState<CatalogProduct[]>([])
  const [pages, setPages] = useState<ContentPageData[]>([])
  const [selectedPageSlug, setSelectedPageSlug] = useState('')
  const [footer, setFooter] = useState<SiteContentResponse<FooterContent> | null>(null)
  const [contact, setContact] = useState<SiteContentResponse<ContactContent> | null>(null)
  const [seo, setSeo] = useState<SiteContentResponse<SeoContent> | null>(null)
  const [sizeGuide, setSizeGuide] = useState<SiteContentResponse<SizeGuideContent> | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<ContentTab | null>(null)
  const [uploading, setUploading] = useState('')
  const [notice, setNotice] = useState<Notice>(null)

  const handleError = useCallback((error: unknown, fallback: string) => {
    if (error instanceof ApiError && error.status === 401) {
      logout()
      navigate(adminLoginPath())
      return
    }
    setNotice({ tone: 'error', text: fallback })
  }, [logout, navigate])

  useEffect(() => {
    const seoRequest = api.get<SiteContentResponse<SeoContent>>('/admin/content/site/seo', token)
      .catch((error) => {
        if (error instanceof ApiError && error.status === 404) return null
        throw error
      })
    const sizeGuideRequest = api.get<SiteContentResponse<SizeGuideContent>>('/admin/content/site/size-guide', token)
      .catch((error) => {
        if (error instanceof ApiError && error.status === 404) return null
        throw error
      })

    Promise.all([
      api.get<SiteContentResponse<HomeContent>>('/admin/content/site/home', token),
      api.get<ContentPageData[]>('/admin/content/pages', token),
      api.get<SiteContentResponse<FooterContent>>('/admin/content/site/footer', token),
      api.get<SiteContentResponse<ContactContent>>('/admin/content/site/contact', token),
      api.get<CatalogProduct[]>('/catalog/kitchens?limit=100'),
      sizeGuideRequest,
      seoRequest,
    ])
      .then(([homeContent, contentPages, footerContent, contactContent, catalogProducts, sizeGuideContent, seoContent]) => {
        const defaultProducts = catalogProducts.filter((product) => product.attributes.featured).slice(0, 3)
        setHome({
          ...homeContent,
          data: {
            ...homeContent.data,
            best_sellers: homeContent.data.best_sellers ?? {
              title: 'הנמכרים ביותר',
              product_ids: (defaultProducts.length ? defaultProducts : catalogProducts.slice(0, 3)).map((product) => product.id),
            },
          },
        })
        setHomeProducts(catalogProducts)
        setPages(contentPages)
        setSelectedPageSlug(contentPages[0]?.slug || '')
        setFooter(footerContent)
        setContact(contactContent)
        setSeo(seoContent || {
          id: '',
          key: 'seo',
          data: DEFAULT_SEO_CONTENT,
          is_published: true,
          updated_at: '',
        })
        const sizeGuidePage = contentPages.find((page) => page.slug === 'size-guide')
        setSizeGuide(sizeGuideContent
          ? { ...sizeGuideContent, data: normalizeSizeGuideContent(sizeGuideContent.data) }
          : {
              id: '',
              key: 'size-guide',
              data: DEFAULT_SIZE_GUIDE_CONTENT,
              is_published: sizeGuidePage?.is_published ?? true,
              updated_at: '',
            })
      })
      .catch((error) => handleError(error, 'טעינת תוכן האתר נכשלה'))
      .finally(() => setLoading(false))
  }, [token, handleError])

  const selectedPage = useMemo(
    () => pages.find((page) => page.slug === selectedPageSlug) || null,
    [pages, selectedPageSlug],
  )

  const changeHome = (update: (content: HomeContent) => HomeContent) => {
    setHome((current) => current ? { ...current, data: update(current.data) } : current)
  }

  const changeBestSellers = (patch: Partial<NonNullable<HomeContent['best_sellers']>>) => {
    changeHome((data) => ({
      ...data,
      best_sellers: {
        title: data.best_sellers?.title || 'הנמכרים ביותר',
        product_ids: data.best_sellers?.product_ids || [],
        ...patch,
      },
    }))
  }

  const addBestSeller = (productId: string) => {
    if (!productId || !home?.data.best_sellers) return
    const currentIds = home.data.best_sellers.product_ids
    if (currentIds.includes(productId) || currentIds.length >= 3) return
    changeBestSellers({ product_ids: [...currentIds, productId] })
  }

  const moveBestSeller = (index: number, direction: -1 | 1) => {
    const currentIds = home?.data.best_sellers?.product_ids || []
    const target = index + direction
    if (target < 0 || target >= currentIds.length) return
    const nextIds = [...currentIds]
    ;[nextIds[index], nextIds[target]] = [nextIds[target], nextIds[index]]
    changeBestSellers({ product_ids: nextIds })
  }

  const changeSelectedPage = (patch: Partial<ContentPageData>) => {
    setPages((current) => current.map((page) => (
      page.slug === selectedPageSlug ? { ...page, ...patch } : page
    )))
  }

  const changeSizeGuide = (update: (content: SizeGuideContent) => SizeGuideContent) => {
    setSizeGuide((current) => current ? { ...current, data: update(current.data) } : current)
  }

  const moveSizeGuideStep = (index: number, direction: -1 | 1) => {
    changeSizeGuide((content) => {
      const target = index + direction
      if (target < 0 || target >= content.steps.length) return content
      const steps = [...content.steps]
      ;[steps[index], steps[target]] = [steps[target], steps[index]]
      return { ...content, steps }
    })
  }

  const updateSizeGuideStep = (index: number, patch: Partial<SizeGuideContent['steps'][number]>) => {
    changeSizeGuide((content) => ({
      ...content,
      steps: content.steps.map((step, stepIndex) => stepIndex === index ? { ...step, ...patch } : step),
    }))
  }

  const uploadImage = async (file: File, slot: string, onUploaded: (url: string) => void) => {
    setUploading(slot)
    setNotice(null)
    try {
      const result = await api.upload<{ url: string }>('/admin/media', file, token)
      onUploaded(result.url)
      setNotice({ tone: 'success', text: 'התמונה הועלתה. יש לשמור את השינויים כדי לפרסם אותה.' })
    } catch (error) {
      handleError(error, 'העלאת התמונה נכשלה')
    } finally {
      setUploading('')
    }
  }

  const uploadFavicon = async (file: File) => {
    setNotice(null)
    try {
      const { width, height } = await getImageDimensions(file)
      if (width !== height || width < 48) {
        setNotice({ tone: 'error', text: 'יש להעלות אייקון ריבועי בגודל 48×48 פיקסלים לפחות.' })
        return
      }
    } catch {
      setNotice({ tone: 'error', text: 'לא ניתן לקרוא את קובץ האייקון. נסו קובץ PNG, JPG או WebP.' })
      return
    }

    await uploadImage(file, 'favicon', (favicon_url) => {
      setSeo((current) => current ? { ...current, data: { ...current.data, favicon_url } } : current)
    })
  }

  const saveHome = async () => {
    if (!home) return
    setSaving('home')
    setNotice(null)
    try {
      const saved = await api.put<SiteContentResponse<HomeContent>>(
        '/admin/content/site/home',
        { data: home.data, is_published: home.is_published },
        token,
      )
      setHome(saved)
      setNotice({ tone: 'success', text: 'דף הבית נשמר בהצלחה' })
    } catch (error) {
      handleError(error, 'שמירת דף הבית נכשלה')
    } finally {
      setSaving(null)
    }
  }

  const savePage = async () => {
    if (!selectedPage) return
    setSaving('pages')
    setNotice(null)
    try {
      const saved = await api.put<ContentPageData>(
        `/admin/content/pages/${selectedPage.slug}`,
        {
          slug: selectedPage.slug,
          title: selectedPage.title,
          body: selectedPage.body,
          image_url: selectedPage.image_url?.trim() || null,
          language: selectedPage.language,
          meta_description: selectedPage.meta_description || null,
          is_published: selectedPage.is_published,
        },
        token,
      )
      if (selectedPage.slug === 'size-guide' && sizeGuide) {
        const savedGuide = await api.put<SiteContentResponse<SizeGuideContent>>(
          '/admin/content/site/size-guide',
          { data: sizeGuide.data, is_published: selectedPage.is_published },
          token,
        )
        setSizeGuide(savedGuide)
      }
      setPages((current) => current.map((page) => page.slug === saved.slug ? saved : page))
      setNotice({ tone: 'success', text: 'העמוד נשמר בהצלחה' })
    } catch (error) {
      handleError(error, 'שמירת העמוד נכשלה')
    } finally {
      setSaving(null)
    }
  }

  const saveSite = async () => {
    if (!footer || !contact || !seo) return
    setSaving('site')
    setNotice(null)
    try {
      const [savedFooter, savedContact, savedSeo] = await Promise.all([
        api.put<SiteContentResponse<FooterContent>>(
          '/admin/content/site/footer',
          { data: footer.data, is_published: footer.is_published },
          token,
        ),
        api.put<SiteContentResponse<ContactContent>>(
          '/admin/content/site/contact',
          { data: contact.data, is_published: contact.is_published },
          token,
        ),
        api.put<SiteContentResponse<SeoContent>>(
          '/admin/content/site/seo',
          { data: seo.data, is_published: true },
          token,
        ),
      ])
      setFooter(savedFooter)
      setContact(savedContact)
      setSeo(savedSeo)
      setNotice({ tone: 'success', text: 'פרטי האתר נשמרו בהצלחה. עדכון התוצאה ב־Google עשוי להימשך מספר ימים או שבועות.' })
    } catch (error) {
      handleError(error, 'שמירת פרטי האתר נכשלה')
    } finally {
      setSaving(null)
    }
  }

  if (loading) return <p className="admin-content__state">טוען את תוכן האתר…</p>

  return (
    <div className="admin-content">
      <header className="admin-content__heading">
        <div>
          <h1>תוכן האתר</h1>
          <p>עדכון טקסטים, תמונות ופרטי קשר שמופיעים באתר</p>
        </div>
      </header>

      <div className="admin-content__tabs" role="tablist" aria-label="אזור תוכן">
        <button className={tab === 'home' ? 'is-active' : ''} onClick={() => { setTab('home'); setNotice(null) }}>דף הבית</button>
        <button className={tab === 'pages' ? 'is-active' : ''} onClick={() => { setTab('pages'); setNotice(null) }}>עמודי תוכן</button>
        <button className={tab === 'site' ? 'is-active' : ''} onClick={() => { setTab('site'); setNotice(null) }}>פרטי האתר</button>
      </div>

      {notice && <p className={`admin-content__notice admin-content__notice--${notice.tone}`}>{notice.text}</p>}

      {tab === 'home' && home && (
        <div className="admin-content__workspace">
          <section className="admin-content__card">
            <div className="admin-content__section-heading">
              <div><h2>אזור ראשי</h2><p>הכותרת והתמונה הראשונות שהגולש רואה</p></div>
              <label className="admin-content__toggle">
                <input type="checkbox" checked={home.is_published} onChange={(event) => setHome({ ...home, is_published: event.target.checked })} />
                מפורסם באתר
              </label>
            </div>
            <div className="admin-content__grid">
              <Field label="כותרת ראשית" value={home.data.hero.title} onChange={(title) => changeHome((data) => ({ ...data, hero: { ...data.hero, title } }))} />
              <Field label="כותרת משנה" value={home.data.hero.subtitle} onChange={(subtitle) => changeHome((data) => ({ ...data, hero: { ...data.hero, subtitle } }))} />
              <Field label="טקסט הכפתור" value={home.data.hero.cta_label} onChange={(cta_label) => changeHome((data) => ({ ...data, hero: { ...data.hero, cta_label } }))} />
              <Field label="קישור הכפתור" value={home.data.hero.cta_url} dir="ltr" onChange={(cta_url) => changeHome((data) => ({ ...data, hero: { ...data.hero, cta_url } }))} />
            </div>
            <ImageField
              label="תמונת פתיחה"
              value={home.data.hero.image_url}
              uploading={uploading === 'hero'}
              onChange={(image_url) => changeHome((data) => ({ ...data, hero: { ...data.hero, image_url } }))}
              onUpload={(file) => uploadImage(file, 'hero', (image_url) => changeHome((data) => ({ ...data, hero: { ...data.hero, image_url } })))}
            />
            <h3>קישורים מהירים</h3>
            <div className="admin-content__repeat-list">
              {home.data.hero.tags.map((tag, index) => (
                <div className="admin-content__repeat-row" key={`${tag.to}-${index}`}>
                  <Field label="טקסט" value={tag.label} onChange={(label) => changeHome((data) => ({ ...data, hero: { ...data.hero, tags: data.hero.tags.map((item, itemIndex) => itemIndex === index ? { ...item, label } : item) } }))} />
                  <Field label="קישור" value={tag.to} dir="ltr" onChange={(to) => changeHome((data) => ({ ...data, hero: { ...data.hero, tags: data.hero.tags.map((item, itemIndex) => itemIndex === index ? { ...item, to } : item) } }))} />
                  <RemoveButton onClick={() => changeHome((data) => ({ ...data, hero: { ...data.hero, tags: data.hero.tags.filter((_, itemIndex) => itemIndex !== index) } }))} />
                </div>
              ))}
            </div>
            <AddButton label="הוספת קישור" onClick={() => changeHome((data) => ({ ...data, hero: { ...data.hero, tags: [...data.hero.tags, { label: '', to: '/' }] } }))} />
          </section>

          <section className="admin-content__card">
            <h2>פס הודעות</h2>
            <label className="admin-content__field">
              <span>הודעה אחת בכל שורה</span>
              <textarea rows={5} value={home.data.announcements.join('\n')} onChange={(event) => changeHome((data) => ({ ...data, announcements: event.target.value.split('\n') }))} />
            </label>
          </section>

          <section className="admin-content__card">
            <div className="admin-content__section-heading">
              <div><h2>הנמכרים ביותר</h2><p>בחירת עד שלושה מטבחים שיופיעו בדף הבית, לפי הסדר הרצוי.</p></div>
              <span className="admin-content__selection-count">{home.data.best_sellers?.product_ids.length || 0}/3</span>
            </div>
            <Field label="כותרת האזור" value={home.data.best_sellers?.title || ''} onChange={(title) => changeBestSellers({ title })} />
            <div className="admin-content__featured-list">
              {(home.data.best_sellers?.product_ids || []).map((productId, index) => {
                const product = homeProducts.find((item) => item.id === productId)
                if (!product) return null
                return (
                  <div className="admin-content__featured-product" key={product.id}>
                    <div className="admin-content__featured-image">
                      {product.images[0] ? <img src={product.images[0]} alt="" /> : <span>אין תמונה</span>}
                    </div>
                    <div><strong>{product.name}</strong><span>{String(product.attributes.size || product.category?.name || 'מטבח')}</span></div>
                    <div className="admin-content__featured-actions">
                      <button type="button" disabled={index === 0} onClick={() => moveBestSeller(index, -1)} aria-label="העברה למעלה">↑</button>
                      <button type="button" disabled={index === (home.data.best_sellers?.product_ids.length || 0) - 1} onClick={() => moveBestSeller(index, 1)} aria-label="העברה למטה">↓</button>
                      <button type="button" className="is-remove" onClick={() => changeBestSellers({ product_ids: (home.data.best_sellers?.product_ids || []).filter((id) => id !== product.id) })}>הסרה</button>
                    </div>
                  </div>
                )
              })}
            </div>
            {(home.data.best_sellers?.product_ids.length || 0) < 3 && (
              <label className="admin-content__field admin-content__featured-picker">
                <span>הוספת מטבח</span>
                <select value="" onChange={(event) => addBestSeller(event.target.value)}>
                  <option value="">בחרו מוצר…</option>
                  {homeProducts.filter((product) => !home.data.best_sellers?.product_ids.includes(product.id)).map((product) => (
                    <option value={product.id} key={product.id}>{product.name}{product.attributes.size ? ` · ${String(product.attributes.size)}` : ''}</option>
                  ))}
                </select>
              </label>
            )}
            {(home.data.best_sellers?.product_ids.length || 0) === 0 && <p className="admin-content__hint">כאשר לא נבחרים מוצרים, האזור לא יוצג בדף הבית.</p>}
          </section>

          <section className="admin-content__card">
            <h2>החומרים שלנו</h2>
            <Field label="כותרת האזור" value={home.data.materials_title} onChange={(materials_title) => changeHome((data) => ({ ...data, materials_title }))} />
            <div className="admin-content__tiles">
              {home.data.materials.map((material, index) => (
                <div className="admin-content__tile" key={`${material.label}-${index}`}>
                  <ImageField
                    label={`תמונה ${index + 1}`}
                    value={material.image_url}
                    uploading={uploading === `material-${index}`}
                    onChange={(image_url) => changeHome((data) => ({ ...data, materials: data.materials.map((item, itemIndex) => itemIndex === index ? { ...item, image_url } : item) }))}
                    onUpload={(file) => uploadImage(file, `material-${index}`, (image_url) => changeHome((data) => ({ ...data, materials: data.materials.map((item, itemIndex) => itemIndex === index ? { ...item, image_url } : item) })))}
                  />
                  <Field label="תיאור" value={material.label} onChange={(label) => changeHome((data) => ({ ...data, materials: data.materials.map((item, itemIndex) => itemIndex === index ? { ...item, label } : item) }))} />
                  <RemoveButton onClick={() => changeHome((data) => ({ ...data, materials: data.materials.filter((_, itemIndex) => itemIndex !== index) }))} />
                </div>
              ))}
            </div>
            <AddButton label="הוספת חומר" onClick={() => changeHome((data) => ({ ...data, materials: [...data.materials, { label: '', image_url: '' }] }))} />
          </section>

          <section className="admin-content__card">
            <h2>גלריית המטבח</h2>
            <ImageField
              label="תמונת הגלריה"
              value={home.data.gallery.image_url}
              uploading={uploading === 'gallery'}
              onChange={(image_url) => changeHome((data) => ({ ...data, gallery: { ...data.gallery, image_url } }))}
              onUpload={(file) => uploadImage(file, 'gallery', (image_url) => changeHome((data) => ({ ...data, gallery: { ...data.gallery, image_url } })))}
            />
            <div className="admin-content__grid">
              {home.data.gallery.top.map((item, index) => (
                <div className="admin-content__subcard" key={index}>
                  <strong>נקודת מידע {index + 1}</strong>
                  <Field label="כותרת" value={item.hotspot.label} onChange={(label) => changeHome((data) => ({ ...data, gallery: { ...data.gallery, top: data.gallery.top.map((entry, itemIndex) => itemIndex === index ? { ...entry, hotspot: { ...entry.hotspot, label } } : entry) } }))} />
                  <Field label="פירוט" value={item.hotspot.detail} onChange={(detail) => changeHome((data) => ({ ...data, gallery: { ...data.gallery, top: data.gallery.top.map((entry, itemIndex) => itemIndex === index ? { ...entry, hotspot: { ...entry.hotspot, detail } } : entry) } }))} />
                </div>
              ))}
              <div className="admin-content__subcard">
                <strong>נקודת מידע תחתונה</strong>
                <Field label="כותרת" value={home.data.gallery.bottom_hotspot.label} onChange={(label) => changeHome((data) => ({ ...data, gallery: { ...data.gallery, bottom_hotspot: { ...data.gallery.bottom_hotspot, label } } }))} />
                <Field label="פירוט" value={home.data.gallery.bottom_hotspot.detail} onChange={(detail) => changeHome((data) => ({ ...data, gallery: { ...data.gallery, bottom_hotspot: { ...data.gallery.bottom_hotspot, detail } } }))} />
              </div>
            </div>
          </section>

          <section className="admin-content__card">
            <h2>המלצות</h2>
            <Field label="כותרת האזור" value={home.data.testimonials_title} onChange={(testimonials_title) => changeHome((data) => ({ ...data, testimonials_title }))} />
            <div className="admin-content__repeat-list">
              {home.data.testimonials.map((testimonial, index) => (
                <div className="admin-content__testimonial" key={index}>
                  <div className="admin-content__grid">
                    <Field label="שם" value={testimonial.name} onChange={(name) => changeHome((data) => ({ ...data, testimonials: data.testimonials.map((item, itemIndex) => itemIndex === index ? { ...item, name } : item) }))} />
                    <label className="admin-content__field"><span>דירוג</span><input type="number" min="1" max="5" step="0.5" value={testimonial.rating} onChange={(event) => changeHome((data) => ({ ...data, testimonials: data.testimonials.map((item, itemIndex) => itemIndex === index ? { ...item, rating: Number(event.target.value) } : item) }))} /></label>
                  </div>
                  <label className="admin-content__field"><span>המלצה</span><textarea rows={3} value={testimonial.text} onChange={(event) => changeHome((data) => ({ ...data, testimonials: data.testimonials.map((item, itemIndex) => itemIndex === index ? { ...item, text: event.target.value } : item) }))} /></label>
                  <RemoveButton onClick={() => changeHome((data) => ({ ...data, testimonials: data.testimonials.filter((_, itemIndex) => itemIndex !== index) }))} />
                </div>
              ))}
            </div>
            <AddButton label="הוספת המלצה" onClick={() => changeHome((data) => ({ ...data, testimonials: [...data.testimonials, { name: '', rating: 5, text: '' }] }))} />
          </section>

          <section className="admin-content__card">
            <h2>ניוזלטר</h2>
            <div className="admin-content__grid">
              <Field label="כותרת" value={home.data.newsletter.title} onChange={(title) => changeHome((data) => ({ ...data, newsletter: { ...data.newsletter, title } }))} />
              <Field label="כותרת משנה" value={home.data.newsletter.subtitle} onChange={(subtitle) => changeHome((data) => ({ ...data, newsletter: { ...data.newsletter, subtitle } }))} />
            </div>
            <Field label="טקסט הסכמה" value={home.data.newsletter.consent} onChange={(consent) => changeHome((data) => ({ ...data, newsletter: { ...data.newsletter, consent } }))} />
          </section>

          <SaveBar label="שמירת דף הבית" saving={saving === 'home'} onClick={saveHome} />
        </div>
      )}

      {tab === 'pages' && (
        <div className="admin-content__workspace">
          <div className="admin-content__page-picker">
            {pages.map((page) => (
              <button key={page.slug} className={page.slug === selectedPageSlug ? 'is-active' : ''} onClick={() => { setSelectedPageSlug(page.slug); setNotice(null) }}>
                {PAGE_LABELS[page.slug] || page.title}
              </button>
            ))}
          </div>
          {selectedPage ? (
            <section className="admin-content__card">
              <div className="admin-content__section-heading">
                <div>
                  <h2>{PAGE_LABELS[selectedPage.slug] || selectedPage.title}</h2>
                  <p>{selectedPage.slug === 'size-guide' ? 'מזינים את התוכן בלבד. העיצוב, ההדגשות והחצים נוצרים אוטומטית באתר.' : 'התוכן נשמר בפורמט טקסט וניתן להוסיף פסקאות באמצעות שורה ריקה.'}</p>
                </div>
                <label className="admin-content__toggle"><input type="checkbox" checked={selectedPage.is_published} onChange={(event) => changeSelectedPage({ is_published: event.target.checked })} />מפורסם באתר</label>
              </div>
              <Field label="כותרת העמוד" value={selectedPage.title} onChange={(title) => changeSelectedPage({ title })} />
              {selectedPage.slug === 'about' ? (
                <ImageField
                  label="תמונת עמוד אודות"
                  value={selectedPage.image_url || ''}
                  uploading={uploading === 'page-about'}
                  onChange={(image_url) => changeSelectedPage({ image_url })}
                  onUpload={(file) => uploadImage(file, 'page-about', (image_url) => changeSelectedPage({ image_url }))}
                />
              ) : null}
              {selectedPage.slug === 'size-guide' && sizeGuide ? (
                <div className="admin-content__guide-editor">
                  <div className="admin-content__guide-intro">
                    <Field label="כותרת משנה" value={sizeGuide.data.subtitle} onChange={(subtitle) => changeSizeGuide((content) => ({ ...content, subtitle }))} />
                    <TextAreaField label="פתיח קצר" rows={3} value={sizeGuide.data.introduction} onChange={(introduction) => changeSizeGuide((content) => ({ ...content, introduction }))} />
                  </div>

                  <div className="admin-content__guide-heading">
                    <div><h3>שלבי המדריך</h3><p>המספור, הקווים והחצים נקבעים אוטומטית לפי הסדר.</p></div>
                    <span>{sizeGuide.data.steps.length} שלבים</span>
                  </div>

                  <div className="admin-content__guide-steps">
                    {sizeGuide.data.steps.map((step, index) => (
                      <section className="admin-content__guide-step" key={step.id}>
                        <header>
                          <strong>שלב {index + 1}</strong>
                          <div className="admin-content__guide-actions">
                            <button type="button" disabled={index === 0} onClick={() => moveSizeGuideStep(index, -1)} aria-label={`העברת שלב ${index + 1} למעלה`}>↑</button>
                            <button type="button" disabled={index === sizeGuide.data.steps.length - 1} onClick={() => moveSizeGuideStep(index, 1)} aria-label={`העברת שלב ${index + 1} למטה`}>↓</button>
                            <button type="button" className="is-remove" onClick={() => changeSizeGuide((content) => ({ ...content, steps: content.steps.filter((_, stepIndex) => stepIndex !== index) }))}>הסרה</button>
                          </div>
                        </header>
                        <Field label="כותרת השלב" value={step.title} onChange={(title) => updateSizeGuideStep(index, { title })} />
                        <TextAreaField label="פסקת פתיחה" rows={2} value={step.lead} onChange={(lead) => updateSizeGuideStep(index, { lead })} />
                        <TextAreaField label="פירוט (פסקה חדשה בכל שורה; טקסט לפני נקודתיים יודגש אוטומטית)" rows={5} value={step.body} onChange={(body) => updateSizeGuideStep(index, { body })} />
                        <TextAreaField label="שורת טיפ מודגשת — לא חובה" rows={2} value={step.note} onChange={(note) => updateSizeGuideStep(index, { note })} />
                      </section>
                    ))}
                  </div>
                  <AddButton label="הוספת שלב" onClick={() => changeSizeGuide((content) => ({
                    ...content,
                    steps: [...content.steps, { id: `step-${Date.now()}`, title: '', lead: '', body: '', note: '' }],
                  }))} />

                  <div className="admin-content__guide-intro">
                    <h3>סיום המדריך</h3>
                    <Field label="כותרת סיום מודגשת" value={sizeGuide.data.closing_title} onChange={(closing_title) => changeSizeGuide((content) => ({ ...content, closing_title }))} />
                    <TextAreaField label="טקסט סיום" rows={2} value={sizeGuide.data.closing_body} onChange={(closing_body) => changeSizeGuide((content) => ({ ...content, closing_body }))} />
                    <Field label="שאלת סיום מודגשת" value={sizeGuide.data.closing_question} onChange={(closing_question) => changeSizeGuide((content) => ({ ...content, closing_question }))} />
                    <TextAreaField label="טקסט עזרה" rows={3} value={sizeGuide.data.closing_note} onChange={(closing_note) => changeSizeGuide((content) => ({ ...content, closing_note }))} />
                  </div>
                </div>
              ) : (
                <label className="admin-content__field"><span>תוכן העמוד</span><textarea className="admin-content__body-editor" rows={18} value={selectedPage.body} onChange={(event) => changeSelectedPage({ body: event.target.value })} /></label>
              )}
              <Field label="תיאור למנועי חיפוש" value={selectedPage.meta_description || ''} onChange={(meta_description) => changeSelectedPage({ meta_description })} />
              <SaveBar label="שמירת העמוד" saving={saving === 'pages'} onClick={savePage} />
            </section>
          ) : <p className="admin-content__state">לא נמצאו עמודי תוכן.</p>}
        </div>
      )}

      {tab === 'site' && footer && contact && seo && (
        <div className="admin-content__workspace">
          <section className="admin-content__card">
            <div className="admin-content__section-heading">
              <div>
                <h2>Google ו־SEO</h2>
                <p>הכותרת, התיאור והאייקון שמייצגים את האתר במנועי חיפוש ובדפדפן</p>
              </div>
            </div>
            <div className="admin-content__grid">
              <Field
                label="שם האתר"
                value={seo.data.site_title}
                onChange={(site_title) => setSeo({ ...seo, data: { ...seo.data, site_title } })}
              />
              <TextAreaField
                label={`תיאור האתר למנועי חיפוש (${seo.data.meta_description.length}/160)`}
                rows={4}
                value={seo.data.meta_description}
                onChange={(meta_description) => setSeo({ ...seo, data: { ...seo.data, meta_description: meta_description.slice(0, 160) } })}
              />
            </div>
            <ImageField
              label="כתובת אייקון האתר"
              value={seo.data.favicon_url}
              uploading={uploading === 'favicon'}
              onChange={(favicon_url) => setSeo({ ...seo, data: { ...seo.data, favicon_url } })}
              onUpload={uploadFavicon}
            />
            <p className="admin-content__hint">יש להעלות תמונה ריבועית בגודל 48×48 פיקסלים לפחות. מומלץ להשתמש ב־PNG ברור ובעל ניגודיות גבוהה.</p>
          </section>
          <section className="admin-content__card">
            <div className="admin-content__section-heading">
              <div><h2>פוטר האתר</h2><p>מידע קבוע שמופיע בתחתית כל עמוד</p></div>
              <label className="admin-content__toggle"><input type="checkbox" checked={footer.is_published} onChange={(event) => setFooter({ ...footer, is_published: event.target.checked })} />מפורסם באתר</label>
            </div>
            <div className="admin-content__grid">
              <Field label="כותרת שירות לקוחות" value={footer.data.service_title} onChange={(service_title) => setFooter({ ...footer, data: { ...footer.data, service_title } })} />
              <Field label="כותרת תוכן והדרכה" value={footer.data.content_title} onChange={(content_title) => setFooter({ ...footer, data: { ...footer.data, content_title } })} />
              <Field label="כותרת יצירת קשר" value={footer.data.contact_title} onChange={(contact_title) => setFooter({ ...footer, data: { ...footer.data, contact_title } })} />
              <Field label="שעות פעילות" value={footer.data.hours} onChange={(hours) => setFooter({ ...footer, data: { ...footer.data, hours } })} />
              <Field label="כתובת לאיסוף" value={footer.data.pickup_address} onChange={(pickup_address) => setFooter({ ...footer, data: { ...footer.data, pickup_address } })} />
              <Field label="קישור WhatsApp" value={footer.data.whatsapp_url} dir="ltr" onChange={(whatsapp_url) => setFooter({ ...footer, data: { ...footer.data, whatsapp_url } })} />
              <Field label="מספר WhatsApp לקבלת תכנונים (בפורמט בינלאומי)" value={footer.data.whatsapp_phone || ''} dir="ltr" onChange={(whatsapp_phone) => setFooter({ ...footer, data: { ...footer.data, whatsapp_phone } })} />
              <Field label="קישור Instagram" value={footer.data.instagram_url} dir="ltr" onChange={(instagram_url) => setFooter({ ...footer, data: { ...footer.data, instagram_url } })} />
              <Field label="שורת זכויות יוצרים" value={footer.data.copyright} onChange={(copyright) => setFooter({ ...footer, data: { ...footer.data, copyright } })} />
            </div>
          </section>
          <section className="admin-content__card">
            <div className="admin-content__section-heading">
              <div><h2>עמוד יצירת קשר</h2><p>הכותרות וההודעה שמוצגות בטופס</p></div>
              <label className="admin-content__toggle"><input type="checkbox" checked={contact.is_published} onChange={(event) => setContact({ ...contact, is_published: event.target.checked })} />מפורסם באתר</label>
            </div>
            <Field label="כותרת" value={contact.data.title} onChange={(title) => setContact({ ...contact, data: { ...contact.data, title } })} />
            <Field label="כותרת משנה" value={contact.data.subtitle} onChange={(subtitle) => setContact({ ...contact, data: { ...contact.data, subtitle } })} />
            <Field label="הודעת הצלחה" value={contact.data.success_message} onChange={(success_message) => setContact({ ...contact, data: { ...contact.data, success_message } })} />
          </section>
          <SaveBar label="שמירת פרטי האתר" saving={saving === 'site'} onClick={saveSite} />
        </div>
      )}
    </div>
  )
}

function Field({ label, value, onChange, dir }: { label: string; value: string; onChange: (value: string) => void; dir?: 'ltr' | 'rtl' }) {
  return <label className="admin-content__field"><span>{label}</span><input value={value} dir={dir} onChange={(event) => onChange(event.target.value)} /></label>
}

function TextAreaField({ label, value, rows, onChange }: { label: string; value: string; rows: number; onChange: (value: string) => void }) {
  return <label className="admin-content__field"><span>{label}</span><textarea rows={rows} value={value} onChange={(event) => onChange(event.target.value)} /></label>
}

function ImageField({ label, value, uploading, onChange, onUpload }: { label: string; value: string; uploading: boolean; onChange: (value: string) => void; onUpload: (file: File) => void }) {
  return (
    <div className="admin-content__image-field">
      <div className="admin-content__image-preview">{value ? <img src={value} alt="" /> : <span>אין תמונה</span>}</div>
      <div className="admin-content__image-controls">
        <Field label={label} value={value} dir="ltr" onChange={onChange} />
        <label className={`admin-content__upload ${uploading ? 'is-disabled' : ''}`}>
          {uploading ? 'מעלה…' : 'העלאת תמונה'}
          <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" disabled={uploading} onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ''; if (file) onUpload(file) }} />
        </label>
      </div>
    </div>
  )
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return <button type="button" className="admin-content__add" onClick={onClick}>+ {label}</button>
}

function RemoveButton({ onClick }: { onClick: () => void }) {
  return <button type="button" className="admin-content__remove" onClick={onClick} aria-label="הסרה">הסרה</button>
}

function SaveBar({ label, saving, onClick }: { label: string; saving: boolean; onClick: () => void }) {
  return <div className="admin-content__save-bar"><button type="button" disabled={saving} onClick={onClick}>{saving ? 'שומר…' : label}</button></div>
}
