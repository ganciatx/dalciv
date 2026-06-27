import { ShieldMark } from "./ShieldMark";

export function IdleAttractScreen() {
  return (
    <div className="idle-attract" role="presentation">
      <div className="idle-attract__inner">
        <p className="idle-attract__brand">H&amp;R Block · Tax Identity Shield</p>
        <h1 className="idle-attract__headline">
          Was your email exposed in a data breach?
        </h1>
        <p className="idle-attract__hint">Move or click to start · fullscreen demo</p>
        <ShieldMark className="idle-attract__shield" />
      </div>
    </div>
  );
}
