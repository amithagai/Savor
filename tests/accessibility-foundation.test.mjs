import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

async function readProjectFile(relativePath) {
  return readFile(path.join(projectRoot, relativePath), 'utf8')
}

function relativeLuminance(hex) {
  const channels = hex.match(/[0-9a-f]{2}/gi).map(channel => Number.parseInt(channel, 16) / 255)
  const linear = channels.map(channel => (
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  ))
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2]
}

function contrastRatio(first, second) {
  const firstLuminance = relativeLuminance(first)
  const secondLuminance = relativeLuminance(second)
  return (Math.max(firstLuminance, secondLuminance) + 0.05)
    / (Math.min(firstLuminance, secondLuminance) + 0.05)
}

function cssVariable(styles, name) {
  return styles.match(new RegExp(`--${name}:\\s*(#[0-9a-f]{6})`, 'i'))?.[1]
}

test('the public layout exposes a skip link and one focusable main landmark', async () => {
  const layout = await readProjectFile('src/components/Layout/index.tsx')

  assert.match(layout, /href="#main-content"/)
  assert.match(layout, /<main id="main-content" ref=\{mainRef\} tabIndex=\{-1\}>/)
  assert.match(layout, /mainRef\.current\?\.focus\(\{ preventScroll: true \}\)/)
})

test('global styles provide visible keyboard focus and reduced motion support', async () => {
  const styles = await readProjectFile('src/index.css')

  assert.match(styles, /:focus-visible\s*\{/)
  assert.match(styles, /outline: 3px solid var\(--focus-ring\) !important;/)
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/)
})

test('the shared public palette meets AA contrast thresholds', async () => {
  const styles = await readProjectFile('src/index.css')
  const white = '#ffffff'
  const sage = cssVariable(styles, 'sage')
  const mutedText = cssVariable(styles, 'text-muted')
  const green = cssVariable(styles, 'green')
  const actionGreen = cssVariable(styles, 'signup-button')
  const controlBorder = cssVariable(styles, 'control-border')

  assert.ok(contrastRatio(mutedText, white) >= 4.5)
  assert.ok(contrastRatio(green, white) >= 4.5)
  assert.ok(contrastRatio(actionGreen, sage) >= 4.5)
  assert.ok(contrastRatio(controlBorder, white) >= 3)
})

test('public pages rely on the layout main landmark', async () => {
  const publicPages = [
    'src/pages/Accessories/index.tsx',
    'src/pages/AssemblyGuides/index.tsx',
    'src/pages/Cart/index.tsx',
    'src/pages/Catalog/index.tsx',
    'src/pages/Home/index.tsx',
    'src/pages/OrderConfirmation/index.tsx',
    'src/pages/ProductDetail/index.tsx',
    'src/pages/SingleProducts/index.tsx',
    'src/pages/SizeGuide/index.tsx',
  ]

  const contents = await Promise.all(publicPages.map(readProjectFile))

  for (const [index, content] of contents.entries()) {
    assert.doesNotMatch(content, /<\/?main\b/, publicPages[index])
  }
})

test('navigation disclosures expose state and keyboard controls', async () => {
  const navbar = await readProjectFile('src/components/Navbar/index.tsx')

  assert.match(navbar, /<nav className="navbar" aria-label="ניווט ראשי">/)
  assert.match(navbar, /aria-expanded=\{desktopMenuOpen\}/)
  assert.match(navbar, /aria-controls="desktop-kitchens-menu"/)
  assert.match(navbar, /event\.key === 'ArrowDown'/)
  assert.match(navbar, /event\.key === 'Escape'/)
  assert.doesNotMatch(navbar, /role="menu(?:item)?"/)
})

test('navigation dialogs trap and restore keyboard focus', async () => {
  const navbar = await readProjectFile('src/components/Navbar/index.tsx')

  assert.match(navbar, /function keepFocusInside/)
  assert.match(navbar, /id="mobile-navigation-dialog"/)
  assert.match(navbar, /id="wishlist-dialog"/)
  assert.equal((navbar.match(/aria-modal="true"/g) ?? []).length, 2)
  assert.match(navbar, /mobileMenuButtonRef\.current\?\.focus\(\)/)
  assert.match(navbar, /wishlistButtonRef\.current\?\.focus\(\)/)
})

