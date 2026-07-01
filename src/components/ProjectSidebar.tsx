import { useRef } from 'react';
import { PLATFORM_LABELS, type Platform, type Project, QUEST_TYPE_LABELS } from '../types/quest';

interface Props {
  project: Project;
  selectedId: string;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onRenameProject: (name: string) => void;
  onNamespace: (namespace: string) => void;
  onPlatform: (platform: Platform) => void;
  onImport: (file: File) => void;
}

export function ProjectSidebar({
  project,
  selectedId,
  onSelect,
  onAdd,
  onDuplicate,
  onDelete,
  onRenameProject,
  onNamespace,
  onPlatform,
  onImport,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="brand">
          Quest Tool MC
          <small>Minecraft Java 1.21.11 quest creator</small>
        </div>

        <div className="field" style={{ marginTop: 14, marginBottom: 10 }}>
          <label>Project name</label>
          <input value={project.name} onChange={(e) => onRenameProject(e.target.value)} />
        </div>

        <div className="field" style={{ marginBottom: 10 }}>
          <label>Datapack namespace</label>
          <input
            value={project.namespace}
            onChange={(e) => onNamespace(e.target.value)}
            placeholder="questpack"
          />
          <div className="hint">Lowercase id used inside the datapack.</div>
        </div>

        <div className="field" style={{ marginBottom: 0 }}>
          <label>Platform</label>
          <select value={project.platform} onChange={(e) => onPlatform(e.target.value as Platform)}>
            {(Object.keys(PLATFORM_LABELS) as Platform[]).map((p) => (
              <option key={p} value={p}>
                {PLATFORM_LABELS[p]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="quest-list">
        <div className="row-between" style={{ padding: '4px 6px 10px' }}>
          <span className="muted" style={{ fontSize: 12, fontWeight: 700 }}>
            QUESTS ({project.quests.length})
          </span>
          <button className="btn small" onClick={onAdd}>
            + New
          </button>
        </div>
        {project.quests.map((q) => (
          <div
            key={q.id}
            className={`quest-item ${q.id === selectedId ? 'active' : ''}`}
            onClick={() => onSelect(q.id)}
          >
            <div>
              <div className="name">{q.name || 'Untitled quest'}</div>
              <div className="type">{QUEST_TYPE_LABELS[q.type]}</div>
            </div>
            <div className="row-actions">
              <button
                className="icon-btn"
                title="Duplicate"
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicate(q.id);
                }}
              >
                Copy
              </button>
              <button
                className="icon-btn"
                title="Delete"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(q.id);
                }}
              >
                Del
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="sidebar-footer">
        <div className="hint" style={{ margin: '0 0 10px', fontSize: 12 }}>
          Download a datapack on Generate — it includes a project backup you can re-import below.
        </div>
        <button className="btn block ghost" onClick={() => fileRef.current?.click()}>
          Import project (datapack ZIP)
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json,.zip,application/zip"
          style={{ display: 'none' }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onImport(file);
            e.target.value = '';
          }}
        />
      </div>
    </aside>
  );
}
