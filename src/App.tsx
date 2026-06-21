import { useEffect, useMemo, useState } from 'react';
import {
  type Project,
  type Quest,
  type WizardStep,
  WIZARD_STEPS,
} from './types/quest';
import { createQuest } from './types/factory';
import {
  addQuest,
  deleteQuest,
  duplicateQuest,
  exportProjectJson,
  importProjectJson,
  loadProject,
  renameQuestReferences,
  saveProject,
  updateQuest,
  createAndAddCustomItem,
  deleteCustomItem,
  duplicateCustomItem,
} from './state/projectStore';
import { ProjectSidebar } from './components/ProjectSidebar';
import { StepNPC } from './components/steps/StepNPC';
import { StepQuest } from './components/steps/StepQuest';
import { StepRewards } from './components/steps/StepRewards';
import { StepChain } from './components/steps/StepChain';
import { StepGenerate } from './components/steps/StepGenerate';
import { CommandsPage } from './components/CommandsPage';
import { ItemsPage } from './components/ItemsPage';
import { FlowCanvas } from './components/flow/FlowCanvas';
import { HelpPanel } from './components/HelpPanel';
import { QuestChecklist } from './components/QuestChecklist';
import { type CustomItemKind } from './types/item';
import { type Theme, getInitialTheme, applyTheme } from './state/theme';

type View = 'wizard' | 'flow' | 'commands' | 'items';

const VIEW_HINTS: Record<View, string> = {
  wizard: 'Edit one quest step by step',
  flow: 'See and connect all your quests',
  commands: 'Admin commands reference',
  items: 'Create custom items for rewards and objectives',
};

const STEP_LABELS: Record<WizardStep, string> = {
  npc: 'NPC',
  quest: 'Quest',
  rewards: 'Rewards',
  chain: 'Chain',
  generate: 'Generate',
};

