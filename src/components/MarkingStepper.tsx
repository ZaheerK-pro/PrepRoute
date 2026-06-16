interface MarkingStepperProps {
  label: string;
  value: number;
  step?: number;
  onChange: (value: number) => void;
}

function formatMarkValue(value: number): string {
  if (value > 0) return `+${value}`;
  return String(value);
}

export function MarkingStepper({ label, value, step = 1, onChange }: MarkingStepperProps) {
  const adjust = (delta: number) => {
    const next = Number((value + delta).toFixed(2));
    onChange(next);
  };

  return (
    <div className="marking-stepper-field">
      <span className="marking-stepper-label">{label}</span>
      <div className="marking-stepper">
        <span className="marking-stepper-value">{formatMarkValue(value)}</span>
        <div className="marking-stepper-buttons">
          <button
            type="button"
            className="stepper-btn"
            aria-label={`Increase ${label}`}
            onClick={() => adjust(step)}
          >
            ▲
          </button>
          <button
            type="button"
            className="stepper-btn"
            aria-label={`Decrease ${label}`}
            onClick={() => adjust(-step)}
          >
            ▼
          </button>
        </div>
      </div>
    </div>
  );
}
