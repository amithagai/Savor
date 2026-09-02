import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'

import './AdminLogin.css'
import savorLogo from '../../assets/savor-logo.png'
import { ApiError } from '../../lib/api'
import { useAdminAuth } from '../../context/useAdminAuth'

type LoginStep = 'credentials' | 'challenge' | 'setup' | 'recovery'

const QR_OPTIONS = { width: 240, margin: 1, errorCorrectionLevel: 'M' as const }

export default function AdminLogin() {
  const { login, startMfaSetup, confirmMfaSetup, verifyMfa, isAuthenticated } = useAdminAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const passwordChanged = searchParams.get('password_changed') === '1'

  const [step, setStep] = useState<LoginStep>('credentials')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mfaCode, setMfaCode] = useState('')
  const [challengeToken, setChallengeToken] = useState('')
  const [setupToken, setSetupToken] = useState('')
  const [setupSecret, setSetupSecret] = useState('')
  const [otpauthUri, setOtpauthUri] = useState('')
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!otpauthUri) {
      return
    }
    let cancelled = false
    import('qrcode')
      .then(({ default: QRCode }) => QRCode.toDataURL(otpauthUri, QR_OPTIONS))
      .then((value) => {
        if (!cancelled) setQrDataUrl(value)
      })
      .catch(() => {
        if (!cancelled) setError('לא הצלחנו ליצור את קוד ה-QR. אפשר להשתמש במפתח הידני.')
      })
    return () => {
      cancelled = true
    }
  }, [otpauthUri])

  if (isAuthenticated && step !== 'recovery') {
    return <Navigate to="/admin/orders" replace />
  }

  const resetFlow = () => {
    setStep('credentials')
    setPassword('')
    setMfaCode('')
    setChallengeToken('')
    setSetupToken('')
    setSetupSecret('')
    setOtpauthUri('')
    setQrDataUrl('')
    setRecoveryCodes([])
    setError('')
  }

  const errorMessage = (err: unknown) => {
    if (err instanceof ApiError && err.status === 401) {
      return step === 'credentials' ? 'אימייל או סיסמה שגויים' : 'קוד האימות שגוי או שפג תוקפו'
    }
    if (err instanceof ApiError && err.status === 429) {
      return 'בוצעו יותר מדי ניסיונות. המתינו מספר דקות ונסו שוב'
    }
    return 'אירעה שגיאה, נסו שוב'
  }

  const handleCredentials = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await login(email, password)
      setPassword('')
      if (result.status === 'authenticated') {
        navigate('/admin/orders')
      } else if (result.status === 'mfa_required') {
        setChallengeToken(result.challengeToken)
        setStep('challenge')
      } else {
        setSetupToken(result.setupToken)
        const setup = await startMfaSetup(result.setupToken)
        setSetupSecret(setup.secret)
        setOtpauthUri(setup.otpauthUri)
        setStep('setup')
      }
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const handleChallenge = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      await verifyMfa(challengeToken, mfaCode.trim())
      navigate('/admin/orders')
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const handleSetupConfirmation = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const codes = await confirmMfaSetup(setupToken, mfaCode.trim())
      setRecoveryCodes(codes)
      setMfaCode('')
      setSetupToken('')
      setSetupSecret('')
      setOtpauthUri('')
      setQrDataUrl('')
      setStep('recovery')
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="admin-login">
      <div className="admin-login__card">
        <div className="admin-login__logo"><img src={savorLogo} alt="Savor Kitchens" /></div>

        {step === 'credentials' && (
          <>
            <h1 className="admin-login__title">כניסת מנהלים</h1>
            <form onSubmit={handleCredentials}>
              <div className="admin-login__field">
                <input type="email" placeholder="אימייל" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="username" required />
              </div>
              <div className="admin-login__field">
                <input type="password" placeholder="סיסמה" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required />
              </div>
              {passwordChanged && !error ? <p className="admin-login__success">הסיסמה שונתה בהצלחה. אפשר להתחבר מחדש.</p> : null}
              {error ? <p className="admin-login__error" role="alert">{error}</p> : null}
              <button type="submit" className="admin-login__submit" disabled={loading}>{loading ? 'מתחבר…' : 'התחברות'}</button>
            </form>
          </>
        )}

        {step === 'challenge' && (
          <>
            <h1 className="admin-login__title">אימות דו-שלבי</h1>
            <p className="admin-login__intro">הזינו קוד בן 6 ספרות מאפליקציית Google Authenticator, או קוד שחזור.</p>
            <form onSubmit={handleChallenge}>
              <div className="admin-login__field">
                <input type="text" placeholder="קוד אימות או קוד שחזור" value={mfaCode} onChange={(event) => setMfaCode(event.target.value)} autoComplete="one-time-code" autoFocus required />
              </div>
              {error ? <p className="admin-login__error" role="alert">{error}</p> : null}
              <button type="submit" className="admin-login__submit" disabled={loading}>{loading ? 'מאמת…' : 'אימות וכניסה'}</button>
              <button type="button" className="admin-login__secondary" onClick={resetFlow} disabled={loading}>חזרה</button>
            </form>
          </>
        )}

        {step === 'setup' && (
          <>
            <h1 className="admin-login__title">הגדרת Google Authenticator</h1>
            <p className="admin-login__intro">סרקו את קוד ה-QR ולאחר מכן הזינו קוד בן 6 ספרות.</p>
            {qrDataUrl ? <img className="admin-login__qr" src={qrDataUrl} alt="QR להגדרת אימות דו-שלבי" /> : null}
            <p className="admin-login__manual-label">מפתח להגדרה ידנית</p>
            <code className="admin-login__secret" dir="ltr">{setupSecret}</code>
            <form onSubmit={handleSetupConfirmation}>
              <div className="admin-login__field admin-login__field--mfa">
                <input type="text" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} placeholder="קוד בן 6 ספרות" value={mfaCode} onChange={(event) => setMfaCode(event.target.value.replace(/\D/g, '').slice(0, 6))} autoComplete="one-time-code" required />
              </div>
              {error ? <p className="admin-login__error" role="alert">{error}</p> : null}
              <button type="submit" className="admin-login__submit" disabled={loading || mfaCode.length !== 6}>{loading ? 'מאמת…' : 'הפעלת אימות דו-שלבי'}</button>
              <button type="button" className="admin-login__secondary" onClick={resetFlow} disabled={loading}>ביטול</button>
            </form>
          </>
        )}

        {step === 'recovery' && (
          <>
            <h1 className="admin-login__title">האימות הדו-שלבי הופעל</h1>
            <p className="admin-login__intro admin-login__intro--warning">שמרו את הקודים במקום בטוח. כל קוד ניתן לשימוש פעם אחת בלבד, והם לא יוצגו שוב.</p>
            <div className="admin-login__recovery" dir="ltr">
              {recoveryCodes.map((code) => <code key={code}>{code}</code>)}
            </div>
            <button type="button" className="admin-login__submit" onClick={() => navigate('/admin/orders')}>שמרתי את הקודים - מעבר לניהול</button>
          </>
        )}
      </div>
    </div>
  )
}
