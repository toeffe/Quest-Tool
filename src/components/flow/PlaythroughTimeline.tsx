import { memo, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ValidationIssue } from '../../generator/validate';
import type { Project, Quest } from '../../types/quest';
import { issueMatchesTab } from '../editor/ValidationBar';
import { QuestPreview } from '../preview/QuestPreview';
import { buildQuestPlaythrough, type PlaythroughStep } from './questPlaythrough';

const ICON_CHARS: Record<string, string> = {
  lock: '🔒',
  meet: '💬',
  accept: '✓',
  fight: '⚔',
  task: '◎',
  travel: '📍',
  return: '↩',
  complete: '★',
  reward: '🎁',
  next: '→',
  cooldown: '⏱',
};

type StepHealth = 'ok' | 'warning' | 'error';

function stepHealth(issues: ValidationIssue[], step: PlaythroughStep): StepHealth {
  const tabIssues = issues.filter((i) => issueMatchesTab(i, step.editorTab));
  if (tabIssues.some((i) => i.level === 'error')) return 'error';
  if (tabIssues.some((i) => i.level === 'warning')) return 'warning';
  return 'ok';
}

interface Props {
  quest: Quest;
  project: Project;
  issues: ValidationIssue[];
  selectedStepId?: string;
  onOpenStep: (questId: string, step: PlaythroughStep) => void;
}

export const PlaythroughTimeline = memo(function PlaythroughTimeline({
  quest,
  project,
  issues,
  selectedStepId,
  onOpenStep,
}: Props) {
  const { t } = useTranslation('flow');
  const steps = useMemo(() => buildQuestPlaythrough(quest, project), [quest, project]);
  const objectiveSteps = steps.filter((s) => s.kind === 'objective' || s.kind === 'travel');
  const [objectivesExpanded, setObjectivesExpanded] = useState(false);
  const [previewStep, setPreviewStep] = useState<PlaythroughStep | null>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const collapseObjectives = objectiveSteps.length > 2 && !objectivesExpanded;

  const visibleSteps = useMemo(() => {
    if (!collapseObjectives) return steps;
    const firstObjectiveIdx = steps.findIndex((s) => s.kind === 'objective' || s.kind === 'travel');
    if (firstObjectiveIdx < 0) return steps;
    const lastObjectiveIdx = (() => {
      for (let i = steps.length - 1; i >= 0; i--) {
        if (steps[i].kind === 'objective' || steps[i].kind === 'travel') return i;
      }
      return -1;
    })();
    const hidden = lastObjectiveIdx - firstObjectiveIdx;
    if (hidden <= 0) return steps;
    const collapsed: PlaythroughStep = {
      id: `${quest.id}-objectives-collapsed`,
      kind: 'objective',
      label: t('questNode.moreObjectives', { count: hidden }),
      editorTab: 'objectives',
      icon: 'task',
    };
    return [
      ...steps.slice(0, firstObjectiveIdx + 1),
      collapsed,
      ...steps.slice(lastObjectiveIdx + 1),
    ];
  }, [steps, collapseObjectives, quest.id, t]);

  const clearHoverTimer = () => {
    if (hoverTimer.current) {
      clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }
  };

  const onStepMouseEnter = (step: PlaythroughStep) => {
    if (step.kind !== 'meet' && step.kind !== 'accept') return;
    clearHoverTimer();
    hoverTimer.current = setTimeout(() => setPreviewStep(step), 400);
  };

  const onStepMouseLeave = () => {
    clearHoverTimer();
    setPreviewStep(null);
  };

  return (
    <ol className="flow-playthrough" aria-label={t('questNode.playthroughAria')}>
      {visibleSteps.map((step, index) => {
        const isCollapsedRow = step.id.endsWith('-objectives-collapsed');
        const health = stepHealth(issues, step);
        const active = selectedStepId === step.id;
        const showPreview = previewStep?.id === step.id;

        return (
          <li key={step.id} className={`flow-playthrough-step ${active ? 'active' : ''}`}>
            {index > 0 && <span className="flow-playthrough-connector" aria-hidden />}
            <button
              type="button"
              className="flow-playthrough-btn"
              title={step.detail ? `${step.label} — ${step.detail}` : step.label}
              onMouseEnter={() => onStepMouseEnter(step)}
              onMouseLeave={onStepMouseLeave}
              onClick={(e) => {
                e.stopPropagation();
                if (isCollapsedRow) {
                  setObjectivesExpanded(true);
                  return;
                }
                onOpenStep(quest.id, step);
              }}
            >
              <span className="flow-playthrough-icon" aria-hidden>
                {ICON_CHARS[step.icon] ?? '•'}
              </span>
              {!isCollapsedRow && (
                <span className="flow-playthrough-num" aria-hidden>
                  {index + 1}
                </span>
              )}
              <span className={`flow-playthrough-dot ${health}`} aria-hidden />
              <span className="flow-playthrough-label">{step.label}</span>
            </button>
            {showPreview && (step.kind === 'meet' || step.kind === 'accept') && (
              <div className="flow-step-preview" role="tooltip">
                <div className="flow-step-preview-inner">
                  <QuestPreview quest={quest} variant="dialogue" />
                </div>
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
});
