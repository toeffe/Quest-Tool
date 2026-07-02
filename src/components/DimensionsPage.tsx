import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ValidationIssue } from '../generator/validate';
import { useEntityClipboard } from '../hooks/useEntityClipboard';
import { useUIStore } from '../store/uiStore';
import type { Dimension, TeleportPad } from '../types/dimension';
import type { Project } from '../types/quest';
import { DimensionForm } from './dimensions/DimensionForm';
import { dimensionLabel } from './dimensions/dimensionEditors';
import { PadForm } from './dimensions/PadForm';
import { ValidationBar } from './editor/ValidationBar';
import { PageHeader } from './ui/PageHeader';

type Selection = { kind: 'dimension'; id: string } | { kind: 'pad'; id: string };

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
  const { copyEntity, pasteEntity } = useEntityClipboard();

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
      dimensions: dimensions.map((d) => (d.id === selectedDimension.id ? { ...d, ...patch } : d)),
    });
  };

  const updatePad = (patch: Partial<TeleportPad>) => {
    if (!selectedPad) return;
    onChange({
      ...project,
      teleportPads: teleportPads.map((p) => (p.id === selectedPad.id ? { ...p, ...patch } : p)),
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
      setSelection(
        initialSelection(
          dimensions.filter((d) => d.id !== id),
          teleportPads,
        ),
      );
    }
  };

  const handleDeletePad = (id: string) => {
    if (!window.confirm(t('list.deletePadConfirm'))) return;
    onDeletePad(id);
    if (selection?.kind === 'pad' && selection.id === id) {
      setSelection(
        initialSelection(
          dimensions,
          teleportPads.filter((p) => p.id !== id),
        ),
      );
    }
  };

  return (
    <div className="items-page">
      <PageHeader title={t('title')} lead={t('subtitle')} hint={t('subtitleHint')} />

      <div className="items-layout">
        <aside className="items-list card">
          <div className="row-between" style={{ marginBottom: 12 }}>
            <h3 style={{ margin: 0 }}>{t('list.dimensionsTitle', { count: dimensions.length })}</h3>
            <div className="row-actions">
              <button
                type="button"
                className="btn small ghost"
                title={tc('clipboard.paste')}
                onClick={async () => {
                  const result = await pasteEntity();
                  if (result?.kind === 'dimension') {
                    setSelection({ kind: 'dimension', id: result.id });
                  } else if (result?.kind === 'teleportPad') {
                    setSelection({ kind: 'pad', id: result.id });
                  }
                }}
              >
                {tc('clipboard.paste')}
              </button>
              <button
                type="button"
                className="btn small"
                onClick={handleAddDimension}
                title={t('list.addDimension')}
              >
                {tc('actions.add')}
              </button>
            </div>
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
              onKeyDown={(e) =>
                e.key === 'Enter' && setSelection({ kind: 'dimension', id: dim.id })
              }
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
                    title={tc('clipboard.copy')}
                    onClick={() => void copyEntity('dimension', selectedDimension.id)}
                  >
                    {tc('actions.copy')}
                  </button>
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
              <DimensionForm
                dimension={selectedDimension}
                project={project}
                issues={pageIssues}
                onChange={updateDimension}
              />
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
                    title={tc('clipboard.copy')}
                    onClick={() => void copyEntity('teleportPad', selectedPad.id)}
                  >
                    {tc('actions.copy')}
                  </button>
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
              <PadForm
                pad={selectedPad}
                dimensions={dimensions}
                issues={pageIssues}
                onChange={updatePad}
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
