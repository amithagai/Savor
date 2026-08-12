import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import './AdminContent.css'
import { useAdminAuth } from '../../context/useAdminAuth'
import { ApiError, api } from '../../lib/api'
import type {
  ContactContent,
  ContentPageData,
  FooterContent,
  HomeContent,
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
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<ContentTab | null>(null)
  const [uploading, setUploading] = useState('')
  const [notice, setNotice] = useState<Notice>(null)

  const handleError = useCallback((error: unknown, fallback: string) => {
    if (error instanceof ApiError && error.status === 401) {
      logout()
      navigate('/admin/login')
      return
    }
    setNotice({ tone: 'error', text: fallback })
  }, [logout, navigate])

  useEffect(() => {
    Promise.all([
      api.get<SiteContentResponse<HomeContent>>('/admin/content/site/home', token),
      api.get<ContentPageData[]>('/admin/content/pages', token),
      api.get<SiteContentResponse<FooterContent>>('/admin/content/site/footer', token),
      api.get<SiteContentResponse<ContactContent>>('/admin/content/site/contact', token),
      api.get<CatalogProduct[]>('/catalog/kitchens?limit=100'),
    ])
      .then(([homeContent, contentPages, footerContent, contactContent, catalogProducts]) => {
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
          language: selectedPage.language,
          meta_description: selectedPage.meta_description || null,
          is_published: selectedPage.is_published,
        },
        token,
      )
      setPages((current) => current.map((page) => page.slug === saved.slug ? saved : page))
      setNotice({ tone: 'success', text: 'העמוד נשמר בהצלחה' })
    } catch (error) {
      handleError(error, 'שמירת העמוד נכשלה')
    } finally {
      setSaving(null)
    }
  }

  const saveSite = async () => {
    if (!footer || !contact) return
    setSaving('site')
    setNotice(null)
    try {
      const [savedFooter, savedContact] = await Promise.all([
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
      ])
      setFooter(savedFooter)
      setContact(savedContact)
      setNotice({ tone: 'success', text: 'פרטי האתר נשמרו בהצלחה' })
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
                <div><h2>{PAGE_LABELS[selectedPage.slug] || selectedPage.title}</h2><p>התוכן נשמר בפורמט טקסט וניתן להוסיף פסקאות באמצעות שורה ריקה.</p></div>
                <label className="admin-content__toggle"><input type="checkbox" checked={selectedPage.is_published} onChange={(event) => changeSelectedPage({ is_published: event.target.checked })} />מפורסם באתר</label>
              </div>
              <Field label="כותרת העמוד" value={selectedPage.title} onChange={(title) => changeSelectedPage({ title })} />
              <label className="admin-content__field"><span>תוכן העמוד</span><textarea className="admin-content__body-editor" rows={18} value={selectedPage.body} onChange={(event) => changeSelectedPage({ body: event.target.value })} /></label>
              <Field label="תיאור למנועי חיפוש" value={selectedPage.meta_description || ''} onChange={(meta_description) => changeSelectedPage({ meta_description })} />
              <SaveBar label="שמירת העמוד" saving={saving === 'pages'} onClick={savePage} />
            </section>
          ) : <p className="admin-content__state">לא נמצאו עמודי תוכן.</p>}
        </div>
      )}

      {tab === 'site' && footer && contact && (
        <div className="admin-content__workspace">
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

function ImageField({ label, value, uploading, onChange, onUpload }: { label: string; value: string; uploading: boolean; onChange: (value: string) => void; onUpload: (file: File) => void }) {
  return (
    <div className="admin-content__image-field">
      <div className="admin-content__image-preview">{value ? <img src={value} alt="" /> : <span>אין תמונה</span>}</div>
      <div className="admin-content__image-controls">
        <Field label={label} value={value} dir="ltr" onChange={onChange} />
        <label className={`admin-content__upload ${uploading ? 'is-disabled' : ''}`}>
          {uploading ? 'מעלה…' : 'העלאת תמונה'}
          <input type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading} onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ''; if (file) onUpload(file) }} />
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
