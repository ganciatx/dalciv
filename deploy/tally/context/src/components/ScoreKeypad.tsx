type KeypadProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  quickValues?: number[];
  /** `add` = Phase 10 chips (+5 adds to total); `set` = Yahtzee upper-section replaces value. */
  quickMode?: 'add' | 'set';
  /** Set-mode only: called on chip tap (e.g. validate + auto-save). Falls back to onChange. */
  onQuickPick?: (value: number) => void;
  showSignToggle?: boolean;
  /** Hide digit grid when quick picks cover all legal values (Yahtzee upper section). */
  hideDigitPad?: boolean;
};

/** Numeric keypad with optional quick chips (Phase 10: +5/+10; Yahtzee upper: tap-to-set). */
export function ScoreKeypad({
  value,
  onChange,
  onSubmit,
  quickValues = [5, 10, 15, 25],
  quickMode = 'add',
  onQuickPick,
  showSignToggle = false,
  hideDigitPad = false,
}: KeypadProps) {
  const appendDigit = (digit: string) => {
    if (value === '0' && digit !== '.') {
      onChange(digit);
      return;
    }
    onChange(value + digit);
  };

  const handleQuick = (n: number) => {
    if (quickMode === 'set') {
      if (onQuickPick) {
        onQuickPick(n);
      } else {
        onChange(String(n));
      }
      return;
    }
    const current = parseInt(value, 10) || 0;
    onChange(String(Math.max(0, current + n)));
  };

  const backspace = () => {
    onChange(value.slice(0, -1) || '');
  };

  const toggleSign = () => {
    if (!value || value === '0') return;
    if (value.startsWith('-')) {
      onChange(value.slice(1));
    } else {
      onChange('-' + value);
    }
  };

  const selectedQuick = quickMode === 'set' ? parseInt(value, 10) : NaN;

  return (
    <div className="keypad">
      <div className="keypad-display">{value || '—'}</div>
      {quickValues.length > 0 && (
        <div className={`keypad-quick ${quickMode === 'set' ? 'keypad-quick-set' : ''}`}>
          {quickValues.map((n) => (
            <button
              key={n}
              type="button"
              className={`keypad-quick-btn ${quickMode === 'set' && selectedQuick === n ? 'selected' : ''}`}
              onClick={() => handleQuick(n)}
            >
              {quickMode === 'set' ? n : `+${n}`}
            </button>
          ))}
          {showSignToggle && (
            <button type="button" className="keypad-quick-btn" onClick={toggleSign}>
              +/−
            </button>
          )}
        </div>
      )}
      {!hideDigitPad && (
        <div className="keypad-grid">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
            <button key={d} type="button" className="keypad-key" onClick={() => appendDigit(d)}>
              {d}
            </button>
          ))}
          <button type="button" className="keypad-key" onClick={backspace}>
            ⌫
          </button>
          <button type="button" className="keypad-key" onClick={() => appendDigit('0')}>
            0
          </button>
          <button type="button" className="keypad-key keypad-enter" onClick={onSubmit}>
            ↵
          </button>
        </div>
      )}
    </div>
  );
}
