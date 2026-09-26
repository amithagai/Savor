import { useEffect } from 'react'
import { defaults, STORAGE_KEY, type Preferences } from './preferences'

const textSelector = 'h1,h2,h3,h4,h5,h6,p,a,button,label,input,textarea,select,li,dt,dd,legend,summary,span,strong,small,td,th'

export function useAccessibilityEffects(settings: Preferences, pathname: string) {
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)) } catch { /* Storage may be disabled. */ }
    const content = document.getElementById('site-content')
    if (!content) return
    for (const [key, value] of Object.entries(settings)) {
      if (typeof value === 'boolean') content.classList.toggle(`a11y-${key}`, value)
    }
    content.dataset.contrast = settings.contrast
    content.dataset.saturation = settings.saturation
    content.dataset.cursor = settings.cursor
    for (const key of ['background', 'headings', 'text'] as const) {
      content.classList.toggle(`a11y-custom-${key}`, Boolean(settings[key]))
      content.style.setProperty(`--a11y-${key}`, settings[key])
    }
    content.style.setProperty('--a11y-word-spacing', `${settings.wordSpacing * 0.12}em`)
    content.style.setProperty('--a11y-letter-spacing', `${settings.letterSpacing * 0.025}em`)
    content.classList.toggle('a11y-word-spacing', settings.wordSpacing > 0)
    content.classList.toggle('a11y-letter-spacing', settings.letterSpacing > 0)
    content.style.zoom = settings.zoom ? String(1 + settings.zoom * 0.1) : ''

    const restore: (() => void)[] = []
    const sizing: { restore: () => void; apply: () => void }[] = []
    const processed = new WeakSet<Element>()
    function apply() {
      if (!content) return
      const elements = settings.fontSize || settings.lineSpacing
        ? Array.from(content.querySelectorAll<HTMLElement>(textSelector)).filter(el => !processed.has(el))
        : []
      // Measure new content at its original size, including children inserted into
      // an already enlarged parent. Restore adjustments before the next paint.
      if (elements.length) sizing.forEach(item => item.restore())
      const sizes = elements.map(el => ({ el, size: parseFloat(getComputedStyle(el).fontSize), line: parseFloat(getComputedStyle(el).lineHeight) }))
      if (elements.length) sizing.forEach(item => item.apply())
      for (const { el, size, line } of sizes) {
        processed.add(el)
        if (!settings.fontSize && !settings.lineSpacing) continue
        const previousSize = el.style.getPropertyValue('font-size')
        const previousLine = el.style.getPropertyValue('line-height')
        const sizePriority = el.style.getPropertyPriority('font-size')
        const linePriority = el.style.getPropertyPriority('line-height')
        const applySize = () => {
          if (settings.fontSize) el.style.setProperty('font-size', `${size * (1 + settings.fontSize * 0.1)}px`, 'important')
          if (settings.lineSpacing) el.style.setProperty('line-height', String(Math.max(1.5, Number.isFinite(line) ? line / size : 1.5) + settings.lineSpacing * 0.15), 'important')
        }
        const restoreSize = () => {
          if (settings.fontSize) { if (previousSize) el.style.setProperty('font-size', previousSize, sizePriority); else el.style.removeProperty('font-size') }
          if (settings.lineSpacing) { if (previousLine) el.style.setProperty('line-height', previousLine, linePriority); else el.style.removeProperty('line-height') }
        }
        applySize()
        sizing.push({ apply: applySize, restore: restoreSize })
        restore.push(restoreSize)
      }
      content.querySelectorAll<HTMLMediaElement>('video,audio').forEach(media => {
        if (processed.has(media)) return
        processed.add(media)
        if (settings.mute) { const muted = media.muted; media.muted = true; restore.push(() => { media.muted = muted }) }
        if (settings.reduceMotion) media.pause()
        if (settings.captions) {
          for (const track of Array.from(media.textTracks)) {
            if (track.kind === 'captions' || track.kind === 'subtitles') {
              const mode = track.mode; track.mode = 'showing'; restore.push(() => { track.mode = mode })
              break
            }
          }
        }
      })
    }
    apply()
    const observer = new MutationObserver(apply)
    observer.observe(content, { childList: true, subtree: true })
    const stopPlayback = (event: Event) => { if (settings.reduceMotion && event.target instanceof HTMLMediaElement) event.target.pause() }
    content.addEventListener('play', stopPlayback, true)
    return () => {
      observer.disconnect()
      content.removeEventListener('play', stopPlayback, true)
      restore.reverse().forEach(fn => fn())
      for (const key of Object.keys(defaults)) content.classList.remove(`a11y-${key}`)
      for (const key of ['background', 'headings', 'text']) { content.classList.remove(`a11y-custom-${key}`); content.style.removeProperty(`--a11y-${key}`) }
      content.classList.remove('a11y-word-spacing', 'a11y-letter-spacing')
      delete content.dataset.contrast; delete content.dataset.saturation; delete content.dataset.cursor
      content.style.zoom = ''
    }
  }, [settings, pathname])
}
