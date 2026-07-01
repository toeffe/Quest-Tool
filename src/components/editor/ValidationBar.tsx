import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { ValidationIssue } from '../../generator/validate';

interface Props {
  issues: ValidationIssue[];
}

/** Inline per-quest issue list at the bottom of the editor. */
export function ValidationBar({ issues }: Props) {
  const errors = issues.filter((i) => i.level === 'error');
  const warnings = issues.filter((i) => i.level === 'warning');

  if (errors.length === 0 && warnings.length === 0) return null;

  return (
    <div
      className={`validation-bar ${errors.length > 0 ? 'has-errors' : 'has-warnings'}`}
      role="status"
      aria-live="polite"
    >
      {errors.map((issue) => (
        <div
          key={`e-${issue.questId ?? 'p'}-${issue.field ?? 'f'}-${issue.message}`}
          className="validation-bar-item error"
        >
          <span aria-hidden>✕</span>
          <span>{issue.message}</span>
        </div>
      ))}
      {warnings.map((issue) => (
        <div
          key={`w-${issue.questId ?? 'p'}-${issue.field ?? 'f'}-${issue.message}`}
          className="validation-bar-item warning"
        >
          <span aria-hidden>⚠</span>
          <span>{issue.message}</span>
        </div>
      ))}
    </div>
  );
}

/** Map validation issues to editor tabs for dot indicators. */
export function issueMatchesTab(
  issue: ValidationIssue,
  tab: 'objectives' | 'npc' | 'rewards' | 'chain',
): boolean {
  const field = issue.field ?? '';
  const msg = issue.message.toLowerCase();

  switch (tab) {
    case 'objectives':
      return (
        field.startsWith('objectives') ||
        field === 'name' ||
        msg.includes('objective') ||
        msg.includes('empty name') ||
        msg.includes('duplicate quest name')
      );
    case 'npc':
      return (
        field.startsWith('npc') ||
        field.startsWith('targetNpc') ||
        msg.includes('npc') ||
        msg.includes('quest giver') ||
        msg.includes('target npc') ||
        msg.includes('spawn')
      );
    case 'rewards':
      return field.startsWith('rewards') || msg.includes('reward');
    case 'chain':
      return field.startsWith('chain') || msg.includes('chain');
    default:
      return false;
  }
}

export type EditorTab = 'objectives' | 'npc' | 'rewards' | 'chain';

export function useEditorTabs(): { id: EditorTab; label: string }[] {
  const { t } = useTranslation('editor');
  return useMemo(
    () => [
      { id: 'objectives', label: t('tabs.objectives') },
      { id: 'npc', label: t('tabs.npc') },
      { id: 'rewards', label: t('tabs.rewards') },
      { id: 'chain', label: t('tabs.chain') },
    ],
    [t],
  );
}
