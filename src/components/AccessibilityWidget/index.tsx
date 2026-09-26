import { useEffect, useRef, useState, type ReactNode, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { createPortal } from 'react-dom'
import { Link, useLocation } from 'react-router-dom'
import Icon from './Icon'
import { defaults, profiles, readPreferences, isWidgetHidden, hideForDuration, STORAGE_KEY, type Preferences, type ToggleKey, type RangeKey } from './preferences'
import { useAccessibilityEffects } from './useAccessibilityEffects'
import './widget.css'

type Tool = 'regions' | 'structure' | 'reader' | 'summary' | 'magnify' | 'images' | 'dictionary' | 'hide' | null
type Recognition = { lang: string; onresult: ((event: { results: { [index: number]: { [index: number]: { transcript: string } } } }) => void) | null; onerror: (() => void) | null; onend: (() => void) | null; start: () => void; abort: () => void }
type VoiceWindow = Window & { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition }
const focusable = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex="0"]'

function Section({ title, children, expanded = true }: { title: string; children: ReactNode; expanded?: boolean }) {
  return <details className="aw-section" open={expanded}><summary>{title}<span aria-hidden="true" /></summary><div className="aw-section-body">{children}</div></details>
}
function Tile({ label, icon, active, onClick }: { label: string; icon: string; active?: boolean; onClick: () => void }) {
  return <button className="aw-tile" type="button" aria-pressed={active} onClick={onClick}><Icon name={icon} /><span>{label}</span>{active ? <b className="aw-check" aria-hidden="true">✓</b> : null}</button>
}

