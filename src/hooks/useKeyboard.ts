import { useEffect } from 'react';
import { useUIStore } from '../store/uiStore';

interface ShortcutHandlers {
  onExport?: () => void;
}

/** Global keyboard shortcuts: Cmd/Ctrl+K palette, Cmd/Ctrl+E export view. */
export function useKeyboard({ onExport }: ShortcutHandlers = {}): void {
  const setCommandPaletteOpen = useUIStore((s) => s.setCommandPaletteOpen);
  const setActiveView = useUIStore((s) => s.setActiveView);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
      if (mod && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        setActiveView('export');
        onExport?.();
      }
      if (e.key === 'Escape') {
        setCommandPaletteOpen(false);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [setCommandPaletteOpen, setActiveView, onExport]);
}
