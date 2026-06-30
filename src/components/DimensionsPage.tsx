import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type Project } from '../types/quest';
import {
  type Dimension,
  type TeleportPad,
  type PortalEndpoint,
  type TeleportDestination,
} from '../types/dimension';
import { toIdentifier } from '../types/ids';
import { type ValidationIssue } from '../generator/validate';
import { ValidationBar } from './editor/ValidationBar';
import { TextInput, NumberInput, Field, TextArea, Select } from './ui/Field';
import { useUIStore } from '../store/uiStore';

type Selection =
  | { kind: 'dimension'; id: string }
  | { kind: 'pad'; id: string };

interface Props {
  project: Project;
  issues?: ValidationIssue[];
  onChange: (project: Project) => void;
  onAddDimension: () => Dimension;
  onDuplicateDimension: (id: string) => void;
  onDeleteDimension: (id: string) => void;
  onAddPad: () => TeleportPad;
  onDuplicatePad: (id: string) => void;
  onDeletePad: (id: string) => void;
}

function EndpointEditor({
  label,
  endpoint,
  onChange,
  showRadius,
  t,
  tc,
  dimensionOptions,
}: {
  label: string;
  endpoint: PortalEndpoint;
  onChange: (ep: PortalEndpoint) => void;
  showRadius: boolean;
  t: (key: string, opts?: Record<string, unknown>) => string;
  tc: (key: string) => string;
  dimensionOptions: { value: string; label: string }[];
}) {
  return (
    <Field label={label} hint={t('editor.coordsHint')}>
      <Select
        label={t('editor.dimension')}
        value={endpoint.dimensionId ?? ''}
        options={dimensionOptions}
        onChange={(dimensionId) =>
          onChange({ ...endpoint, dimensionId: dimensionId || undefined })
        }
      />
      <div className="grid-3" style={{ marginTop: 8 }}>
        <NumberInput
          label={tc('coords.x')}
          value={endpoint.x}
          onChange={(x) => onChange({ ...endpoint, x })}
        />
        <NumberInput
          label={tc('coords.y')}
          value={endpoint.y}
          onChange={(y) => onChange({ ...endpoint, y })}
        />
        <NumberInput
          label={tc('coords.z')}
          value={endpoint.z}
          onChange={(z) => onChange({ ...endpoint, z })}
        />
      </div>
      {showRadius && (
        <NumberInput
          label={t('editor.radius')}
          hint={t('editor.radiusHint')}
          value={endpoint.radius}
          min={0}
          onChange={(radius) => onChange({ ...endpoint, radius })}
        />
      )}
    </Field>
  );
}

function DestinationEditor({
  label,
  destination,
  onChange,
  t,
  tc,
  dimensionOptions,
}: {
  label: string;
  destination: TeleportDestination;
  onChange: (dest: TeleportDestination) => void;
  t: (key: string, opts?: Record<string, unknown>) => string;
  tc: (key: string) => string;
  dimensionOptions: { value: string; label: string }[];
}) {
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
          onChange={(x) => onChange({ ...destination, x })}
        />
        <NumberInput
          label={tc('coords.y')}
          value={destination.y}
          onChange={(y) => onChange({ ...destination, y })}
        />
        <NumberInput
          label={tc('coords.z')}
          value={destination.z}
          onChange={(z) => onChange({ ...destination, z })}
        />
      </div>
    </Field>
  );
}

function dimensionLabel(dimensions: Dimension[], dimensionId: string | undefined, overworld: string): string {
  if (!dimensionId) return overworld;
  return dimensions.find((d) => d.id === dimensionId)?.name ?? overworld;
}

function initialSelection(dimensions: Dimension[], pads: TeleportPad[]): Selection | null {
  if (dimensions[0]) return { kind: 'dimension', id: dimensions[0].id };
  if (pads[0]) return { kind: 'pad', id: pads[0].id };
  return null;
}

