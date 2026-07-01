import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CommandPalette } from './components/layout/CommandPalette';
import { SettingsDialog } from './components/layout/SettingsDialog';
import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { useAutosave } from './hooks/useAutosave';
import { useKeyboard } from './hooks/useKeyboard';
import { useValidation } from './hooks/useValidation';
import { applyTheme, getInitialTheme, type Theme } from './state/theme';
import { useUIStore } from './store/uiStore';
import { useProjectStore } from './store/useProjectStore';
import { getSavedView, saveView } from './store/viewStorage';

const FlowCanvas = lazy(() =>
  import('./components/flow/FlowCanvas').then((m) => ({ default: m.FlowCanvas })),
);
const CommandsPage = lazy(() =>
  import('./components/CommandsPage').then((m) => ({ default: m.CommandsPage })),
);
const QuestEditor = lazy(() =>
  import('./components/editor/QuestEditor').then((m) => ({ default: m.QuestEditor })),
);
const ExportPanel = lazy(() =>
  import('./components/export/ExportPanel').then((m) => ({ default: m.ExportPanel })),
);
const HelpPanel = lazy(() =>
  import('./components/HelpPanel').then((m) => ({ default: m.HelpPanel })),
);
const ItemsPage = lazy(() =>
  import('./components/ItemsPage').then((m) => ({ default: m.ItemsPage })),
);
const CustomMobsPage = lazy(() =>
  import('./components/CustomMobsPage').then((m) => ({ default: m.CustomMobsPage })),
);
const DungeonsPage = lazy(() =>
  import('./components/DungeonsPage').then((m) => ({ default: m.DungeonsPage })),
);
const DimensionsPage = lazy(() =>
  import('./components/DimensionsPage').then((m) => ({ default: m.DimensionsPage })),
);
const JobsPage = lazy(() => import('./components/JobsPage').then((m) => ({ default: m.JobsPage })));
const AdvancementsPage = lazy(() =>
  import('./components/AdvancementsPage').then((m) => ({ default: m.AdvancementsPage })),
);

function ViewFallback() {
  const { t } = useTranslation('common');
  return (
    <div className="view-loading muted" role="status">
      {t('actions.loading')}
    </div>
  );
}