test('navigation badges are excluded from duplicate announcements', async () => {
  const navbar = await readProjectFile('src/components/Navbar/index.tsx')

  assert.match(navbar, /מוצרים שאהבתי, \$\{wishlistItems\.length\} פריטים/)
  assert.match(navbar, /עגלת קניות, \$\{cartCount\} פריטים/)
  assert.match(navbar, /navbar__wishlist-count" aria-hidden="true"/)
  assert.match(navbar, /navbar__cart-badge" aria-hidden="true"/)
})

test('contact form links validation errors to their fields', async () => {
  const contact = await readProjectFile('src/pages/Contact/index.tsx')

  assert.match(contact, /noValidate/)
  assert.match(contact, /aria-labelledby="contact-form-title"/)
  assert.match(contact, /aria-invalid=\{submitAttempted && Boolean\(errors\.name\)\}/)
  assert.match(contact, /aria-describedby=\{submitAttempted && errors\.email \? 'contact-email-error'/)
  assert.match(contact, /querySelector<HTMLElement>\('\[aria-invalid="true"\]'\)/)
  assert.match(contact, /successRef\.current\?\.focus\(\)/)
})

test('the accessibility statement is routed, linked globally and transparent about open items', async () => {
  const router = await readProjectFile('src/router/index.tsx')
  const footer = await readProjectFile('src/components/Footer/index.tsx')
  const statement = await readProjectFile('src/pages/Accessibility/index.tsx')

  assert.match(router, /path: "accessibility", element: <Accessibility \/>/)
  assert.match(footer, /to="\/accessibility">הצהרת נגישות<\/Link>/)
  assert.match(statement, /id="website-accessibility"/)
  assert.match(statement, /id="physical-arrangements"/)
  assert.match(statement, /id="known-limitations"/)
  assert.match(statement, /id="accessibility-contact"/)
  assert.match(statement, /טרם בוצעה בדיקת\s+נגישות מלאה בידי איש מקצוע מוסמך/)
  assert.match(statement, /טרם נמסרו לצוות הפיתוח פרטים מאומתים לפרסום/)
  assert.doesNotMatch(statement, /האתר עומד בדרישות/)
})

test('route-aware metadata keeps the accessibility title after managed SEO loads', async () => {
  const metadata = await readProjectFile('src/components/SiteMetadata/index.tsx')
  const layout = await readProjectFile('src/components/Layout/index.tsx')
  const main = await readProjectFile('src/main.tsx')

  assert.match(metadata, /useLocation/)
  assert.match(metadata, /pathname === '\/accessibility'/)
  assert.match(metadata, /ACCESSIBILITY_TITLE/)
  assert.match(metadata, /ACCESSIBILITY_DESCRIPTION/)
  assert.match(metadata, /\[data, pathname\]/)
  assert.match(layout, /<SiteMetadata \/>/)
  assert.doesNotMatch(main, /<SiteMetadata \/>/)
})

test('accessibility reports open a contextualized and accessible contact form', async () => {
  const statement = await readProjectFile('src/pages/Accessibility/index.tsx')
  const contact = await readProjectFile('src/pages/Contact/index.tsx')

  assert.match(statement, /to="\/contact\?topic=accessibility"/)
  assert.match(contact, /searchParams\.get\('topic'\) === 'accessibility'/)
  assert.match(contact, /ACCESSIBILITY_MESSAGE_PREFIX/)
  assert.match(contact, /aria-describedby=\{isAccessibilityInquiry \? 'accessibility-form-help'/)
  assert.match(contact, /כתובת עמוד, תיאור הקושי, דפדפן, מערכת הפעלה וטכנולוגיה/)
})

test('accessibility details and PDF documents can be managed from the admin interface', async () => {
  const admin = await readProjectFile('src/pages/AdminContent/index.tsx')
  const statement = await readProjectFile('src/pages/Accessibility/index.tsx')
  const accessibilityLib = await readProjectFile('src/lib/accessibility.ts')

  assert.match(admin, /ContentTab = 'home' \| 'pages' \| 'site' \| 'accessibility'/)
  assert.match(admin, /'\/admin\/content\/site\/accessibility'/)
  assert.match(admin, /שמירת פרטי הנגישות/)
  assert.match(admin, /accept="application\/pdf,\.pdf"/)
  assert.match(admin, /uploadAccessibilityDocument/)
  assert.match(admin, /coordinator_name/)
  assert.match(admin, /physical_arrangements/)
  assert.match(statement, /useSiteContent<AccessibilityContent>\('accessibility'\)/)
  assert.match(statement, /id="accessible-documents"/)
  assert.match(accessibilityLib, /parsed\.protocol === 'https:'/)
})

test('checkout allows validation and focuses the first invalid field', async () => {
  const cart = await readProjectFile('src/pages/Cart/index.tsx')

  assert.match(cart, /aria-labelledby="checkout-form-title"/)
  assert.match(cart, /noValidate/)
  assert.match(cart, /disabled=\{isSubmitting\}/)
  assert.doesNotMatch(cart, /disabled=\{!isFormValid \|\| isSubmitting\}/)
  assert.match(cart, /querySelector<HTMLElement>\(\s*'\[aria-invalid="true"\]'/)
  assert.match(cart, /nextFocusTarget = firstInvalidField \?\? validationSummaryRef\.current/)
})

test('checkout address inputs have distinct labels and error descriptions', async () => {
  const cart = await readProjectFile('src/pages/Cart/index.tsx')

  assert.match(cart, /<label htmlFor="streetAddress">רחוב ומספר בית \(חובה\)<\/label>/)
  assert.match(cart, /<label htmlFor="apartment">דירה \/ יחידה \(אופציונלי\)<\/label>/)
  assert.match(cart, /aria-describedby=\{submitAttempted && checkoutErrors\.streetAddress \? 'streetAddress-error'/)
  assert.match(cart, /aria-describedby=\{submitAttempted && checkoutErrors\.agreedToTerms \? 'agreedToTerms-error'/)
})

test('newsletter email input has a persistent label and autocomplete metadata', async () => {
  const emailInput = await readProjectFile('src/components/Input/EmailInput.tsx')
  const homeNewsletter = await readProjectFile('src/pages/Home/sections/NewsletterSection.tsx')
  const footer = await readProjectFile('src/components/Footer/index.tsx')

  assert.match(emailInput, /<label className="visually-hidden" htmlFor=\{id\}>\{label\}<\/label>/)
  assert.match(emailInput, /autoComplete="email"/)
  assert.match(homeNewsletter, /aria-labelledby="home-newsletter-title"/)
  assert.match(homeNewsletter, /id="home-newsletter-consent"/)
  assert.match(footer, /<form className="footer__email-row" aria-label="הרשמה לניוזלטר"/)
})

test('animated announcements expose one non-duplicated accessible copy', async () => {
  const announcements = await readProjectFile('src/pages/Home/sections/AnnouncementBar.tsx')

  assert.match(announcements, /<section className="announcement-bar" aria-label="הודעות חשובות">/)
  assert.match(announcements, /<ul className="visually-hidden">/)
  assert.match(announcements, /className="announcement-bar__track" aria-hidden="true"/)
})

test('gallery hotspots identify their tooltips and support Escape', async () => {
  const gallery = await readProjectFile('src/pages/Home/sections/GallerySection.tsx')

  assert.match(gallery, /aria-labelledby="gallery-title" aria-describedby="gallery-description"/)
  assert.match(gallery, /aria-controls=\{`gallery-tooltip-top-\$\{index\}`\}/)
  assert.match(gallery, /role="tooltip"/)
  assert.match(gallery, /event\.key === 'Escape'/)
})

test('repeated ratings use unique ids and hide decorative stars', async () => {
  const testimonials = await readProjectFile('src/pages/Home/sections/TestimonialsSection.tsx')

  assert.match(testimonials, /const gradientPrefix = useId\(\)/)
  assert.match(testimonials, /role="img" aria-label=\{`דירוג \$\{rating\} מתוך 5`\}/)
  assert.match(testimonials, /aria-hidden="true" focusable="false"/)
  assert.doesNotMatch(testimonials, /id=\{`g-\$\{i\}`\}/)
})

test('cookie choices are named and tolerate unavailable storage', async () => {
  const footer = await readProjectFile('src/components/Footer/index.tsx')

  assert.match(footer, /function hasSavedCookieChoice\(\)/)
  assert.match(footer, /catch \{/)
  assert.match(footer, /<section className="cookie-banner" aria-labelledby="cookie-banner-title">/)
  assert.match(footer, /type="button"\s+className="cookie-banner__accept"/)
  assert.match(footer, /type="button"\s+className="cookie-banner__dismiss"/)
})

test('catalog results and cart changes are announced', async () => {
  const catalog = await readProjectFile('src/pages/Catalog/index.tsx')
  const productCard = await readProjectFile('src/components/ProductCard/index.tsx')

  assert.match(catalog, /className="catalog-page__empty" role="status"/)
  assert.match(catalog, /className="catalog-page__empty" role="alert"/)
  assert.match(catalog, /className="catalog-page__grid" aria-label="תוצאות הקטלוג"/)
  assert.match(catalog, /message: `\$\{product\.name\} נוסף לעגלת הקניות\.`/)
  assert.match(productCard, /type="button"/)
  assert.match(productCard, /aria-label=\{actionLabel\}/)
})

test('configurator controls expose labels, state and live feedback', async () => {
  const configurator = await readProjectFile('src/pages/Configurator/index.tsx')

  assert.match(configurator, /<label className="cfg__field-label" htmlFor="cfg-wall-length">/)
  assert.match(configurator, /aria-invalid=\{Boolean\(wallLengthError\)\}/)
  assert.match(configurator, /aria-controls="cfg-how-steps"/)
  assert.match(configurator, /hidden=\{!howOpen\}/)
  assert.match(configurator, /className="cfg__tabs" role="group" aria-label="סינון לפי סוג פריט"/)
  assert.match(configurator, /aria-pressed=\{selectedCategories\.length === 1/)
  assert.match(configurator, /role="status"\s+aria-live="polite"\s+aria-atomic="true"/)
})

test('configurator product cards do not nest interactive controls', async () => {
  const configurator = await readProjectFile('src/pages/Configurator/index.tsx')

  assert.match(configurator, /<article\s+key=\{wishlistId\}/)
  assert.match(configurator, /className="cfg__product-select"/)
  assert.match(configurator, /aria-label=\{`\$\{wishlistSelected \? 'הסרת' : 'הוספת'\}/)
  assert.doesNotMatch(configurator, /role="button"\s+tabIndex=/)
})

test('configurator visualizations have text context and named view controls', async () => {
  const configurator = await readProjectFile('src/pages/Configurator/index.tsx')
  const viewer = await readProjectFile('src/pages/Configurator/KitchenModelViewer.tsx')

  assert.match(configurator, /aria-labelledby="cfg-visual-title"/)
  assert.match(configurator, /className="cfg__view-btns" role="group" aria-label="סוג התצוגה"/)
  assert.match(configurator, /aria-pressed=\{viewMode === mode\}/)
  assert.match(viewer, /aria-labelledby="cfg3d-viewer-title"/)
  assert.match(viewer, /את המיקום אפשר לשנות בגרירה או באמצעות בקרי המקלדת/)
})

test('configurator positioning has a complete keyboard-operated path', async () => {
  const configurator = await readProjectFile('src/pages/Configurator/index.tsx')
  const controls = await readProjectFile('src/pages/Configurator/KeyboardPositionControls.tsx')
  const viewer2d = await readProjectFile('src/pages/Configurator/Configurator2DView.tsx')
  const viewer3d = await readProjectFile('src/pages/Configurator/KitchenModelViewer.tsx')

  assert.match(configurator, /<KeyboardPositionControls/)
  assert.match(configurator, /setKeyboardCabinetPlacement/)
  assert.match(configurator, /role="status"\s+aria-live="polite"/)
  assert.match(controls, /<summary>מיקום פריטים באמצעות מקלדת<\/summary>/)
  assert.match(controls, /type="range"/)
  assert.match(controls, /aria-valuetext=\{`\$\{safeValue\} סנטימטרים`\}/)
  assert.match(controls, /<select\s+value=\{placement\.wall\}/)
  assert.match(viewer2d, /closestAccessoryXOnCounterRuns/)
  assert.match(viewer3d, /closestAccessoryXOnCounterRuns/)
})

test('catalog and configurator reflow without horizontal component scrollers', async () => {
  const catalogStyles = await readProjectFile('src/pages/Catalog/Catalog.css')
  const configuratorStyles = await readProjectFile('src/pages/Configurator/Configurator.css')

  assert.match(catalogStyles, /\.catalog-page__filter \{ min-height: 44px;/)
  assert.match(catalogStyles, /\.catalog-page__filters \{[\s\S]*?flex-wrap: wrap;[\s\S]*?overflow-x: visible;/)
  assert.match(configuratorStyles, /@media \(max-width: 960px\)/)
  assert.match(configuratorStyles, /\.cfg__product-list \{[\s\S]*?flex-direction: column;[\s\S]*?overflow: visible;/)
  assert.match(configuratorStyles, /\.cfg__cart \{[\s\S]*?height: auto;[\s\S]*?overflow: visible;/)
  assert.match(configuratorStyles, /\.cfg__drag-hint \{[\s\S]*?white-space: normal;/)
})
