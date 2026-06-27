import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type Project, type Quest } from '../../types/quest';
import { type ValidationIssue } from '../../generator/validate';
import { StepNPC } from '../steps/StepNPC';
import { StepQuest } from '../steps/StepQuest';
import { StepRewards } from '../steps/StepRewards';
import { StepChain } from '../steps/StepChain';
import {
  ValidationBar,
  useEditorTabs,
  issueMatchesTab,
  type EditorTab,
} from './ValidationBar';

interface Props {
  quest: Quest;
  project: Project;
  issues: ValidationIssue[];
  onChange: (quest: Quest) => void;
  onChangeProject?: (project: Project) => void;
  /** Compact mode for flow inspector (no outer flex shell). */
  compact?: boolean;
  /** Open a specific tab (flow inspector step click). */
  initialTab?: EditorTab;
  onTabChange?: (tab: EditorTab) => void;
}

export function QuestEditor({
  quest,
  project,
  issues,
  onChange,
  onChangeProject,
  compact,
  initialTab,
  onTabChange,
}: Props) {
  const { t } = useTranslation('common');
  const editorTabs = useEditorTabs();
  const [tab, setTab] = useState<EditorTab>(initialTab ?? 'objectives');

  useEffect(() => {
    if (initialTab) setTab(initialTab);
  }, [initialTab, quest.id]);
  const questIssues = issues.filter((i) => i.questId === quest.id);

  const body = (
    <>
      <div className="quest-editor-tabs" role="tablist">
        {editorTabs.map(({ id, label }) => {
          const tabIssues = questIssues.filter((i) => issueMatchesTab(i, id));
          const hasError = tabIssues.some((i) => i.level === 'error');
          const hasWarning = tabIssues.some((i) => i.level === 'warning');
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              className={`quest-editor-tab ${tab === id ? 'active' : ''}`}
              onClick={() => {
                setTab(id);
                onTabChange?.(id);
              }}
            >
              {label}
              {hasError && <span className="validation-dot error" aria-label={t('validation.hasErrors')} />}
              {!hasError && hasWarning && (
                <span className="validation-dot warning" aria-label={t('validation.hasWarnings')} />
              )}
            </button>
          );
        })}
      </div>

      <div className="quest-editor-body" role="tabpanel">
        {tab === 'objectives' && (
          <StepQuest
            quest={quest}
            customItems={project.customItems ?? []}
            onChange={onChange}
          />
        )}
        {tab === 'npc' && <StepNPC quest={quest} onChange={onChange} />}
        {tab === 'rewards' && (
          <StepRewards
            quest={quest}
            platform={project.platform}
            customItems={project.customItems ?? []}
            jobs={project.jobs ?? []}
            onChange={onChange}
          />
        )}
        {tab === 'chain' && (
          <StepChain
            quest={quest}
            project={project}
            onChange={onChange}
            onChangeProject={onChangeProject}
            canvasFirst={compact}
          />
        )}
      </div>

      <ValidationBar issues={questIssues} />
    </>
  );

  if (compact) return <div className="quest-editor quest-editor-compact">{body}</div>;

  return <div className="quest-editor">{body}</div>;
}
