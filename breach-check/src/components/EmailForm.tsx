import type { FormEvent } from "react";

interface EmailFormProps {
  email: string;
  loading: boolean;
  onEmailChange: (value: string) => void;
  onSubmit: () => void;
}

export function EmailForm({ email, loading, onEmailChange, onSubmit }: EmailFormProps) {
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <form className="email-form" onSubmit={handleSubmit}>
      <label className="email-label" htmlFor="breach-email">
        Your email
      </label>
      <input
        id="breach-email"
        className="email-input"
        type="email"
        name="email"
        autoComplete="email"
        inputMode="email"
        placeholder="you@email.com"
        value={email}
        disabled={loading}
        onChange={(event) => onEmailChange(event.target.value)}
        required
      />
      <button className="submit-btn" type="submit" disabled={loading || !email.trim()}>
        {loading ? (
          <>
            <span className="spinner" aria-hidden="true" />
            Scanning…
          </>
        ) : (
          "Run exposure scan"
        )}
      </button>
    </form>
  );
}