export function DimensionsPage({
  project,
  issues = [],
  onChange,
  onAddDimension,
  onDuplicateDimension,
  onDeleteDimension,
  onAddPad,
  onDuplicatePad,
  onDeletePad,
}: Props) {
  const { t } = useTranslation('dimensions');
  const { t: tc } = useTranslation('common');

  const dimensions = project.dimensions ?? [];
  const teleportPads = project.teleportPads ?? [];
  const dimensionsFocus = useUIStore((s) => s.dimensionsFocus);
  const setDimensionsFocus = useUIStore((s) => s.setDimensionsFocus);

  const [selection, setSelection] = useState<Selection | null>(() =>
    initialSelection(dimensions, teleportPads),
  );

  useEffect(() => {
    if (!dimensionsFocus) return;
    setSelection(dimensionsFocus);
    setDimensionsFocus(null);
  }, [dimensionsFocus, setDimensionsFocus]);

  const dimensionOptions = useMemo(
    () => [
      { value: '', label: t('overworld') },
      ...dimensions.map((d) => ({ value: d.id, label: d.name })),
    ],
    [dimensions, t],
  );

  const selectedDimension = useMemo(() => {
    if (selection?.kind !== 'dimension') return undefined;
    return dimensions.find((d) => d.id === selection.id);
  }, [dimensions, selection]);

  const selectedPad = useMemo(() => {
    if (selection?.kind !== 'pad') return undefined;
    return teleportPads.find((p) => p.id === selection.id);
  }, [teleportPads, selection]);

  const updateDimension = (patch: Partial<Dimension>) => {
    if (!selectedDimension) return;
    onChange({
      ...project,
      dimensions: dimensions.map((d) =>
        d.id === selectedDimension.id ? { ...d, ...patch } : d,
      ),
    });
  };

  const updatePad = (patch: Partial<TeleportPad>) => {
    if (!selectedPad) return;
    onChange({
      ...project,
      teleportPads: teleportPads.map((p) =>
        p.id === selectedPad.id ? { ...p, ...patch } : p,
      ),
    });
  };

  const pageIssues = useMemo(() => {
    if (!selection) {
      return issues.filter((i) => i.dimensionId || i.teleportPadId);
    }
    if (selection.kind === 'dimension') {
      return issues.filter((i) => i.dimensionId === selection.id && !i.teleportPadId);
    }
    return issues.filter((i) => i.teleportPadId === selection.id);
  }, [issues, selection]);

  const handleAddDimension = () => {
    const added = onAddDimension();
    setSelection({ kind: 'dimension', id: added.id });
  };

  const handleAddPad = () => {
    const added = onAddPad();
    setSelection({ kind: 'pad', id: added.id });
  };

  const handleDeleteDimension = (id: string) => {
    if (!window.confirm(t('list.deleteDimensionConfirm'))) return;
    onDeleteDimension(id);
    if (selection?.kind === 'dimension' && selection.id === id) {
      setSelection(initialSelection(dimensions.filter((d) => d.id !== id), teleportPads));
    }
  };

  const handleDeletePad = (id: string) => {
    if (!window.confirm(t('list.deletePadConfirm'))) return;
    onDeletePad(id);
    if (selection?.kind === 'pad' && selection.id === id) {
      setSelection(initialSelection(dimensions, teleportPads.filter((p) => p.id !== id)));
    }
  };

  return (
    <div className="items-page">
      <h1 className="step-title">{t('title')}</h1>
      <p className="step-sub">{t('subtitle')}</p>

      <div className="items-layout">
        <aside className="items-list card">
          <div className="row-between" style={{ marginBottom: 12 }}>
            <h3 style={{ margin: 0 }}>{t('list.dimensionsTitle', { count: dimensions.length })}</h3>
            <button
              type="button"
              className="btn small"
              onClick={handleAddDimension}
              title={t('list.addDimension')}
            >
              {tc('actions.add')}
            </button>
          </div>

          {dimensions.length === 0 && <p className="muted">{t('list.emptyDimensions')}</p>}

          {dimensions.map((dim) => (
            <div
              key={dim.id}
              className={`quest-item ${
                selection?.kind === 'dimension' && selection.id === dim.id ? 'active' : ''
              }`}
              onClick={() => setSelection({ kind: 'dimension', id: dim.id })}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setSelection({ kind: 'dimension', id: dim.id })}
            >
              <div>
                <div className="name">{dim.name || t('list.untitled')}</div>
                <div className="type">{dim.tag}</div>
              </div>
            </div>
          ))}

          <div className="dimensions-sidebar-divider" />

          <div className="row-between" style={{ marginBottom: 12 }}>
            <h3 style={{ margin: 0 }}>{t('list.padsTitle', { count: teleportPads.length })}</h3>
            <button
              type="button"
              className="btn small"
              onClick={handleAddPad}
              title={t('list.addPad')}
            >
              {tc('actions.add')}
            </button>
          </div>

          {teleportPads.length === 0 && <p className="muted">{t('list.emptyPads')}</p>}

          {teleportPads.map((pad) => (
            <div
              key={pad.id}
              className={`quest-item ${
                selection?.kind === 'pad' && selection.id === pad.id ? 'active' : ''
              }`}
              onClick={() => setSelection({ kind: 'pad', id: pad.id })}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setSelection({ kind: 'pad', id: pad.id })}
            >
              <div>
                <div className="name">{pad.name || t('list.untitled')}</div>
                <div className="type">
                  {t('list.padMeta', {
                    from: dimensionLabel(dimensions, pad.at.dimensionId, t('overworld')),
                    to: dimensionLabel(dimensions, pad.to.dimensionId, t('overworld')),
                  })}
                </div>
              </div>
            </div>
          ))}
        </aside>

        <div className="items-editor">
          {selectedDimension && (
            <div className="card">
              <div className="row-between" style={{ marginBottom: 14 }}>
                <h3 style={{ margin: 0 }}>{selectedDimension.name || t('editor.dimensionName')}</h3>
                <div className="row-actions">
                  <button
                    type="button"
                    className="btn small"
                    onClick={() => onDuplicateDimension(selectedDimension.id)}
                  >
                    {tc('actions.duplicate')}
                  </button>
                  <button
                    type="button"
                    className="btn small danger"
                    onClick={() => handleDeleteDimension(selectedDimension.id)}
                  >
                    {tc('actions.delete')}
                  </button>
                </div>
              </div>
              <TextInput
                label={t('editor.dimensionName')}
                value={selectedDimension.name}
                onChange={(name) =>
                  updateDimension({ name, tag: toIdentifier(name, selectedDimension.tag || 'dimension') })
                }
              />
              <TextInput
                label={t('editor.dimensionTag')}
                value={selectedDimension.tag}
                onChange={(tag) => updateDimension({ tag: toIdentifier(tag, 'dimension') })}
              />
              <TextArea
                label={t('editor.description')}
                value={selectedDimension.description ?? ''}
                onChange={(description) => updateDimension({ description: description || undefined })}
              />
              <p className="muted" style={{ marginTop: 12, marginBottom: 0 }}>
                {t('editor.dimensionIdHint', {
                  id: `${project.namespace}:${selectedDimension.tag}`,
                })}
              </p>
            </div>
          )}

          {selectedPad && (
            <div className="card">
              <div className="row-between" style={{ marginBottom: 14 }}>
                <h3 style={{ margin: 0 }}>{selectedPad.name || t('editor.padName')}</h3>
                <div className="row-actions">
                  <button
                    type="button"
                    className="btn small"
                    onClick={() => onDuplicatePad(selectedPad.id)}
                  >
                    {tc('actions.duplicate')}
                  </button>
                  <button
                    type="button"
                    className="btn small danger"
                    onClick={() => handleDeletePad(selectedPad.id)}
                  >
                    {tc('actions.delete')}
                  </button>
                </div>
              </div>
              <TextInput
                label={t('editor.padName')}
                value={selectedPad.name}
                onChange={(name) => updatePad({ name })}
              />
              <NumberInput
                label={t('editor.cooldownSeconds')}
                hint={t('editor.cooldownHint')}
                value={selectedPad.cooldownSeconds ?? 1}
                min={1}
                onChange={(cooldownSeconds) =>
                  updatePad({ cooldownSeconds: Math.max(1, cooldownSeconds) })
                }
              />
              <EndpointEditor
                label={t('editor.atEndpoint')}
                endpoint={selectedPad.at}
                onChange={(at) => updatePad({ at })}
                showRadius
                t={t}
                tc={tc}
                dimensionOptions={dimensionOptions}
              />
              <DestinationEditor
                label={t('editor.toEndpoint')}
                destination={selectedPad.to}
                onChange={(to) => updatePad({ to })}
                t={t}
                tc={tc}
                dimensionOptions={dimensionOptions}
              />
            </div>
          )}

          {!selectedDimension && !selectedPad && (
            <div className="card">
              <p className="muted">{t('list.selectEmpty')}</p>
            </div>
          )}
        </div>
      </div>

      <ValidationBar issues={pageIssues} />
    </div>
  );
}
