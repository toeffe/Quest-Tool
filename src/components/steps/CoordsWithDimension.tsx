import { useTranslation } from 'react-i18next';
import type { Coordinates } from '../../types/quest';
import { Select } from '../ui/Field';
import { CoordsRow } from './StepNPC';

interface Props {
  value: Coordinates;
  onChange: (coords: Coordinates) => void;
  dimensionOptions: { value: string; label: string }[];
}

export function CoordsWithDimension({ value, onChange, dimensionOptions }: Props) {
  const { t } = useTranslation('dimensions');
  return (
    <>
      <Select
        label={t('editor.dimension')}
        value={value.dimensionId ?? ''}
        options={dimensionOptions}
        onChange={(dimensionId) => onChange({ ...value, dimensionId: dimensionId || undefined })}
      />
      <CoordsRow value={value} onChange={onChange} />
    </>
  );
}
