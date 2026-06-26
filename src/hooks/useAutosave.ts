import { useEffect } from 'react';
import { saveProject } from '../state/projectStore';
import { useProjectStore } from '../store/useProjectStore';

const DEBOUNCE_MS = 500;

/** Persist project to localStorage with debouncing. */
export function useAutosave(): void {
  const project = useProjectStore((s) => s.project);

  useEffect(() => {
    const timer = window.setTimeout(() => saveProject(project), DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [project]);
}
