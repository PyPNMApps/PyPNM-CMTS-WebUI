import { useId, useState } from "react";
import type { InputHTMLAttributes } from "react";

interface SecretTextInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  revealLabel?: string;
  hideLabel?: string;
}

function EyeIcon({ crossed }: { crossed: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      className="secret-input-icon"
    >
      <path
        d="M2 12c2.4-4 6-6 10-6s7.6 2 10 6c-2.4 4-6 6-10 6S4.4 16 2 12Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.7" />
      {crossed ? (
        <path
          d="M4 4 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      ) : null}
    </svg>
  );
}

export function SecretTextInput({
  revealLabel = "Show value",
  hideLabel = "Hide value",
  className,
  ...inputProps
}: SecretTextInputProps) {
  const [revealed, setRevealed] = useState(false);
  const buttonId = useId();

  return (
    <div className="secret-input">
      <input
        {...inputProps}
        className={className}
        type={revealed ? "text" : "password"}
        aria-describedby={inputProps["aria-describedby"]}
      />
      <button
        id={buttonId}
        type="button"
        className="secret-input-toggle"
        aria-label={revealed ? hideLabel : revealLabel}
        aria-pressed={revealed}
        onClick={() => setRevealed((current) => !current)}
      >
        <EyeIcon crossed={!revealed} />
      </button>
    </div>
  );
}
