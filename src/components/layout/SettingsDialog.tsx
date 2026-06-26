import { useRef } from 'react';
import { type Platform, PLATFORM_LABELS } from '../../types/quest';
import { useProjectStore } from '../../store/useProjectStore';
import { useUIStore } from '../../store/uiStore';
import { readProjectJsonFromFile } from '../../state/projectStore';
import { createProject } from '../../types/factory';

export function SettingsDialog() {
  const project = useProjectStore((s) => s.project);
  const setProjectMeta = useProjectStore((s) => s.setProjectMeta);
  const importProject = useProjectStore((s) => s.importProject);
  const setProject = useProjectStore((s) => s.setProject);
  const setSettingsOpen = useUIStore((s) => s.setSettingsOpen);
  const setSelectedQuestId = useUIStore((s) => s.setSelectedQuestId);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const json = await readProjectJsonFromFile(file);
      importProject(json);
      const imported = useProjectStore.getState().project;
      setSelectedQuestId(imported.quests[0]?.id ?? null);
      setSettingsOpen(false);
    } catch (err) {
      alert(`Could not import project: ${(err as Error).message}`);
    }
    e.target.value = '';
  }

  function handleReset() {
    if (!confirm('Reset to a fresh project? Unsaved work will be lost.')) return;
    const fresh = createProject();
    setProject(fresh);
    setSelectedQuestId(fresh.quests[0]?.id ?? null);
    setSettingsOpen(false);
  }

  return (
    <div
      className="dialog-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
      onClick={() => setSettingsOpen(false)}
      onKeyDown={(e) => e.key === 'Escape' && setSettingsOpen(false)}
    >
      <div className="dialog-panel" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-head">
          <h2 id="settings-title" className="dialog-title">
            Project settings
          </h2>
          <button type="button" className="icon-btn" onClick={() => setSettingsOpen(false)}>
            Close
          </button>
        </div>

        <div className="dialog-body">
          <div className="field">
            <label htmlFor="settings-name">Project name</label>
            <input
              id="settings-name"
              value={project.name}
              onChange={(e) => setProjectMeta({ name: e.target.value })}
            />
          </div>

          <div className="field">
            <label htmlFor="settings-namespace">Datapack namespace</label>
            <input
              id="settings-namespace"
              value={project.namespace}
              onChange={(e) => setProjectMeta({ namespace: e.target.value })}
              placeholder="questpack"
            />
            <div className="hint">Lowercase id used inside the datapack.</div>
          </div>

          <div className="field">
            <label htmlFor="settings-platform">Platform</label>
            <select
              id="settings-platform"
              value={project.platform}
              onChange={(e) => setProjectMeta({ platform: e.target.value as Platform })}
            >
              {(Object.keys(PLATFORM_LABELS) as Platform[]).map((p) => (
                <option key={p} value={p}>
                  {PLATFORM_LABELS[p]}
                </option>
              ))}
            </select>
          </div>

          <div className="settings-section">
            <label>Import project</label>
            <p className="hint">
              Import a .json backup or a datapack ZIP containing quest-tool-project.json.
            </p>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json,.zip,application/zip"
              style={{ display: 'none' }}
              onChange={handleImport}
            />
            <button type="button" className="btn" onClick={() => fileRef.current?.click()}>
              Import project file
            </button>
          </div>

          <div className="settings-section danger">
            <label>Danger zone</label>
            <button type="button" className="btn danger" onClick={handleReset}>
              Reset project
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