export default function AccessibilityWidget() {
  const { pathname } = useLocation()
  const [settings, setSettings] = useState(readPreferences)
  const [hidden, setHidden] = useState(isWidgetHidden)
  const [open, setOpen] = useState(false)
  const [wide, setWide] = useState(true)
  const [profile, setProfile] = useState<string | null>(null)
  const [tool, setTool] = useState<Tool>(null)
  const [message, setMessage] = useState('')
  const [hideDuration, setHideDuration] = useState('session')
  const [colorTarget, setColorTarget] = useState<'background' | 'headings' | 'text'>('background')
  const [rangeTarget, setRangeTarget] = useState<RangeKey>('fontSize')
  const [entries, setEntries] = useState<{ label: string; element?: HTMLElement }[]>([])
  const [readingText, setReadingText] = useState('')
  const [dictionaryWord, setDictionaryWord] = useState('')
  const [speaking, setSpeaking] = useState(false)
  const [listening, setListening] = useState(false)
  const [virtualKeyboard, setVirtualKeyboard] = useState(false)
  const [keyboardEnglish, setKeyboardEnglish] = useState(false)
  const [inputLabel, setInputLabel] = useState('בחרו שדה באתר ולאחר מכן הקלידו כאן')
  const dialog = useRef<HTMLDialogElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const previousFocus = useRef<HTMLElement | null>(null)
  const savedSelection = useRef('')
  const activeInput = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null)
  const recognition = useRef<Recognition | null>(null)
  const guide = useRef<HTMLDivElement>(null)
  const focusMask = useRef<HTMLDivElement>(null)
  const profilePrevious = useRef<Preferences | null>(null)
  const speechVersion = useRef(0)
  const currentUtterance = useRef<SpeechSynthesisUtterance | null>(null)
  const toolHeading = useRef<HTMLHeadingElement>(null)
  useAccessibilityEffects(settings, pathname)

  function change<K extends keyof Preferences>(key: K, value: Preferences[K]) {
    setProfile(null); profilePrevious.current = null
    setSettings(current => ({ ...current, [key]: value }))
  }
  function toggle(key: ToggleKey) { change(key, !settings[key]) }
  function keepFocusInside(event: ReactKeyboardEvent<HTMLDialogElement>) {
    if (event.key !== 'Tab') return
    const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(`${focusable},summary`))
      .filter(element => element.getClientRects().length > 0 && getComputedStyle(element).visibility !== 'hidden')
    const first = controls[0]
    const last = controls[controls.length - 1]
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
  }
  function close() { recognition.current?.abort(); setOpen(false); setTool(null) }
  function show() {
    savedSelection.current = window.getSelection()?.toString().trim() || ''
    previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    setOpen(true); setHidden(false)
  }
  function stopSpeech() { speechVersion.current += 1; window.speechSynthesis?.cancel(); currentUtterance.current = null; setSpeaking(false) }
  function reset() {
    setSettings({ ...defaults }); setProfile(null); profilePrevious.current = null
    stopSpeech(); recognition.current?.abort(); setVirtualKeyboard(false)
    setMessage('כל התאמות הנגישות אופסו.')
  }

  useEffect(() => {
    if (open) dialog.current?.showModal()
    else if (dialog.current?.open) {
      dialog.current.close()
      const target = previousFocus.current?.isConnected ? previousFocus.current : trigger.current
      target?.focus({ preventScroll: true })
    }
  }, [open])

  useEffect(() => {
    if (tool) {
      toolHeading.current?.focus({ preventScroll: true })
      dialog.current?.querySelector('.aw-scroll')?.scrollTo({ top: 0 })
    }
  }, [tool])

  useEffect(() => {
    const restore = () => {
      try { sessionStorage.removeItem(`${STORAGE_KEY}-session-hidden`); localStorage.removeItem(`${STORAGE_KEY}-hidden-until`) } catch { /* Optional storage. */ }
      previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
      setHidden(false); setOpen(true)
    }
    const shortcut = (event: KeyboardEvent) => {
      if (event.altKey && event.key === '0') { event.preventDefault(); restore() }
    }
    const rememberInput = (event: FocusEvent) => {
      const target = event.target
      if ((target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) && target.closest('#site-content') && !target.disabled && !target.readOnly && (target instanceof HTMLTextAreaElement || ['text', 'search', 'email', 'tel', 'url', 'password'].includes(target.type))) {
        activeInput.current = target
        setInputLabel(target.labels?.[0]?.textContent?.trim() || target.getAttribute('aria-label') || 'שדה טקסט נבחר')
      }
    }
    window.addEventListener('savor:open-accessibility', restore)
    document.addEventListener('keydown', shortcut)
    document.addEventListener('focusin', rememberInput)
    return () => {
      window.removeEventListener('savor:open-accessibility', restore)
      document.removeEventListener('keydown', shortcut)
      document.removeEventListener('focusin', rememberInput)
      window.speechSynthesis?.cancel(); recognition.current?.abort()
    }
  }, [])

  useEffect(() => {
    if (!settings.readingGuide && !settings.readingFocus) return
    const move = (y: number) => {
      guide.current?.style.setProperty('top', `${y + 18}px`)
      focusMask.current?.style.setProperty('top', `${Math.max(0, y - 48)}px`)
    }
    const pointer = (event: PointerEvent) => move(event.clientY)
    const keyboard = (event: FocusEvent) => {
      if (event.target instanceof HTMLElement && event.target.closest('#site-content')) { const bounds = event.target.getBoundingClientRect(); move(bounds.top + bounds.height / 2) }
    }
    document.addEventListener('pointermove', pointer, { passive: true })
    document.addEventListener('focusin', keyboard)
    return () => { document.removeEventListener('pointermove', pointer); document.removeEventListener('focusin', keyboard) }
  }, [settings.readingGuide, settings.readingFocus])

  function activateProfile(id: string) {
    if (profile === id) { setSettings(profilePrevious.current || { ...defaults }); setProfile(null); profilePrevious.current = null; return }
    const selected = profiles.find(item => item.id === id)!
    const base = profilePrevious.current || settings
    profilePrevious.current = base
    setSettings({ ...base, ...selected.values }); setProfile(id)
  }
  function openTool(next: Tool) {
    const main = document.getElementById('main-content')
    setReadingText(savedSelection.current || main?.innerText || '')
    if (next === 'regions' || next === 'structure' || next === 'summary') {
      const selector = next === 'regions' ? 'header,nav,main,footer,[role="region"],section[aria-label],section[aria-labelledby]' : 'h1,h2,h3,h4,h5,h6'
      const nodes = Array.from(document.querySelectorAll<HTMLElement>(`#site-content :is(${selector})`)).filter(el => el.getClientRects().length && !el.closest('[aria-hidden="true"]'))
      setEntries(nodes.map(el => ({ element: el, label: el.getAttribute('aria-label') || document.getElementById(el.getAttribute('aria-labelledby') || '')?.textContent?.trim() || (next === 'regions' ? ({ MAIN: 'תוכן ראשי', NAV: 'ניווט', FOOTER: 'תחתית האתר', HEADER: 'ראש האתר' }[el.tagName] || el.querySelector('h1,h2,h3')?.textContent?.trim()) : el.innerText.trim()) || 'אזור בעמוד' })))
    }
    if (next === 'images') setEntries(Array.from(main?.querySelectorAll<HTMLImageElement>('img[alt]') || []).filter(el => el.alt.trim()).map(el => ({ label: el.alt, element: el })))
    if (next === 'dictionary') setDictionaryWord(savedSelection.current.slice(0, 100))
    setTool(next)
  }
  function jump(element?: HTMLElement) {
    close()
    requestAnimationFrame(() => {
      if (!element?.isConnected) return
      if (!element.hasAttribute('tabindex') && !element.matches(focusable)) {
        element.setAttribute('tabindex', '-1')
        element.addEventListener('blur', () => element.removeAttribute('tabindex'), { once: true })
      }
      element.focus({ preventScroll: true }); element.scrollIntoView({ block: 'center', behavior: 'instant' })
    })
  }
  function speak() {
    if (speaking) { stopSpeech(); return }
    if (!('speechSynthesis' in window)) { setMessage('הקראת טקסט אינה זמינה בדפדפן זה. אפשר להשתמש בקורא המסך של המכשיר.'); return }
    const text = savedSelection.current || document.getElementById('main-content')?.innerText || ''
    if (!text.trim()) { setMessage('אין טקסט זמין להקראה בעמוד.'); return }
    window.speechSynthesis.cancel()
    const version = ++speechVersion.current
    const chunks = text.match(/.{1,180}(?:\s|$)/gs) || [text]
    let index = 0
    const next = () => {
      if (version !== speechVersion.current) return
      if (index >= chunks.length) { setSpeaking(false); return }
      const utterance = new SpeechSynthesisUtterance(chunks[index++])
      currentUtterance.current = utterance
      utterance.lang = 'he-IL'; utterance.onend = next
      utterance.onerror = () => { if (version === speechVersion.current) { setSpeaking(false); setMessage('ההקראה הופסקה. הזמינות וההגייה בעברית תלויות בקולות המותקנים במכשיר.') } }
      window.speechSynthesis.speak(utterance)
    }
    setSpeaking(true); setMessage('מקריאים את הטקסט שנבחר או את תוכן העמוד. אפשר לעצור בכפתור ההקראה.'); next()
  }
  function startVoice() {
    if (listening) { recognition.current?.abort(); return }
    const browser = window as VoiceWindow
    const SpeechRecognition = browser.SpeechRecognition || browser.webkitSpeechRecognition
    if (!SpeechRecognition) { setMessage('פקודות קוליות אינן זמינות בדפדפן זה. אפשר להשתמש בניווט המקלדת.'); return }
    const voice = new SpeechRecognition(); recognition.current = voice; voice.lang = 'he-IL'
    voice.onresult = event => {
      const text = event.results[0][0].transcript
      if (/למטה/.test(text)) { close(); window.scrollBy({ top: window.innerHeight * 0.7, behavior: 'instant' }) }
      else if (/למעלה/.test(text)) { close(); window.scrollBy({ top: -window.innerHeight * 0.7, behavior: 'instant' }) }
      else if (/סגור/.test(text)) close()
      else if (/עצור/.test(text)) stopSpeech()
      else setMessage(`זוהה: ${text}. הפקודות הזמינות: למעלה, למטה, סגור, עצור.`)
    }
    voice.onerror = () => { setListening(false); setMessage('לא ניתן להפעיל את המיקרופון. בדקו הרשאה בדפדפן או השתמשו בניווט מקלדת.') }
    voice.onend = () => setListening(false)
    try { voice.start(); setListening(true); setMessage('מאזינים לפקודה אחת: למעלה, למטה, סגור או עצור. זיהוי הדיבור עשוי להשתמש בשירות של הדפדפן.') }
    catch { setMessage('לא ניתן להתחיל זיהוי דיבור כרגע.') }
  }
  function hideWidget() {
    hideForDuration(hideDuration)
    close(); setHidden(true)
    requestAnimationFrame(() => document.getElementById('accessibility-settings-link')?.focus())
  }
  function typeKey(key: string) {
    const input = activeInput.current
    if (!input?.isConnected) { setInputLabel('בחרו תחילה שדה טקסט באתר'); return }
    const start = input.selectionStart ?? input.value.length
    const end = input.selectionEnd ?? start
    const from = key === '⌫' && start === end ? Math.max(0, start - 1) : start
    const inserted = key === '⌫' ? '' : key === 'רווח' ? ' ' : key
    const next = input.value.slice(0, from) + inserted + input.value.slice(end)
    if (input.maxLength >= 0 && next.length > input.maxLength) return
    const prototype = input instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype
    Object.getOwnPropertyDescriptor(prototype, 'value')?.set?.call(input, next)
    input.dispatchEvent(new Event('input', { bubbles: true }))
    input.focus({ preventScroll: true })
    try { input.setSelectionRange(from + inserted.length, from + inserted.length) } catch { /* Email inputs do not expose a selection API. */ }
  }
  const toggles: { key: ToggleKey; label: string; icon: string }[] = [
    { key: 'reduceMotion', label: 'חסימת הבהובים', icon: 'stop' },
    { key: 'captions', label: 'הצגת כתוביות', icon: 'page' },
    { key: 'readable', label: 'גופן קריא', icon: 'type' },
    { key: 'links', label: 'הדגשת קישורים', icon: 'link' },
    { key: 'highlightHeadings', label: 'הדגשת כותרות', icon: 'pen' },
    { key: 'controls', label: 'הדגשת אלמנטים', icon: 'pen' },
    { key: 'largeTargets', label: 'הגדלת כפתורים', icon: 'expand' },
    { key: 'mute', label: 'השתקת מדיה', icon: 'volume' },
    { key: 'readingFocus', label: 'מיקוד קריאה', icon: 'focus' },
    { key: 'readingGuide', label: 'מדריך קריאה', icon: 'guide' },
  ]
  const toolTitles: Record<NonNullable<Tool>, string> = { regions: 'ניווט אזורים', structure: 'מבנה העמוד', reader: 'תצוגת קריאה', summary: 'סיכום עמוד', magnify: 'הגדלת תכנים', images: 'תיאור לתמונות', dictionary: 'מילון', hide: 'הסתרת כפתור הנגישות' }
  const tileProps = (index: number) => ({ label: toggles[index].label, icon: toggles[index].icon })
  return createPortal(<div className="aw-root" dir="rtl">
    {settings.screenReader ? <nav className="aw-screen-reader-nav" aria-label="קיצורי ניווט לקורא מסך"><button onClick={() => { show(); openTool('regions') }}>מעבר לאזור בעמוד</button><button onClick={() => { show(); openTool('structure') }}>מעבר לכותרת בעמוד</button></nav> : null}
    {!hidden ? <button ref={trigger} className="aw-launcher" aria-label="פתיחת תפריט נגישות" aria-haspopup="dialog" aria-expanded={open} aria-controls="accessibility-panel" onClick={show}><Icon name="accessibility" /><span>נגישות</span></button> : null}
    {settings.readingGuide && !open ? <div ref={guide} className="aw-reading-guide" aria-hidden="true" /> : null}
    {settings.readingFocus && !open ? <div ref={focusMask} className="aw-reading-mask" aria-hidden="true" /> : null}
    {speaking && !open ? <button className="aw-stop-speech" onClick={stopSpeech}>עצירת הקראה ■</button> : null}
    <dialog ref={dialog} id="accessibility-panel" className={`aw-panel ${wide ? 'aw-panel--wide' : ''}`} aria-labelledby="aw-title" onKeyDown={keepFocusInside} onCancel={event => { event.preventDefault(); close() }} onClose={() => { setOpen(false); setTool(null) }}>
      <header className="aw-header"><div className="aw-toolbar">
        <button type="button" aria-label={wide ? 'צמצום תפריט הנגישות' : 'הרחבת תפריט הנגישות'} title="שינוי רוחב התפריט" onClick={() => setWide(!wide)}>↔</button>
        <button type="button" aria-label="הסתרת כפתור הנגישות" title="הסתרת הכפתור" onClick={() => openTool('hide')}><Icon name="eye" /></button>
        <span className="aw-language">עברית</span>
        <button type="button" aria-label="סגירת תפריט הנגישות" onClick={close}>×</button>
      </div><h2 id="aw-title">נגישות</h2></header>
      <div className="aw-scroll">
        <p className="aw-status" role="status">{message}</p>
        {tool ? <section className="aw-tool"><button className="aw-back" onClick={() => setTool(null)}>→ חזרה לכל ההתאמות</button><h3 ref={toolHeading} tabIndex={-1}>{toolTitles[tool]}</h3>
          {['regions', 'structure', 'summary', 'images'].includes(tool) ? <>
            {tool === 'summary' ? <p>סקירת כותרות העמוד, לפי סדר הופעתן:</p> : null}
            {tool === 'images' ? <p>התיאורים שסופקו לתמונות באתר. תמונות דקורטיביות אינן נכללות.</p> : null}
            <ul>{entries.map((entry, index) => <li key={index}><button onClick={() => jump(entry.element)}>{entry.label}</button></li>)}</ul>
            {!entries.length ? <p>לא נמצאו פריטים זמינים בעמוד זה.</p> : null}
          </> : null}
          {tool === 'reader' || tool === 'magnify' ? <><p>הטקסט שנבחר באתר, או תוכן העמוד כאשר לא נבחר טקסט.</p><div className={`aw-reader ${tool === 'magnify' ? 'aw-reader--large' : ''}`}>{readingText || 'אין טקסט זמין.'}</div></> : null}
          {tool === 'dictionary' ? <><label htmlFor="aw-word">מילה לחיפוש במילון</label><input id="aw-word" value={dictionaryWord} onChange={event => setDictionaryWord(event.target.value)} maxLength={100} /><p>אפשר לבחור מילה באתר לפני פתיחת התפריט. החיפוש נפתח בוויקימילון.</p>{dictionaryWord.trim() ? <a className="aw-primary" href={`https://he.wiktionary.org/wiki/${encodeURIComponent(dictionaryWord.trim())}`} target="_blank" rel="noopener noreferrer">חיפוש בוויקימילון (בלשונית חדשה)</a> : null}</> : null}
          {tool === 'hide' ? <><fieldset><legend>בחרו לכמה זמן להסתיר את הכפתור</legend>{[['session', 'להפעלה הנוכחית בכרטיסייה זו'], ['1', 'ל־24 שעות'], ['7', 'לשבוע'], ['30', 'לחודש']].map(([value, label]) => <label key={value}><input type="radio" name="aw-hide" value={value} checked={hideDuration === value} onChange={() => setHideDuration(value)} />{label}</label>)}</fieldset><p>אפשר להחזיר את התפריט בכל עת דרך ״הגדרות נגישות״ בתחתית האתר או באמצעות Alt+0.</p><button className="aw-primary" onClick={hideWidget}>אישור והסתרת הכפתור</button></> : null}
        </section> : <>
          <Section title="פרופילי נגישות" expanded={false}>{profiles.map(item => <div className="aw-profile" key={item.id}><details><summary>{item.label}</summary><p>{item.description}</p></details><button type="button" role="switch" aria-label={item.label} aria-checked={profile === item.id} onClick={() => activateProfile(item.id)}><span>{profile === item.id ? 'פעיל' : 'כבוי'}</span><i /></button></div>)}</Section>
          <Section title="התאמות ניווט"><div className="aw-grid">
            <Tile label="התאמה לקורא מסך" icon="ear" active={settings.screenReader} onClick={() => { toggle('screenReader'); setMessage('האתר תומך בקורא המסך של המכשיר. השתמשו בניווט אזורים ובמבנה העמוד למעבר ישיר לתוכן.'); openTool('regions') }} />
            <Tile label="ניווט מקלדת" icon="keyboard" active={settings.keyboard} onClick={() => { toggle('keyboard'); setMessage('Tab למעבר קדימה, Shift+Tab לחזרה, Enter להפעלה ו־Esc לסגירה. המיקוד המוגבר פועל גם מחוץ לתפריט.') }} />
            <Tile label="ניווט אזורים" icon="grid" onClick={() => openTool('regions')} />
            <Tile label="ניווט חכם" icon="guide" onClick={() => openTool('structure')} />
            <Tile label={speaking ? 'עצירת הקראה' : 'הקראת טקסט'} icon="volume" active={speaking} onClick={speak} />
            <Tile label={listening ? 'עצירת האזנה' : 'פקודות קוליות'} icon="mic" active={listening} onClick={startVoice} />
          </div></Section>
          <Section title="התאמות ניגודיות"><div className="aw-grid">
            <Tile label="מונוכרום" icon="eye" active={settings.saturation === 'mono'} onClick={() => change('saturation', settings.saturation === 'mono' ? 'normal' : 'mono')} />
            <Tile label="ניגודיות כהה" icon="moon" active={settings.contrast === 'dark'} onClick={() => change('contrast', settings.contrast === 'dark' ? 'none' : 'dark')} />
            <Tile label="ניגודיות בהירה" icon="sun" active={settings.contrast === 'light'} onClick={() => change('contrast', settings.contrast === 'light' ? 'none' : 'light')} />
            <Tile label="רוויה נמוכה" icon="drop" active={settings.saturation === 'low'} onClick={() => change('saturation', settings.saturation === 'low' ? 'normal' : 'low')} />
            <Tile label="רוויה גבוהה" icon="drop" active={settings.saturation === 'high'} onClick={() => change('saturation', settings.saturation === 'high' ? 'normal' : 'high')} />
            <Tile label="ניגודיות גבוהה" icon="contrast" active={settings.contrast === 'high'} onClick={() => change('contrast', settings.contrast === 'high' ? 'none' : 'high')} />
          </div><div className="aw-card"><h4>התאמת צבעים</h4><p>שינוי צבעי האתר</p><div className="aw-pills">{([['background', 'רקעים'], ['headings', 'כותרות'], ['text', 'תכנים']] as const).map(([key, label]) => <button key={key} aria-pressed={colorTarget === key} onClick={() => setColorTarget(key)}>{label}</button>)}</div><label className="aw-color-label">בחירת צבע<input type="color" aria-label={`צבע ${colorTarget === 'background' ? 'רקעים' : colorTarget === 'headings' ? 'כותרות' : 'תכנים'}`} value={settings[colorTarget] || '#ffffff'} onChange={event => change(colorTarget, event.target.value)} /></label><button className="aw-reset" onClick={() => { setSettings(current => ({ ...current, background: '', headings: '', text: '' })); setProfile(null) }}>↺ איפוס צבעים</button></div></Section>
          <Section title="התאמות תוכן"><div className="aw-card"><h4>התאמות גופן</h4><p>הגדלת הגופן ושינוי הריווח</p><div className="aw-pills">{([['fontSize', 'גודל גופן'], ['lineSpacing', 'ריווח שורות'], ['wordSpacing', 'ריווח מילים'], ['letterSpacing', 'ריווח אותיות']] as const).map(([key, label]) => <button key={key} aria-pressed={rangeTarget === key} onClick={() => setRangeTarget(key)}>{label}</button>)}</div><div className="aw-range"><button aria-label="הקטנה" disabled={settings[rangeTarget] === 0} onClick={() => change(rangeTarget, settings[rangeTarget] - 1)}>−</button><input type="range" min="0" max="5" value={settings[rangeTarget]} aria-label={{ fontSize: 'גודל גופן', lineSpacing: 'ריווח שורות', wordSpacing: 'ריווח מילים', letterSpacing: 'ריווח אותיות', zoom: 'הגדלת תצוגה' }[rangeTarget]} aria-valuetext={rangeTarget === 'fontSize' ? `${100 + settings.fontSize * 10}%` : `רמה ${settings[rangeTarget]} מתוך 5`} onChange={event => change(rangeTarget, Number(event.target.value))} /><button aria-label="הגדלה" disabled={settings[rangeTarget] === 5} onClick={() => change(rangeTarget, settings[rangeTarget] + 1)}>+</button></div><button className="aw-reset" onClick={() => { setSettings(current => ({ ...current, fontSize: 0, lineSpacing: 0, wordSpacing: 0, letterSpacing: 0 })); setProfile(null) }}>↺ איפוס גופן</button></div>
            <div className="aw-card"><h4>סמן העכבר</h4><p>הגדלת הסמן ושינוי צבעו</p><div className="aw-pills">{[['white', 'לבן'], ['black', 'שחור']].map(([value, label]) => <button key={value} aria-pressed={settings.cursor === value} onClick={() => change('cursor', settings.cursor === value ? 'none' : value)}>{label}</button>)}</div></div>
            <div className="aw-grid">
              {toggles.slice(0, 2).map(item => <Tile key={item.key} label={item.label} icon={item.icon} active={settings[item.key]} onClick={() => { toggle(item.key); if (item.key === 'captions') setMessage('מציג כתוביות כאשר קיים קובץ כתוביות במדיה. אין יצירה אוטומטית של כתוביות.'); if (item.key === 'reduceMotion') setMessage('אנימציות נעצרות ומדיה מושהית באתר. תוכן חיצוני ותמונות GIF עשויים לדרוש טיפול נפרד.') }} />)}
              <Tile label={`הגדלת תצוגה ${100 + settings.zoom * 10}%`} icon="zoom" active={settings.zoom > 0} onClick={() => change('zoom', (settings.zoom + 1) % 6)} />
              <Tile {...tileProps(2)} active={settings.readable} onClick={() => toggle('readable')} />
              <Tile label="תיאור לתמונות" icon="image" onClick={() => openTool('images')} />
              {toggles.slice(3, 7).map(item => <Tile key={item.key} label={item.label} icon={item.icon} active={settings[item.key]} onClick={() => toggle(item.key)} />)}
              <Tile label="תצוגת קריאה" icon="page" onClick={() => openTool('reader')} />
              <Tile label="הגדלת תכנים" icon="zoom" onClick={() => openTool('magnify')} />
              <Tile label="מבנה העמוד" icon="map" onClick={() => openTool('structure')} />
              <Tile {...tileProps(7)} active={settings.mute} onClick={() => toggle('mute')} />
              <Tile label="סיכום עמוד" icon="page" onClick={() => openTool('summary')} />
              <Tile {...tileProps(8)} active={settings.readingFocus} onClick={() => toggle('readingFocus')} />
              <Tile {...tileProps(9)} active={settings.readingGuide} onClick={() => toggle('readingGuide')} />
              <Tile label="מילון" icon="book" onClick={() => openTool('dictionary')} />
              <Tile label="מקלדת וירטואלית" icon="keyboard" active={virtualKeyboard} onClick={() => { setVirtualKeyboard(!virtualKeyboard); close() }} />
            </div>
          </Section>
        </>}
      </div>
      <footer className="aw-footer"><div><button onClick={reset}>ביטול התאמות</button><Link to="/accessibility" onClick={close}>הצהרת נגישות</Link><Link to="/contact?topic=accessibility" onClick={close}>שליחת משוב</Link></div><p>Savor · נגישות בהתאמה אישית</p></footer>
    </dialog>
    {virtualKeyboard && !open ? <section className="aw-virtual" aria-label="מקלדת וירטואלית"><div className="aw-virtual-header"><span role="status">{inputLabel}</span><button onClick={() => setKeyboardEnglish(!keyboardEnglish)}>{keyboardEnglish ? 'עברית' : 'English'}</button><button aria-label="סגירת המקלדת הווירטואלית" onClick={() => setVirtualKeyboard(false)}>×</button></div><div className="aw-keys" dir={keyboardEnglish ? 'ltr' : 'rtl'}>{(keyboardEnglish ? '1234567890qwertyuiopasdfghjklzxcvbnm@.-' : '1234567890קראטוןםפשדגכעיחלךףזסבהנמצתץ@.-').split('').map(key => <button key={key} onPointerDown={event => event.preventDefault()} onClick={() => typeKey(key)}>{key}</button>)}<button onPointerDown={event => event.preventDefault()} onClick={() => typeKey('רווח')}>רווח</button><button aria-label="מחיקת תו" onPointerDown={event => event.preventDefault()} onClick={() => typeKey('⌫')}>⌫</button></div></section> : null}
  </div>, document.body)
}
