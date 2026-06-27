import { useEffect, useMemo, useState } from 'react';
import { validateProject, type ValidationIssue } from '../generator/validate';
import { useProject } from '../store/useProjectStore';
import { useLocaleStore } from '../store/localeStore';

const DEBOUNCE_MS = 300;

/** Debounced validation results keyed to the current project. */
export function useValidation(): ValidationIssue[] {
  const project = useProject();
  const locale = useLocaleStore((s) => s.locale);
  const [issues, setIssues] = useState<ValidationIssue[]>(() => validateProject(project, locale));

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIssues(validateProject(project, locale));
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [project, locale]);

  return issues;
}

/** Issues for a single quest. */
export function useQuestIssues(questId: string): ValidationIssue[] {
  const issues = useValidation();
  return useMemo(() => issues.filter((i) => i.questId === questId), [issues, questId]);
}
