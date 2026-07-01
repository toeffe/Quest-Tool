import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { Dungeon } from '../../types/dungeon';
import { toIdentifier } from '../../types/ids';
import type { Project } from '../../types/quest';
import { Select, TextInput } from '../ui/Field';

interface Props {
  dungeon: Dungeon;
  project: Project;
  onChange: (patch: Partial<Dungeon>) => void;
}

export function DungeonForm({ dungeon, project, onChange }: Props) {
  const { t } = useTranslation('dungeons');
  const { t: tc } = useTranslation('common');
  const dimensions = project.dimensions ?? [];

  const dimensionOptions = useMemo(
    () => [
      { value: '', label: tc('actions.noneDash') },
      ...dimensions.map((d) => ({ value: d.id, label: d.name })),
    ],
    [dimensions, tc],
  );

  return (
    <>
      <TextInput
        label={t('editor.dungeonName')}
        value={dungeon.name}
        onChange={(name) => {
          onChange({
            name,
            tag: toIdentifier(name, dungeon.tag || 'dungeon'),
          });
        }}
      />
      <TextInput
        label={t('editor.dungeonTag')}
        value={dungeon.tag}
        onChange={(tag) => onChange({ tag: toIdentifier(tag, 'dungeon') })}
      />
      <TextInput
        label={t('editor.description')}
        value={dungeon.description ?? ''}
        onChange={(description) => onChange({ description: description || undefined })}
      />
      <Select
        label={t('editor.dimension')}
        hint={t('editor.dimensionHint')}
        value={dungeon.dimensionId ?? ''}
        options={dimensionOptions}
        onChange={(dimensionId) => onChange({ dimensionId: dimensionId || undefined })}
      />
    </>
  );
}
