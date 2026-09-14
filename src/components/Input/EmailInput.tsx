import type { ChangeEventHandler } from 'react'
import './EmailInput.css'

type EmailInputProps = {
  id: string
  label: string
  email: string
  handleChange: ChangeEventHandler<HTMLInputElement>
  disabled?: boolean
}

export function EmailInput({ id, label, email, handleChange, disabled = false }: EmailInputProps) {
  return (
    <div className="newsletter__input-field">
      <label className="visually-hidden" htmlFor={id}>{label}</label>
      <div className="newsletter__input-row">
        <input
          id={id}
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="כתובת אימייל"
          value={email}
          onChange={handleChange}
          disabled={disabled}
          required
        />
        <button type="submit" disabled={disabled}>הרשמה</button>
      </div>
    </div>
  )
}
