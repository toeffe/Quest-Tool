import { useEffect, useMemo, useState } from 'react';
import { validateProject, type ValidationIssue } from '../generator/validate';
import { useProject } from '../store/useProjectStore';

const DEBOUNCE_MS = 300;

/** Debounced validation results keyed to the current project. */
export function useValidation(): ValidationIssue[] {
  const project = useProject();
  const [issues, setIssues] = useState<ValidationIssue[]>(() => validateProject(project));

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIssues(validateProject(project));
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [project]);

  return issues;
}

/** Issues for a single quest. */
export function useQuestIssues(questId: string): ValidationIssue[] {
  const issues = useValidation();
  return useMemo(() => issues.filter((i) => i.questId === questId), [issues, questId]);
}