export default function App() {
  const { t } = useTranslation('common');
  const project = useProjectStore((s) => s.project);
  const setProject = useProjectStore((s) => s.setProject);
  const updateQuest = useProjectStore((s) => s.updateQuest);
  const addCustomItem = useProjectStore((s) => s.addCustomItem);
  const deleteCustomItem = useProjectStore((s) => s.deleteCustomItem);
  const duplicateCustomItem = useProjectStore((s) => s.duplicateCustomItem);
  const addCustomMob = useProjectStore((s) => s.addCustomMob);
  const deleteCustomMob = useProjectStore((s) => s.deleteCustomMob);
  const duplicateCustomMob = useProjectStore((s) => s.duplicateCustomMob);
  const addDungeon = useProjectStore((s) => s.addDungeon);
  const deleteDungeon = useProjectStore((s) => s.deleteDungeon);
  const duplicateDungeon = useProjectStore((s) => s.duplicateDungeon);
  const addRoom = useProjectStore((s) => s.addRoom);
  const deleteRoom = useProjectStore((s) => s.deleteRoom);
  const addDimension = useProjectStore((s) => s.addDimension);
  const deleteDimension = useProjectStore((s) => s.deleteDimension);
  const duplicateDimension = useProjectStore((s) => s.duplicateDimension);
  const addTeleportPad = useProjectStore((s) => s.addTeleportPad);
  const deleteTeleportPad = useProjectStore((s) => s.deleteTeleportPad);
  const duplicateTeleportPad = useProjectStore((s) => s.duplicateTeleportPad);
  const addJob = useProjectStore((s) => s.addJob);
  const deleteJob = useProjectStore((s) => s.deleteJob);
  const duplicateJob = useProjectStore((s) => s.duplicateJob);

  const activeView = useUIStore((s) => s.activeView);
  const setActiveView = useUIStore((s) => s.setActiveView);
  const selectedQuestId = useUIStore((s) => s.selectedQuestId);
  const setSelectedQuestId = useUIStore((s) => s.setSelectedQuestId);
  const settingsOpen = useUIStore((s) => s.settingsOpen);
  const helpOpen = useUIStore((s) => s.helpOpen);
  const setHelpOpen = useUIStore((s) => s.setHelpOpen);
  const saveError = useUIStore((s) => s.saveError);
  const setSaveError = useUIStore((s) => s.setSaveError);

  const [theme, setTheme] = useState<Theme>(() => getInitialTheme());
  const issues = useValidation();

  useAutosave();
  useKeyboard();

  // Restore last active view (default: Story Flow).
  useEffect(() => {
    const saved = getSavedView();
    if (saved) setActiveView(saved);
  }, [setActiveView]);

  useEffect(() => {
    saveView(activeView);
  }, [activeView]);

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
      <TopBar
        theme={theme}
        onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
      />

      {saveError && (
        <div className="save-error-banner" role="alert">
          <span>{saveError}</span>
          <button type="button" className="btn small" onClick={() => setSaveError(null)}>
            {t('actions.dismiss')}
          </button>
        </div>
      )}

      {helpOpen && (
        <Suspense fallback={<ViewFallback />}>
          <HelpPanel onClose={() => setHelpOpen(false)} />
        </Suspense>
      )}

      <div className="app-body">
        {showSidebar && <Sidebar />}

        <main className="app-main">
          {activeView === 'editor' && selectedQuest && (
            <Suspense fallback={<ViewFallback />}>
              <QuestEditor
                quest={selectedQuest}
                project={project}
                issues={issues}
                onChange={updateQuest}
                onChangeProject={setProject}
              />
            </Suspense>
          )}

          {activeView === 'editor' && !selectedQuest && (
            <div className="empty-editor">
              <div className="empty-editor-icon" aria-hidden>
                📋
              </div>
              <p>{t('editor.emptyState')}</p>
            </div>
          )}

          {activeView === 'flow' && (
            <Suspense fallback={<ViewFallback />}>
              <FlowCanvas
                project={project}
                issues={issues}
                onChangeQuest={updateQuest}
                onChangeProject={setProject}
                selectedId={selectedQuest?.id ?? ''}
                onSelect={setSelectedQuestId}
              />
            </Suspense>
          )}

          {activeView === 'items' && (
            <Suspense fallback={<ViewFallback />}>
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
            </Suspense>
          )}

          {activeView === 'mobs' && (
            <Suspense fallback={<ViewFallback />}>
              <div className="content">
                <div className="content-inner">
                  <CustomMobsPage
                    project={project}
                    onChange={setProject}
                    onAdd={() => {
                      addCustomMob();
                    }}
                    onDuplicate={duplicateCustomMob}
                    onDelete={deleteCustomMob}
                  />
                </div>
              </div>
            </Suspense>
          )}

          {activeView === 'dungeons' && (
            <Suspense fallback={<ViewFallback />}>
              <div className="content">
                <div className="content-inner">
                  <DungeonsPage
                    project={project}
                    issues={issues}
                    onChange={setProject}
                    onAdd={() => {
                      addDungeon();
                    }}
                    onDuplicate={duplicateDungeon}
                    onDelete={deleteDungeon}
                    onAddRoom={(dungeonId) => {
                      addRoom(dungeonId);
                    }}
                    onDeleteRoom={deleteRoom}
                  />
                </div>
              </div>
            </Suspense>
          )}

          {activeView === 'dimensions' && (
            <Suspense fallback={<ViewFallback />}>
              <div className="content">
                <div className="content-inner">
                  <DimensionsPage
                    project={project}
                    issues={issues}
                    onChange={setProject}
                    onAddDimension={addDimension}
                    onDuplicateDimension={duplicateDimension}
                    onDeleteDimension={deleteDimension}
                    onAddPad={addTeleportPad}
                    onDuplicatePad={duplicateTeleportPad}
                    onDeletePad={deleteTeleportPad}
                  />
                </div>
              </div>
            </Suspense>
          )}

          {activeView === 'jobs' && (
            <Suspense fallback={<ViewFallback />}>
              <div className="content">
                <div className="content-inner">
                  <JobsPage
                    project={project}
                    issues={issues}
                    onChange={setProject}
                    onAdd={() => {
                      addJob();
                    }}
                    onDuplicate={duplicateJob}
                    onDelete={deleteJob}
                  />
                </div>
              </div>
            </Suspense>
          )}

          {activeView === 'advancements' && (
            <Suspense fallback={<ViewFallback />}>
              <div className="content">
                <div className="content-inner">
                  <AdvancementsPage project={project} />
                </div>
              </div>
            </Suspense>
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
            <Suspense fallback={<ViewFallback />}>
              <div className="content">
                <ExportPanel />
              </div>
            </Suspense>
          )}
        </main>
      </div>

      {settingsOpen && <SettingsDialog />}
      <CommandPalette />
    </div>
  );
}
