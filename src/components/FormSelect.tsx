import type { SelectHTMLAttributes } from 'react';

interface FormSelectOption {
  value: string;
  label: string;
}

interface FormSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options: FormSelectOption[];
  placeholder?: string;
  isPlaceholder?: boolean;
}

export function FormSelect({
  options,
  placeholder = 'Choose from Drop-down',
  isPlaceholder,
  className = '',
  ...props
}: FormSelectProps) {
  const showPlaceholder = isPlaceholder ?? !props.value;

  return (
    <div className="select-wrap">
      <select
        {...props}
        className={`select-field ${showPlaceholder ? 'is-placeholder' : ''} ${className}`.trim()}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <span className="select-chevron" aria-hidden="true">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path
            d="M2.5 4.5L6 8L9.5 4.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </div>
  );
}
