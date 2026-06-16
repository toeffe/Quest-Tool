import { variantFieldsFor } from '../../data/mobVariants';
import { Select } from '../ui/Field';

interface Props {
  entityType: string;
  variants?: Record<string, string>;
  onChange: (variants: Record<string, string>) => void;
}

/** Renders appearance sub-variant selectors for the given mob entity type. */
export function VariantFields({ entityType, variants, onChange }: Props) {
  const fields = variantFieldsFor(entityType);
  if (fields.length === 0) return null;

  return (
    <div className="grid-2">
      {fields.map((field) => (
        <Select
          key={field.nbtKey}
          label={field.label}
          value={variants?.[field.nbtKey] ?? field.options[0].value}
          options={field.options.map((o) => ({ value: o.value, label: o.label }))}
          onChange={(value) => onChange({ ...(variants ?? {}), [field.nbtKey]: value })}
        />
      ))}
    </div>
  );
}
