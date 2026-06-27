import { useCallback, useState } from "react";
import { checkEmailBreaches } from "./api";
import { AttractHero } from "./components/AttractHero";
import { BreachResults } from "./components/BreachResults";
import { EmailForm } from "./components/EmailForm";
import { IdleAttractScreen } from "./components/IdleAttractScreen";
import { ShieldMark } from "./components/ShieldMark";
import { useDemoMode } from "./hooks/useDemoMode";
import { useKioskFullscreen } from "./hooks/useKioskFullscreen";
import type { BreachCheckResult, CheckStatus } from "./types";

export default function App() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<CheckStatus>("idle");
  const [result, setResult] = useState<BreachCheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const resetDemo = useCallback(() => {
    setEmail("");
    setResult(null);
    setError(null);
    setStatus("idle");
    document.title = "Tax Identity Shield · H&R Block";
  }, []);

  const { ensureFullscreen } = useKioskFullscreen();

  const { isAttract, registerActivity } = useDemoMode({
    onReturnToAttract: resetDemo,
    onPointerActivity: ensureFullscreen,
  });

  const runCheck = useCallback(async () => {
    const trimmed = email.trim();
    if (!trimmed) return;

    registerActivity();
    setStatus("loading");
    setError(null);
    setResult(null);

    try {
      const payload = await checkEmailBreaches(trimmed);
      setResult(payload);
      setStatus("success");
      document.title = payload.found
        ? "Exposure found · Tax Identity Shield"
        : "Clear scan · Tax Identity Shield";
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      setError(message);
      setStatus("error");
      document.title = "Tax Identity Shield · H&R Block";
    }
  }, [email, registerActivity]);

  const showHero = status !== "success";

  if (isAttract) {
    return <IdleAttractScreen />;
  }

  return (
    <div className="app app--interactive">
      <header className="booth-header">
        <ShieldMark className="booth-header__mark" />
        <div className="booth-header__text">
          <p className="booth-header__company">H&amp;R Block</p>
          <h1>Tax Identity Shield</h1>
        </div>
      </header>

      <main className="main">
        {showHero ? <AttractHero /> : null}

        {!result ? (
          <section className="panel panel--form">
            <EmailForm
              email={email}
              loading={status === "loading"}
              onEmailChange={(value) => {
                registerActivity();
                setEmail(value);
              }}
              onSubmit={() => void runCheck()}
            />
          </section>
        ) : null}

        {status === "loading" ? (
          <section className="scanning-panel" aria-live="polite">
            <div className="scanning-panel__ring" aria-hidden="true" />
            <p className="scanning-panel__title">Scanning…</p>
          </section>
        ) : null}

        {status === "error" && error ? (
          <section className="error-banner" role="alert">
            {error}
          </section>
        ) : null}

        {result ? (
          <BreachResults
            result={result}
            onReset={() => {
              registerActivity();
              resetDemo();
            }}
          />
        ) : null}
      </main>

      <footer className="footer">
        Demo only. Not financial or legal advice. Email is not stored. Esc = attract screen.
        Shift+Esc = exit fullscreen.
      </footer>
    </div>
  );
}
