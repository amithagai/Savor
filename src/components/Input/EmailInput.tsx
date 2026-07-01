import type React from "react";
import type { FC } from "react";

interface Props {
    email: string;
    handleChange: (e: React.ChangeEvent<HTMLInputElement, HTMLInputElement>) => void
}

export const EmnailInput: FC<Props> = ({ email, handleChange }) => {

    return (
        <div className="newsletter__input-row">
            <input
                type="email"
                placeholder="כתובת אימייל"
                value={email}
                onChange={handleChange}
                required
            />
            <button type="submit">הרשמה</button>
        </div>
    )
}