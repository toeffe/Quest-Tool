import type { PortalEndpoint, TeleportDestination } from '../../types/dimension';
import { asRequiredNumber, Field, NumberInput, Select } from '../ui/Field';

interface EndpointEditorProps {
  label: string;
  endpoint: PortalEndpoint;
  onChange: (ep: PortalEndpoint) => void;
  showRadius: boolean;
  t: (key: string, opts?: Record<string, unknown>) => string;
  tc: (key: string) => string;
  dimensionOptions: { value: string; label: string }[];
}

export function EndpointEditor({
  label,
  endpoint,
  onChange,
  showRadius,
  t,
  tc,
  dimensionOptions,
}: EndpointEditorProps) {
  return (
    <Field label={label} hint={t('editor.coordsHint')}>
      <Select
        label={t('editor.dimension')}
        value={endpoint.dimensionId ?? ''}
        options={dimensionOptions}
        onChange={(dimensionId) => onChange({ ...endpoint, dimensionId: dimensionId || undefined })}
      />
      <div className="grid-3" style={{ marginTop: 8 }}>
        <NumberInput
          label={tc('coords.x')}
          value={endpoint.x}
          onChange={asRequiredNumber((x) => onChange({ ...endpoint, x }))}
        />
        <NumberInput
          label={tc('coords.y')}
          value={endpoint.y}
          onChange={asRequiredNumber((y) => onChange({ ...endpoint, y }))}
        />
        <NumberInput
          label={tc('coords.z')}
          value={endpoint.z}
          onChange={asRequiredNumber((z) => onChange({ ...endpoint, z }))}
        />
      </div>
      {showRadius && (
        <NumberInput
          label={t('editor.radius')}
          hint={t('editor.radiusHint')}
          value={endpoint.radius}
          min={0}
          onChange={asRequiredNumber((radius) => onChange({ ...endpoint, radius }))}
        />
      )}
    </Field>
  );
}

interface DestinationEditorProps {
  label: string;
  destination: TeleportDestination;
  onChange: (dest: TeleportDestination) => void;
  t: (key: string, opts?: Record<string, unknown>) => string;
  tc: (key: string) => string;
  dimensionOptions: { value: string; label: string }[];
}

export function DestinationEditor({
  label,
  destination,
  onChange,
  t,
  tc,
  dimensionOptions,
}: DestinationEditorProps) {
  return (
    <Field label={label} hint={t('editor.coordsHint')}>
      <Select
        label={t('editor.dimension')}
        value={destination.dimensionId ?? ''}
        options={dimensionOptions}
        onChange={(dimensionId) =>
          onChange({ ...destination, dimensionId: dimensionId || undefined })
        }
      />
      <div className="grid-3" style={{ marginTop: 8 }}>
        <NumberInput
          label={tc('coords.x')}
          value={destination.x}
          onChange={asRequiredNumber((x) => onChange({ ...destination, x }))}
        />
        <NumberInput
          label={tc('coords.y')}
          value={destination.y}
          onChange={asRequiredNumber((y) => onChange({ ...destination, y }))}
        />
        <NumberInput
          label={tc('coords.z')}
          value={destination.z}
          onChange={asRequiredNumber((z) => onChange({ ...destination, z }))}
        />
      </div>
    </Field>
  );
}

export function dimensionLabel(
  dimensions: { id: string; name: string }[],
  dimensionId: string | undefined,
  overworld: string,
): string {
  if (!dimensionId) return overworld;
  return dimensions.find((d) => d.id === dimensionId)?.name ?? overworld;
}
