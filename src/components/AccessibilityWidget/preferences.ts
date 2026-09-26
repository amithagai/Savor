export const STORAGE_KEY = 'savor-accessibility-v1'
export const defaults = {
  contrast: 'none', saturation: 'normal', fontSize: 0, lineSpacing: 0,
  wordSpacing: 0, letterSpacing: 0, zoom: 0, cursor: 'none',
  background: '', headings: '', text: '', readable: false, reduceMotion: false,
  links: false, highlightHeadings: false, controls: false, largeTargets: false,
  readingGuide: false, readingFocus: false, mute: false,
  keyboard: false, screenReader: false, captions: false,
}
export type Preferences = typeof defaults
export type ToggleKey = { [K in keyof Preferences]: Preferences[K] extends boolean ? K : never }[keyof Preferences]
export type RangeKey = 'fontSize' | 'lineSpacing' | 'wordSpacing' | 'letterSpacing' | 'zoom'
export const profiles: { id: string; label: string; description: string; values: Partial<Preferences> }[] = [
  { id: 'blind', label: 'עיוורון', description: 'גישה מהירה לאזורי העמוד ולכותרות, עם ניווט מקלדת מודגש. מיועד לשימוש לצד קורא המסך שלכם.', values: { screenReader: true, keyboard: true } },
  { id: 'motor', label: 'הפרעה במיומנויות מוטוריות', description: 'הגדלת יעדי לחיצה והדגשת המיקוד במקלדת.', values: { largeTargets: true, keyboard: true, controls: true } },
  { id: 'color', label: 'עיוורון צבעים', description: 'הפחתת צבעים והדגשת קישורים באמצעות קו תחתון.', values: { saturation: 'mono', links: true } },
  { id: 'vision', label: 'לקויי ראייה', description: 'הגדלת הטקסט והסמן, והפעלת ניגודיות כהה.', values: { fontSize: 2, contrast: 'dark', cursor: 'white' } },
  { id: 'motion', label: 'אפילפסיה', description: 'צמצום אנימציות והשהיית מדיה באתר. ההגדרה אינה מבטיחה מניעת כל הבהוב בתוכן חיצוני.', values: { reduceMotion: true } },
  { id: 'attention', label: 'הפרעת קשב וריכוז', description: 'צמצום תנועה והפעלת חלון מיקוד לקריאה.', values: { reduceMotion: true, readingFocus: true } },
  { id: 'learning', label: 'למידה', description: 'גופן פשוט, ריווח שורות ומדריך קריאה.', values: { readable: true, lineSpacing: 2, readingGuide: true } },
  { id: 'senior', label: 'בני הגיל השלישי', description: 'טקסט וכפתורים גדולים יותר וקישורים מודגשים.', values: { fontSize: 2, largeTargets: true, links: true } },
  { id: 'dyslexia', label: 'דיסלקסיה', description: 'גופן פשוט וריווח בין מילים ושורות; אפשר לכוון את הערכים לפי הנוחות האישית.', values: { readable: true, wordSpacing: 2, lineSpacing: 2 } },
  { id: 'basic', label: 'התאמות נגישות משולבות', description: 'הדגשת קישורים, מיקוד מקלדת וצמצום תנועה. הפעלת פרופיל אינה אישור לעמידה בתקן WCAG.', values: { links: true, keyboard: true, reduceMotion: true } },
]

export function normalizePreferences(value: unknown): Preferences {
  const result = { ...defaults }
  if (!value || typeof value !== 'object') return result
  const source = value as Record<string, unknown>
  for (const key of Object.keys(defaults) as (keyof Preferences)[]) {
    const v = source[key]
    if (typeof defaults[key] === 'boolean' && typeof v === 'boolean') Object.assign(result, { [key]: v })
    if (typeof defaults[key] === 'number' && typeof v === 'number' && Number.isFinite(v)) Object.assign(result, { [key]: Math.max(0, Math.min(5, Math.round(v))) })
  }
  for (const [key, allowed] of Object.entries({ contrast: ['none', 'light', 'dark', 'high'], saturation: ['normal', 'low', 'high', 'mono'], cursor: ['none', 'black', 'white'] })) {
    if (allowed.includes(String(source[key]))) Object.assign(result, { [key]: source[key] })
  }
  for (const key of ['background', 'headings', 'text'] as const) {
    if (typeof source[key] === 'string' && /^#[\da-f]{6}$/i.test(source[key])) result[key] = source[key]
  }
  return result
}

export function readPreferences(): Preferences {
  try { return normalizePreferences(JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')) }
  catch { return { ...defaults } }
}

export function isWidgetHidden(): boolean {
  try {
    return sessionStorage.getItem(`${STORAGE_KEY}-session-hidden`) === 'true'
      || Number(localStorage.getItem(`${STORAGE_KEY}-hidden-until`)) > Date.now()
  } catch { return false }
}

export function hideForDuration(duration: string) {
  try {
    if (duration === 'session') sessionStorage.setItem(`${STORAGE_KEY}-session-hidden`, 'true')
    else localStorage.setItem(`${STORAGE_KEY}-hidden-until`, String(Date.now() + Number(duration) * 86400000))
  } catch { /* Hiding still works for the current page when storage is unavailable. */ }
}
