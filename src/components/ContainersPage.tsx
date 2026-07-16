import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ValidationIssue } from '../generator/validate';
import { useEntityClipboard } from '../hooks/useEntityClipboard';
import type { WorldContainer } from '../types/container';
import type { Project } from '../types/quest';
import { ContainerForm } from './containers/ContainerForm';
import { PageHeader } from './ui/PageHeader';

interface Props {
  project: Project;
  issues?: ValidationIssue[];
  onChange: (project: Project) => void;
  onAdd: () => WorldContainer;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}

export function ContainersPage({
  project,
  issues = [],
  onChange,
  onAdd,
  onDuplicate,
  onDelete,
}: Props) {
  const { t } = useTranslation('containers');
  const { t: tc } = useTranslation('common');
  const { copyEntity, pasteEntity } = useEntityClipboard();

  const containers = project.containers ?? [];
  const [selectedId, setSelectedId] = useState<string>(() => containers[0]?.id ?? '');

  const selected = useMemo(
    () => containers.find((c) => c.id === selectedId) ?? containers[0],
    [containers, selectedId],
  );

  const pageIssues = useMemo(() => {
    if (!selected) return issues.filter((i) => i.containerId);
    return issues.filter((i) => i.containerId === selected.id);
  }, [issues, selected]);

  const updateContainer = (patch: Partial<WorldContainer>) => {
    if (!selected) return;
    onChange({
      ...project,
      containers: containers.map((c) => (c.id === selected.id ? { ...c, ...patch } : c)),
    });
  };

  const handleAdd = () => {
    const added = onAdd();
    setSelectedId(added.id);
  };

  const handleDelete = (id: string) => {
    if (!window.confirm(t('list.deleteConfirm'))) return;
    onDelete(id);
    if (selectedId === id) {
      const remaining = containers.filter((c) => c.id !== id);
      setSelectedId(remaining[0]?.id ?? '');
    }
  };

  return (
    <div className="items-page">
      <PageHeader title={t('title')} lead={t('subtitle')} hint={t('subtitleHint')} />

      <div className="items-layout">
        <aside className="items-list card">
          <div className="row-between list-panel-head" style={{ marginBottom: 12 }}>
            <h3 style={{ margin: 0 }}>{t('list.title', { count: containers.length })}</h3>
            <div className="row-actions">
              <button
                type="button"
                className="btn small ghost"
                title={tc('clipboard.paste')}
                onClick={async () => {
                  const result = await pasteEntity();
                  if (result?.kind === 'container') {
                    setSelectedId(result.id);
                  }
                }}
              >
                {tc('clipboard.paste')}
              </button>
              <button type="button" className="btn small" onClick={handleAdd} title={t('list.add')}>
                {tc('actions.add')}
              </button>
            </div>
          </div>

          {containers.length === 0 && <p className="muted">{t('list.empty')}</p>}

          {containers.map((container) => (
            <div
              key={container.id}
              className={`quest-item ${selected?.id === container.id ? 'active' : ''}`}
              onClick={() => setSelectedId(container.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setSelectedId(container.id)}
            >
              <div>
                <div className="name">{container.name || t('list.untitled')}</div>
                <div className="type">
                  {container.blockType.replace('minecraft:', '')} @ {container.location.x}{' '}
                  {container.location.y} {container.location.z}
                </div>
              </div>
            </div>
          ))}
        </aside>

        <div className="items-editor">
          {selected ? (
            <div className="card">
              <div className="row-between entity-editor-head" style={{ marginBottom: 14 }}>
                <h3 style={{ margin: 0 }}>{selected.name || t('editor.name')}</h3>
                <div className="row-actions">
                  <button
                    type="button"
                    className="btn small"
                    title={tc('clipboard.copy')}
                    onClick={() => void copyEntity('container', selected.id)}
                  >
                    {tc('actions.copy')}
                  </button>
                  <button
                    type="button"
                    className="btn small"
                    onClick={() => onDuplicate(selected.id)}
                  >
                    {tc('actions.duplicate')}
                  </button>
                  <button
                    type="button"
                    className="btn small danger"
                    onClick={() => handleDelete(selected.id)}
                  >
                    {tc('actions.delete')}
                  </button>
                </div>
              </div>
              <ContainerForm
                container={selected}
                project={project}
                issues={pageIssues}
                onChange={updateContainer}
              />
            </div>
          ) : (
            <div className="card">
              <p className="muted">{t('list.selectEmpty')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
