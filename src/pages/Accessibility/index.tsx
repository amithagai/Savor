import { Link } from 'react-router-dom'

import { useSiteContent } from '../../hooks/useSiteContent'
import {
  normalizeAccessibilityContent,
  safeAccessibilityDocumentUrl,
} from '../../lib/accessibility'
import type { AccessibilityContent, ContactContent, FooterContent } from '../../types/content'
import './Accessibility.css'

const DEFAULT_PHONE_DISPLAY = '055-556-5617'
const DEFAULT_PHONE_LINK = '0555565617'

function splitParagraphs(value: string) {
  return value.split(/\n\s*\n/).map((paragraph) => paragraph.trim()).filter(Boolean)
}

function formatHebrewDate(value: string) {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T12:00:00`)
    : null
  if (!date || Number.isNaN(date.getTime())) return '14 בספטמבר 2026'
  return new Intl.DateTimeFormat('he-IL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

export default function Accessibility() {
  const { data: managedAccessibility } = useSiteContent<AccessibilityContent>('accessibility')
  const { data: contactContent } = useSiteContent<ContactContent>('contact')
  const { data: footerContent } = useSiteContent<FooterContent>('footer')
  const accessibility = normalizeAccessibilityContent(managedAccessibility)
  const contactEmail = contactContent?.email?.trim()
  const pickupAddress = accessibility.pickup_address.trim()
    || footerContent?.pickup_address?.trim()
    || 'מומנטום, שדרות טום לנטוס 10, נתניה'
  const physicalArrangements = splitParagraphs(accessibility.physical_arrangements)
  const managedLimitations = splitParagraphs(accessibility.known_limitations)
  const documents = accessibility.documents.flatMap((document) => {
    const url = safeAccessibilityDocumentUrl(document.url)
    return document.title.trim() && url ? [{ ...document, url }] : []
  })
  const hasCoordinator = Boolean(accessibility.coordinator_name.trim())
  const lastUpdated = formatHebrewDate(accessibility.last_updated)

  return (
    <article className="accessibility-statement" dir="rtl">
      <div className="accessibility-statement__container">
        <header className="accessibility-statement__header">
          <p className="accessibility-statement__eyebrow">שירות שוויוני לכולם</p>
          <h1>הצהרת נגישות</h1>
          <p className="accessibility-statement__lead">
            Savor Kitchens פועלת לאפשר לאנשים עם מוגבלות להשתמש באתר ולקבל את
            השירות באופן עצמאי, מכבד ושוויוני.
          </p>
          <p className="accessibility-statement__updated">
            תאריך עדכון אחרון: <time dateTime={accessibility.last_updated}>{lastUpdated}</time>
          </p>
        </header>

        <aside className="accessibility-statement__status" aria-labelledby="accessibility-status-title">
          <h2 id="accessibility-status-title">מצב ההנגשה</h2>
          <p>
            האתר נמצא בתהליך הנגשה ובדיקות. מטרת העבודה היא עמידה ברמה AA של
            התקן הישראלי ת״י 5568, המבוסס על הנחיות WCAG 2.0. טרם בוצעה בדיקת
            נגישות מלאה בידי איש מקצוע מוסמך, ולכן אין לראות בעמוד זה אישור
            לעמידה מלאה בכל דרישות הדין.
          </p>
        </aside>

        <nav className="accessibility-statement__contents" aria-label="תוכן הצהרת הנגישות">
          <h2>בעמוד זה</h2>
          <ul>
            <li><a href="#website-accessibility">נגישות האתר</a></li>
            <li><a href="#using-the-site">שימוש באתר</a></li>
            <li><a href="#physical-arrangements">הסדרי נגישות במקום השירות</a></li>
            <li><a href="#known-limitations">מגבלות ידועות</a></li>
            {documents.length > 0 ? <li><a href="#accessible-documents">מסמכים נגישים</a></li> : null}
            <li><a href="#accessibility-contact">דיווח ופנייה בנושא נגישות</a></li>
          </ul>
        </nav>

        <section id="website-accessibility" aria-labelledby="website-accessibility-title">
          <h2 id="website-accessibility-title">נגישות האתר</h2>
          <p>במסגרת עבודת ההנגשה בוצעו, בין היתר, ההתאמות הבאות:</p>
          <ul>
            <li>מבנה כותרות ואזורים סמנטיים התומך בטכנולוגיות מסייעות.</li>
            <li>קישור לדילוג ישירות לתוכן הראשי ומיקוד ברור בניווט מקלדת.</li>
            <li>אפשרות להפעיל תפריטים, טפסים, עגלה וכלי תכנון באמצעות מקלדת.</li>
            <li>שמות והוראות ברורים לשדות, הודעות שגיאה ומשוב שמוקראים לקורא מסך.</li>
            <li>ניגודיות צבעים, יעדי לחיצה והתאמה להגדלת טקסט ולמסכים צרים.</li>
            <li>טקסט חלופי לתמונות משמעותיות והסתרת תמונות עיטוריות מקורא מסך.</li>
            <li>צמצום תנועה ואנימציות בהתאם להעדפת מערכת ההפעלה.</li>
          </ul>
        </section>

        <section id="using-the-site" aria-labelledby="using-the-site-title">
          <h2 id="using-the-site-title">שימוש באתר</h2>
          <ul>
            <li><kbd>Tab</kbd> מעביר לרכיב הבא ו־<kbd>Shift</kbd> + <kbd>Tab</kbd> לרכיב הקודם.</li>
            <li><kbd>Enter</kbd> או <kbd>רווח</kbd> מפעילים קישורים וכפתורים לפי סוג הרכיב.</li>
            <li><kbd>Esc</kbd> סוגר תפריטים וחלונות פתוחים במקומות שבהם הדבר רלוונטי.</li>
            <li>אפשר להגדיל את התצוגה באמצעות כלי ההגדלה המובנים בדפדפן.</li>
          </ul>
        </section>

        <section id="physical-arrangements" aria-labelledby="physical-arrangements-title">
          <h2 id="physical-arrangements-title">הסדרי נגישות במקום השירות</h2>
          <p>נקודת האיסוף המופיעה באתר: {pickupAddress}.</p>
          {physicalArrangements.length > 0 ? (
            <div className="accessibility-statement__managed-copy">
              {physicalArrangements.map((paragraph, index) => <p key={`${paragraph}-${index}`}>{paragraph}</p>)}
            </div>
          ) : (
            <div className="accessibility-statement__notice">
              <h3>מידע שממתין לאימות לפני הפרסום הסופי</h3>
              <p>
                טרם נמסרו לצוות הפיתוח פרטים מאומתים על חניה נגישה, הדרך מהחניה
                או מתחנת התחבורה הציבורית, כניסה נגישה, רוחב מעברים, שירותים נגישים
                ואביזרי עזר במקום. עד להשלמת המידע, מומלץ לתאם את ההגעה מראש בטלפון
                כדי שנוכל למסור מידע פרטני ולספק התאמה סבירה ככל האפשר.
              </p>
            </div>
          )}
        </section>

        <section id="known-limitations" aria-labelledby="known-limitations-title">
          <h2 id="known-limitations-title">מגבלות נגישות ידועות</h2>
          {managedLimitations.length > 0 ? (
            <ul>{managedLimitations.map((limitation, index) => <li key={`${limitation}-${index}`}>{limitation}</li>)}</ul>
          ) : (
            <ul>
              <li>
                תצוגת המטבח התלת־ממדית היא רכיב חזותי מורכב. לצידה קיימים תיאור
                טקסטואלי, תצוגה דו־ממדית ובקרי מיקום שניתנים להפעלה במקלדת.
              </li>
              <li>
                מפת Google ותכנים חיצוניים אחרים תלויים בנגישות של ספק צד שלישי.
                כתובת המקום מופיעה גם כטקסט, וניתן לקבל הוראות הגעה באמצעות שירות הלקוחות.
              </li>
              <li>
                מסמכים או חוברות ישנים עלולים להיות בתהליך הנגשה. אפשר לבקש חלופה
                נגישה באמצעות פרטי הקשר שלהלן.
              </li>
            </ul>
          )}
        </section>

        {documents.length > 0 ? (
          <section id="accessible-documents" aria-labelledby="accessible-documents-title">
            <h2 id="accessible-documents-title">מסמכים נגישים</h2>
            <ul className="accessibility-statement__documents">
              {documents.map((document) => (
                <li key={document.id}>
                  <a href={document.url} target="_blank" rel="noopener noreferrer">
                    {document.title}
                    <span className="visually-hidden"> (נפתח בלשונית חדשה)</span>
                  </a>
                  {document.description.trim() ? <p>{document.description}</p> : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section id="accessibility-contact" aria-labelledby="accessibility-contact-title">
          <h2 id="accessibility-contact-title">דיווח ופנייה בנושא נגישות</h2>
          <p>
            נתקלתם בקושי או שאתם זקוקים להתאמה? נשמח לקבל פנייה מפורטת ולטפל בה.
            כדי לסייע לנו, מומלץ לציין את כתובת העמוד, תיאור הבעיה, סוג הדפדפן
            ומערכת ההפעלה והטכנולוגיה המסייעת שבה נעשה שימוש, אם רלוונטי.
          </p>

          <address className="accessibility-statement__contact-card">
            <p>
              טלפון: <a href={`tel:${DEFAULT_PHONE_LINK}`} dir="ltr">{DEFAULT_PHONE_DISPLAY}</a>
            </p>
            {contactEmail ? (
              <p>דוא״ל: <a href={`mailto:${contactEmail}`} dir="ltr">{contactEmail}</a></p>
            ) : null}
            <Link className="accessibility-statement__contact-link" to="/contact?topic=accessibility">
              פתיחת טופס פנייה בנושא נגישות
            </Link>
          </address>

          {hasCoordinator ? (
            <div className="accessibility-statement__notice accessibility-statement__notice--confirmed">
              <h3>פרטי רכז או רכזת נגישות</h3>
              <address>
                <p>{accessibility.coordinator_name}</p>
                {accessibility.coordinator_role.trim() ? <p>{accessibility.coordinator_role}</p> : null}
                {accessibility.coordinator_phone.trim() ? (
                  <p>טלפון: <a href={`tel:${accessibility.coordinator_phone.replace(/[^\d+]/g, '')}`} dir="ltr">{accessibility.coordinator_phone}</a></p>
                ) : null}
                {accessibility.coordinator_email.trim() ? (
                  <p>דוא״ל: <a href={`mailto:${accessibility.coordinator_email}`} dir="ltr">{accessibility.coordinator_email}</a></p>
                ) : null}
              </address>
            </div>
          ) : (
            <div className="accessibility-statement__notice">
              <h3>פרטי רכז או רכזת נגישות</h3>
              <p>
                טרם נמסרו לצוות הפיתוח פרטים מאומתים לפרסום. אם העסק מחויב במינוי
                רכז נגישות לפי החוק, יש להוסיף לפני פרסום האתר את השם, התפקיד ודרכי
                ההתקשרות הישירות.
              </p>
            </div>
          )}
        </section>

        <p className="accessibility-statement__reference">
          מידע נוסף זמין ב{' '}
          <a
            href="https://www.gov.il/he/pages/declaration_website_accessibility"
            target="_blank"
            rel="noopener noreferrer"
          >
            מדריך נציבות שוויון זכויות לאנשים עם מוגבלות להצהרת נגישות
            <span className="visually-hidden"> (נפתח בלשונית חדשה)</span>
          </a>
          .
        </p>
      </div>
    </article>
  )
}
