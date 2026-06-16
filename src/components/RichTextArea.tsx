import { useRef } from 'react';

interface RichTextAreaProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onClear?: () => void;
  minRows?: number;
}

const TOOLBAR_ACTIONS = ['B', 'I', 'U', '•', '1.', '≡', '🔗', '🖼'] as const;

export function RichTextArea({
  id,
  value,
  onChange,
  placeholder = 'Type here',
  onClear,
  minRows = 5,
}: RichTextAreaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const applyFormat = (wrapper: string) => {
    const el = textareaRef.current;
    if (!el) return;

    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = value.slice(start, end);
    const next = `${value.slice(0, start)}${wrapper}${selected}${wrapper}${value.slice(end)}`;
    onChange(next);
  };

  return (
    <div className="rich-text-area">
      <div className="rich-text-toolbar" role="toolbar" aria-label="Formatting">
        {TOOLBAR_ACTIONS.map((action) => (
          <button
            key={action}
            type="button"
            className="rich-text-tool"
            aria-label={action}
            onClick={() => {
              if (action === 'B') applyFormat('**');
              else if (action === 'I') applyFormat('_');
              else if (action === 'U') applyFormat('__');
            }}
          >
            {action}
          </button>
        ))}
      </div>
      <div className="rich-text-input-wrap">
        <textarea
          ref={textareaRef}
          id={id}
          className="rich-text-input"
          rows={minRows}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        {onClear && (
          <button
            type="button"
            className="rich-text-clear"
            aria-label="Clear"
            onClick={onClear}
          >
            🗑
          </button>
        )}
      </div>
    </div>
  );
}
