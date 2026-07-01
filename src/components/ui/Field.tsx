import type { ReactNode } from 'react';
import { HintTooltip } from './HintTooltip';

interface FieldProps {
  label: string;
  hint?: string;
  /** Critical inline text shown below the control (warnings, behavior notes). */
  note?: string;
  children: ReactNode;
}

export function FieldLabel({ label, hint }: { label: string; hint?: string }) {
  return (
    <span className="field-label-row">
      <span>{label}</span>
      {hint && <HintTooltip text={hint} label={label} />}
    </span>
  );
}

export function Field({ label, hint, note, children }: FieldProps) {
  return (
    <div className="field">
      <label>
        <FieldLabel label={label} hint={hint} />
      </label>
      {children}
      {note && <div className="field-note">{note}</div>}
    </div>
  );
}

interface TextInputProps {
  label: string;
  hint?: string;
  note?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function TextInput({ label, hint, note, value, onChange, placeholder }: TextInputProps) {
  return (
    <Field label={label} hint={hint} note={note}>
      <input value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </Field>
  );
}

interface TextAreaProps {
  label: string;
  hint?: string;
  note?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function TextArea({ label, hint, note, value, onChange, placeholder }: TextAreaProps) {
  return (
    <Field label={label} hint={hint} note={note}>
      <textarea
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </Field>
  );
}

export function asRequiredNumber(
  handler: (value: number) => void,
): (value: number | undefined) => void {
  return (value) => {
    if (value != null) handler(value);
  };
}

interface NumberInputProps {
  label: string;
  hint?: string;
  note?: string;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  min?: number;
  step?: number;
  placeholder?: string;
  /** When false (default), cleared input is ignored and onChange is only called with a number. */
  allowClear?: boolean;
}

export function NumberInput({
  label,
  hint,
  note,
  value,
  onChange,
  min,
  step,
  placeholder,
  allowClear = false,
}: NumberInputProps) {
  return (
    <Field label={label} hint={hint} note={note}>
      <input
        type="number"
        value={value == null || !Number.isFinite(value) ? '' : value}
        min={min}
        step={step ?? 'any'}
        placeholder={placeholder}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw === '') {
            if (allowClear) onChange(undefined);
            return;
          }
          const n = Number(raw);
          if (Number.isFinite(n)) onChange(n);
        }}
      />
    </Field>
  );
}

interface DataListInputProps {
  label: string;
  hint?: string;
  note?: string;
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
  note,
  value,
  onChange,
  options,
  listId,
  placeholder,
}: DataListInputProps) {
  return (
    <Field label={label} hint={hint} note={note}>
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
  note?: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}

export function Select<T extends string>({
  label,
  hint,
  note,
  value,
  options,
  onChange,
}: SelectProps<T>) {
  return (
    <Field label={label} hint={hint} note={note}>
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
