import { useEffect } from 'react';
import { useUIStore } from '../store/uiStore';
import { getFlowShortcuts } from './flowShortcuts';

interface ShortcutHandlers {
  onExport?: () => void;
}

/** Global keyboard shortcuts: Cmd/Ctrl+K palette, Cmd/Ctrl+E export, flow shortcuts when active. */
export function useKeyboard({ onExport }: ShortcutHandlers = {}): void {
  const setCommandPaletteOpen = useUIStore((s) => s.setCommandPaletteOpen);
  const setActiveView = useUIStore((s) => s.setActiveView);
  const activeView = useUIStore((s) => s.activeView);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;
      const shift = e.shiftKey;
      const target = e.target as HTMLElement | null;
      const typing =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);

      if (mod && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
      if (mod && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        setActiveView('export');
        onExport?.();
      }

      if (activeView === 'flow' && !typing) {
        const flow = getFlowShortcuts();
        if (mod && shift && e.key.toLowerCase() === 'a') {
          e.preventDefault();
          flow?.onAutoArrange?.();
        }
        if (mod && shift && e.key.toLowerCase() === 'f') {
          e.preventDefault();
          flow?.onFitView?.();
        }
        if (mod && shift && e.key.toLowerCase() === 'e') {
          e.preventDefault();
          flow?.onNextError?.();
        }
      }

      if (e.key === 'Escape') {
        if (activeView === 'flow' && getFlowShortcuts()?.onEscape?.()) {
          e.preventDefault();
          return;
        }
        setCommandPaletteOpen(false);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [setCommandPaletteOpen, setActiveView, onExport, activeView]);
}