export default function App() {
  const [project, setProjectState] = useState<Project>(() => loadProject());
  const [selectedId, setSelectedId] = useState<string>(() => project.quests[0]?.id ?? '');
  const [step, setStep] = useState<WizardStep>('npc');
  const [view, setView] = useState<View>('wizard');
  const [theme, setTheme] = useState<Theme>(() => getInitialTheme());
  const [showHelp, setShowHelp] = useState(false);
  const [hintDismissed, setHintDismissed] = useState(false);

  // Auto-save to localStorage whenever the project changes.
  useEffect(() => {
    saveProject(project);
  }, [project]);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const selectedQuest = useMemo(
    () => project.quests.find((q) => q.id === selectedId) ?? project.quests[0],
    [project, selectedId],
  );

  function setProject(next: Project) {
    setProjectState(next);
  }

  function handleQuestChange(updated: Quest) {
    const previous = project.quests.find((q) => q.id === updated.id);
    let next = updateQuest(project, updated);
    if (previous && previous.name !== updated.name) {
      next = renameQuestReferences(next, previous.name, updated.name);
    }
    setProject(next);
  }

  function handleAddQuest() {
    const quest = createQuest(`Quest ${project.quests.length + 1}`);
    setProject(addQuest(project, quest));
    setSelectedId(quest.id);
    setStep('npc');
  }

  function handleDuplicate(id: string) {
    const next = duplicateQuest(project, id);
    setProject(next);
    const idx = next.quests.findIndex((q) => q.id === id);
    if (idx >= 0 && next.quests[idx + 1]) setSelectedId(next.quests[idx + 1].id);
  }

  function handleDelete(id: string) {
    if (project.quests.length <= 1) {
      alert('A project needs at least one quest.');
      return;
    }
    const next = deleteQuest(project, id);
    setProject(next);
    if (selectedId === id) setSelectedId(next.quests[0]?.id ?? '');
  }

  function handleExport() {
    const blob = new Blob([exportProjectJson(project)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'project'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImport(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = importProjectJson(String(reader.result));
        setProject(imported);
        setSelectedId(imported.quests[0]?.id ?? '');
        setStep('npc');
      } catch (err) {
        alert(`Could not import project: ${(err as Error).message}`);
      }
    };
    reader.readAsText(file);
  }

  function handleAddCustomItem(kind: CustomItemKind) {
    const { project: next } = createAndAddCustomItem(project, kind);
    setProject(next);
    setView('items');
  }

  function handleDeleteCustomItem(id: string) {
    setProject(deleteCustomItem(project, id));
  }

  function handleDuplicateCustomItem(id: string) {
    setProject(duplicateCustomItem(project, id));
  }

  const stepIndex = WIZARD_STEPS.indexOf(step);

  return (
    <div className="app">
      <ProjectSidebar
        project={project}
        selectedId={selectedQuest?.id ?? ''}
        onSelect={setSelectedId}
        onAdd={handleAddQuest}
        onDuplicate={handleDuplicate}
        onDelete={handleDelete}
        onRenameProject={(name) => setProject({ ...project, name })}
        onNamespace={(namespace) => setProject({ ...project, namespace })}
        onPlatform={(platform) => setProject({ ...project, platform })}
        onExport={handleExport}
        onImport={handleImport}
      />

      <div className="main">
        <div className="topnav">
          <div className="topnav-tabs">
            <button
              className={`view-tab ${view === 'wizard' ? 'active' : ''}`}
              onClick={() => setView('wizard')}
              title={VIEW_HINTS.wizard}
            >
              Quest Builder
            </button>
            <button
              className={`view-tab ${view === 'flow' ? 'active' : ''}`}
              onClick={() => setView('flow')}
              title={VIEW_HINTS.flow}
            >
              Story Flow
            </button>
            <button
              className={`view-tab ${view === 'commands' ? 'active' : ''}`}
              onClick={() => setView('commands')}
              title={VIEW_HINTS.commands}
            >
              In-Game Commands
            </button>
            <button
              className={`view-tab ${view === 'items' ? 'active' : ''}`}
              onClick={() => setView('items')}
              title={VIEW_HINTS.items}
            >
              Custom Items
            </button>
            <span className="topnav-hint">{VIEW_HINTS[view]}</span>
          </div>

          <div className="topnav-controls">
            <button
              className="icon-btn"
              onClick={() => setShowHelp((v) => !v)}
              title="Help &amp; getting started"
            >
              {showHelp ? 'Close help' : '? Help'}
            </button>
            <button
              className="icon-btn"
              onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
              title="Toggle light / dark theme"
            >
              {theme === 'dark' ? 'Light mode' : 'Dark mode'}
            </button>
          </div>
        </div>

        {showHelp && <HelpPanel onClose={() => setShowHelp(false)} />}

        {view === 'wizard' && (
          <div className="steps">
            {WIZARD_STEPS.map((s, i) => (
              <button
                key={s}
                className={`step-tab ${s === step ? 'active' : ''}`}
                onClick={() => setStep(s)}
              >
                <span className="num">{i + 1}</span>
                {STEP_LABELS[s]}
              </button>
            ))}
          </div>
        )}

        {view === 'flow' && (
          <FlowCanvas
            project={project}
            onChangeQuest={handleQuestChange}
            onChangeProject={setProject}
            selectedId={selectedQuest?.id ?? ''}
            onSelect={setSelectedId}
          />
        )}

        {view !== 'flow' && (
        <div className="content">
          <div className="content-inner">
            {view === 'wizard' &&
              !hintDismissed &&
              project.quests.length === 1 &&
              project.quests[0].name === 'Første quest' && (
                <div className="getting-started">
                  <div>
                    <strong>New here?</strong> Fill in the steps below for this quest, then open{' '}
                    <em>Generate</em> to download your datapack. Use the{' '}
                    <strong>? Help</strong> button up top anytime.
                  </div>
                  <button className="icon-btn" onClick={() => setHintDismissed(true)} title="Dismiss">
                    Dismiss
                  </button>
                </div>
              )}

            {view === 'commands' && <CommandsPage project={project} />}

            {view === 'items' && (
              <ItemsPage
                project={project}
                onChange={setProject}
                onAdd={handleAddCustomItem}
                onDuplicate={handleDuplicateCustomItem}
                onDelete={handleDeleteCustomItem}
              />
            )}

            {view === 'wizard' && selectedQuest && step !== 'generate' && (
              <QuestChecklist project={project} quest={selectedQuest} />
            )}

            {view === 'wizard' && selectedQuest && step === 'npc' && (
              <StepNPC quest={selectedQuest} onChange={handleQuestChange} />
            )}
            {view === 'wizard' && selectedQuest && step === 'quest' && (
              <StepQuest
                quest={selectedQuest}
                customItems={project.customItems ?? []}
                onChange={handleQuestChange}
              />
            )}
            {view === 'wizard' && selectedQuest && step === 'rewards' && (
              <StepRewards
                quest={selectedQuest}
                platform={project.platform}
                customItems={project.customItems ?? []}
                onChange={handleQuestChange}
              />
            )}
            {view === 'wizard' && selectedQuest && step === 'chain' && (
              <StepChain
                quest={selectedQuest}
                project={project}
                onChange={handleQuestChange}
              />
            )}
            {view === 'wizard' && step === 'generate' && <StepGenerate project={project} />}

            {view === 'wizard' && step !== 'generate' && (
              <div className="footer-nav">
                <button
                  className="btn ghost"
                  disabled={stepIndex === 0}
                  onClick={() => setStep(WIZARD_STEPS[Math.max(0, stepIndex - 1)])}
                >
                  Back
                </button>
                <button
                  className="btn primary"
                  onClick={() => setStep(WIZARD_STEPS[Math.min(WIZARD_STEPS.length - 1, stepIndex + 1)])}
                >
                  Next: {STEP_LABELS[WIZARD_STEPS[stepIndex + 1]]}
                </button>
              </div>
            )}
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
