import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { saveProject } from '../state/projectStore';
import { useUIStore } from '../store/uiStore';
import { useProjectStore } from '../store/useProjectStore';

const DEBOUNCE_MS = 500;

/** Persist project to localStorage with debouncing. */
export function useAutosave(): void {
  const { t } = useTranslation('common');
  const project = useProjectStore((s) => s.project);
  const setSaveError = useUIStore((s) => s.setSaveError);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (saveProject(project)) {
        setSaveError(null);
      } else {
        setSaveError(t('saveError'));
      }
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [project, setSaveError, t]);
}
