import { useState } from 'react';
import { type Project, type Quest } from '../../types/quest';
import { type ValidationIssue } from '../../generator/validate';
import { StepNPC } from '../steps/StepNPC';
import { StepQuest } from '../steps/StepQuest';
import { StepRewards } from '../steps/StepRewards';
import { StepChain } from '../steps/StepChain';
import {
  ValidationBar,
  EDITOR_TABS,
  issueMatchesTab,
  type EditorTab,
} from './ValidationBar';

interface Props {
  quest: Quest;
  project: Project;
  issues: ValidationIssue[];
  onChange: (quest: Quest) => void;
  /** Compact mode for flow inspector (no outer flex shell). */
  compact?: boolean;
}

export function QuestEditor({ quest, project, issues, onChange, compact }: Props) {
  const [tab, setTab] = useState<EditorTab>('objectives');
  const questIssues = issues.filter((i) => i.questId === quest.id);

  const body = (
    <>
      <div className="quest-editor-tabs" role="tablist">
        {EDITOR_TABS.map(({ id, label }) => {
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
              onClick={() => setTab(id)}
            >
              {label}
              {hasError && <span className="validation-dot error" aria-label="Has errors" />}
              {!hasError && hasWarning && (
                <span className="validation-dot warning" aria-label="Has warnings" />
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
          <StepChain quest={quest} project={project} onChange={onChange} />
        )}
      </div>

      <ValidationBar issues={questIssues} />
    </>
  );

  if (compact) return <div className="quest-editor quest-editor-compact">{body}</div>;

  return <div className="quest-editor">{body}</div>;
}
