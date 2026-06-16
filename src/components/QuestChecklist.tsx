import { useMemo } from 'react';
import { type Project, type Quest } from '../types/quest';
import { validateProject } from '../generator/validate';

interface Props {
  project: Project;
  quest: Quest;
}

/**
 * Live "what's missing" panel for a single quest. Surfaces the same checks the
 * Generate step runs, so problems are visible while editing instead of only at
 * export time.
 */
export function QuestChecklist({ project, quest }: Props) {
  const issues = useMemo(
    () => validateProject(project).filter((i) => i.questId === quest.id),
    [project, quest.id],
  );

  const errors = issues.filter((i) => i.level === 'error');
  const warnings = issues.filter((i) => i.level === 'warning');

  return (
    <div className="checklist">
      <div className="row-between" style={{ marginBottom: errors.length || warnings.length ? 10 : 0 }}>
        <strong className="checklist-title">This quest</strong>
        {errors.length === 0 ? (
          <span className="badge ok">Ready</span>
        ) : (
          <span className="badge error">{errors.length} to fix</span>
        )}
      </div>

      {issues.length === 0 && (
        <div className="muted" style={{ fontSize: 13 }}>
          No problems. This quest is ready to generate.
        </div>
      )}

      {issues.map((issue, i) => (
        <div key={i} className="checklist-item">
          <span className={`badge ${issue.level}`}>{issue.level}</span>
          <span style={{ fontSize: 13 }}>{issue.message}</span>
        </div>
      ))}
    </div>
  );
}
