import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { Project } from '../types/quest';

export function useDimensionOptions(project: Project) {
  const { t } = useTranslation('dimensions');
  return useMemo(
    () => [
      { value: '', label: t('overworld') },
      ...(project.dimensions ?? []).map((d) => ({ value: d.id, label: d.name })),
    ],
    [project.dimensions, t],
  );
}
