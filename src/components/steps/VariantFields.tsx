import { useTranslation } from 'react-i18next';
import { variantFieldsFor } from '../../data/mobVariants';
import { Select } from '../ui/Field';

interface Props {
  entityType: string;
  variants?: Record<string, string>;
  onChange: (variants: Record<string, string>) => void;
}

/** Adult vs baby appearance for villagers (uses permanent baby Age NBT). */
export function BabySelect({
  value,
  onChange,
}: {
  value?: boolean;
  onChange: (baby: boolean) => void;
}) {
  const { t } = useTranslation('common');
  const ageOptions = [
    { value: 'adult', label: t('variants.adult') },
    { value: 'baby', label: t('variants.baby') },
  ];
  return (
    <Select
      label={t('variants.ageAppearance')}
      value={value ? 'baby' : 'adult'}
      options={ageOptions}
      onChange={(v) => onChange(v === 'baby')}
    />
  );
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
