import { useTranslation } from 'react-i18next';
import type { ValidationIssue } from '../../generator/validate';
import type { Dimension } from '../../types/dimension';
import { toIdentifier } from '../../types/ids';
import type { Project } from '../../types/quest';
import { ValidationBar } from '../editor/ValidationBar';
import { TextArea, TextInput } from '../ui/Field';

interface Props {
  dimension: Dimension;
  project: Project;
  issues: ValidationIssue[];
  onChange: (patch: Partial<Dimension>) => void;
  compact?: boolean;
}

export function DimensionForm({ dimension, project, issues, onChange, compact }: Props) {
  const { t } = useTranslation('dimensions');

  return (
    <div className={compact ? 'flow-inspector-form' : undefined}>
      <TextInput
        label={t('editor.dimensionName')}
        value={dimension.name}
        onChange={(name) =>
          onChange({
            name,
            tag: toIdentifier(name, dimension.tag || 'dimension'),
          })
        }
      />
      <TextInput
        label={t('editor.dimensionTag')}
        value={dimension.tag}
        onChange={(tag) => onChange({ tag: toIdentifier(tag, 'dimension') })}
      />
      <TextArea
        label={t('editor.description')}
        value={dimension.description ?? ''}
        onChange={(description) => onChange({ description: description || undefined })}
      />
      <p className="muted" style={{ marginTop: 12, marginBottom: 0 }}>
        {t('editor.dimensionIdHint', {
          id: `${project.namespace}:${dimension.tag}`,
        })}
      </p>
      {compact && <ValidationBar issues={issues} />}
    </div>
  );
}
