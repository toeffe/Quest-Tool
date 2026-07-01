import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { ValidationIssue } from '../../generator/validate';
import type { TeleportPad } from '../../types/dimension';
import { ValidationBar } from '../editor/ValidationBar';
import { asRequiredNumber, NumberInput, TextInput } from '../ui/Field';
import { DestinationEditor, EndpointEditor } from './dimensionEditors';

interface Props {
  pad: TeleportPad;
  dimensions: { id: string; name: string }[];
  issues: ValidationIssue[];
  onChange: (patch: Partial<TeleportPad>) => void;
  compact?: boolean;
}

export function PadForm({ pad, dimensions, issues, onChange, compact }: Props) {
  const { t } = useTranslation('dimensions');
  const { t: tc } = useTranslation('common');

  const dimensionOptions = useMemo(
    () => [
      { value: '', label: t('overworld') },
      ...dimensions.map((d) => ({ value: d.id, label: d.name })),
    ],
    [dimensions, t],
  );

  return (
    <div className={compact ? 'flow-inspector-form' : undefined}>
      <TextInput
        label={t('editor.padName')}
        value={pad.name}
        onChange={(name) => onChange({ name })}
      />
      <NumberInput
        label={t('editor.cooldownSeconds')}
        hint={t('editor.cooldownHint')}
        value={pad.cooldownSeconds ?? 1}
        min={1}
        onChange={asRequiredNumber((cooldownSeconds) =>
          onChange({ cooldownSeconds: Math.max(1, cooldownSeconds) }),
        )}
      />
      <EndpointEditor
        label={t('editor.atEndpoint')}
        endpoint={pad.at}
        onChange={(at) => onChange({ at })}
        showRadius
        t={t}
        tc={tc}
        dimensionOptions={dimensionOptions}
      />
      <DestinationEditor
        label={t('editor.toEndpoint')}
        destination={pad.to}
        onChange={(to) => onChange({ to })}
        t={t}
        tc={tc}
        dimensionOptions={dimensionOptions}
      />
      {compact && <ValidationBar issues={issues} />}
    </div>
  );
}
