import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { useProjectStore } from './store/useProjectStore';
import { useUIStore } from './store/uiStore';
import { useAutosave } from './hooks/useAutosave';
import { useValidation } from './hooks/useValidation';
import { useKeyboard } from './hooks/useKeyboard';
import { TopBar } from './components/layout/TopBar';
import { Sidebar } from './components/layout/Sidebar';
import { SettingsDialog } from './components/layout/SettingsDialog';
import { CommandPalette } from './components/layout/CommandPalette';
import { QuestEditor } from './components/editor/QuestEditor';
import { ExportPanel } from './components/export/ExportPanel';
import { ItemsPage } from './components/ItemsPage';
import { HelpPanel } from './components/HelpPanel';
import { type Theme, getInitialTheme, applyTheme } from './state/theme';

const FlowCanvas = lazy(() =>
  import('./components/flow/FlowCanvas').then((m) => ({ default: m.FlowCanvas })),
);
const CommandsPage = lazy(() =>
  import('./components/CommandsPage').then((m) => ({ default: m.CommandsPage })),
);

function ViewFallback() {
  return (
    <div className="view-loading muted" role="status">
      Loading…
    </div>
  );
}

export default function App() {
  const project = useProjectStore((s) => s.project);
  const setProject = useProjectStore((s) => s.setProject);
  const updateQuest = useProjectStore((s) => s.updateQuest);
  const addCustomItem = useProjectStore((s) => s.addCustomItem);
  const deleteCustomItem = useProjectStore((s) => s.deleteCustomItem);
  const duplicateCustomItem = useProjectStore((s) => s.duplicateCustomItem);

  const activeView = useUIStore((s) => s.activeView);
  const selectedQuestId = useUIStore((s) => s.selectedQuestId);
  const setSelectedQuestId = useUIStore((s) => s.setSelectedQuestId);
  const settingsOpen = useUIStore((s) => s.settingsOpen);
  const helpOpen = useUIStore((s) => s.helpOpen);
  const setHelpOpen = useUIStore((s) => s.setHelpOpen);

  const [theme, setTheme] = useState<Theme>(() => getInitialTheme());
  const issues = useValidation();

  useAutosave();
  useKeyboard();

  // Initialize selected quest on first load.
  useEffect(() => {
    if (!selectedQuestId && project.quests[0]) {
      setSelectedQuestId(project.quests[0].id);
    }
  }, [selectedQuestId, project.quests, setSelectedQuestId]);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const selectedQuest = useMemo(
    () => project.quests.find((q) => q.id === selectedQuestId) ?? project.quests[0],
    [project, selectedQuestId],
  );

  const showSidebar = activeView === 'editor' || activeView === 'flow';

  return (
    <div className="app-shell">
      <TopBar theme={theme} onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))} />

      {helpOpen && <HelpPanel onClose={() => setHelpOpen(false)} />}

      <div className="app-body">
        {showSidebar && <Sidebar />}

        <main className="app-main">
          {activeView === 'editor' && selectedQuest && (
            <QuestEditor
              quest={selectedQuest}
              project={project}
              issues={issues}
              onChange={updateQuest}
            />
          )}

          {activeView === 'editor' && !selectedQuest && (
            <div className="empty-editor">
              <div className="empty-editor-icon" aria-hidden>
                📋
              </div>
              <p>Select a quest to edit, or create a new one from the sidebar.</p>
            </div>
          )}

          {activeView === 'flow' && (
            <Suspense fallback={<ViewFallback />}>
              <FlowCanvas
                project={project}
                onChangeQuest={updateQuest}
                onChangeProject={setProject}
                selectedId={selectedQuest?.id ?? ''}
                onSelect={setSelectedQuestId}
              />
            </Suspense>
          )}

          {activeView === 'items' && (
            <div className="content">
              <div className="content-inner">
                <ItemsPage
                  project={project}
                  onChange={setProject}
                  onAdd={(kind) => {
                    addCustomItem(kind);
                  }}
                  onDuplicate={duplicateCustomItem}
                  onDelete={deleteCustomItem}
                />
              </div>
            </div>
          )}

          {activeView === 'commands' && (
            <Suspense fallback={<ViewFallback />}>
              <div className="content">
                <div className="content-inner">
                  <CommandsPage project={project} />
                </div>
              </div>
            </Suspense>
          )}

          {activeView === 'export' && (
            <div className="content">
              <ExportPanel />
            </div>
          )}
        </main>
      </div>

      {settingsOpen && <SettingsDialog />}
      <CommandPalette />
    </div>
  );
}
