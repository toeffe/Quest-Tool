import { type ReactNode } from 'react';

interface FieldProps {
  label: string;
  hint?: string;
  children: ReactNode;
}

export function Field({ label, hint, children }: FieldProps) {
  return (
    <div className="field">
      <label>{label}</label>
      {children}
      {hint && <div className="hint">{hint}</div>}
    </div>
  );
}

interface TextInputProps {
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function TextInput({ label, hint, value, onChange, placeholder }: TextInputProps) {
  return (
    <Field label={label} hint={hint}>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </Field>
  );
}

interface TextAreaProps {
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function TextArea({ label, hint, value, onChange, placeholder }: TextAreaProps) {
  return (
    <Field label={label} hint={hint}>
      <textarea
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </Field>
  );
}

interface NumberInputProps {
  label: string;
  hint?: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
}

export function NumberInput({ label, hint, value, onChange, min }: NumberInputProps) {
  return (
    <Field label={label} hint={hint}>
      <input
        type="number"
        value={Number.isFinite(value) ? value : 0}
        min={min}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </Field>
  );
}

interface DataListInputProps {
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label?: string }[];
  listId: string;
  placeholder?: string;
}

/** A text input with autocomplete suggestions; still accepts free-text values. */
export function DataListInput({
  label,
  hint,
  value,
  onChange,
  options,
  listId,
  placeholder,
}: DataListInputProps) {
  return (
    <Field label={label} hint={hint}>
      <input
        value={value}
        list={listId}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
      <datalist id={listId}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </datalist>
    </Field>
  );
}

interface SelectProps<T extends string> {
  label: string;
  hint?: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}

export function Select<T extends string>({
  label,
  hint,
  value,
  options,
  onChange,
}: SelectProps<T>) {
  return (
    <Field label={label} hint={hint}>
      <select value={value} onChange={(e) => onChange(e.target.value as T)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

interface PillSelectProps<T extends string> {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}

export function PillSelect<T extends string>({ value, options, onChange }: PillSelectProps<T>) {
  return (
    <div className="pill-select">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          className={`pill ${value === o.value ? 'active' : ''}`}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
