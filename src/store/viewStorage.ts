import { type ActiveView } from './uiStore';

const STORAGE_KEY = 'quest-tool-active-view';

const VALID_VIEWS: ActiveView[] = [
  'editor',
  'flow',
  'items',
  'jobs',
  'advancements',
  'commands',
  'export',
];

export function getSavedView(): ActiveView | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && VALID_VIEWS.includes(stored as ActiveView)) {
      return stored as ActiveView;
    }
  } catch {
    // ignore
  }
  return null;
}

export function saveView(view: ActiveView): void {
  try {
    localStorage.setItem(STORAGE_KEY, view);
  } catch {
    // ignore
  }
}
