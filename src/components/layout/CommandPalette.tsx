import { useEffect, useMemo, useRef, useState } from 'react';
import { type ActiveView, useUIStore } from '../../store/uiStore';
import { useProjectStore } from '../../store/useProjectStore';

const VIEW_LABELS: Record<ActiveView, string> = {
  editor: 'Open Editor',
  flow: 'Open Story Flow',
  items: 'Open Custom Items',
  jobs: 'Open Jobs',
  advancements: 'Open Advancements',
  commands: 'Open Commands',
  export: 'Open Export',
};

export function CommandPalette() {
  const open = useUIStore((s) => s.commandPaletteOpen);
  const setOpen = useUIStore((s) => s.setCommandPaletteOpen);
  const setActiveView = useUIStore((s) => s.setActiveView);
  const setSelectedQuestId = useUIStore((s) => s.setSelectedQuestId);
  const setSettingsOpen = useUIStore((s) => s.setSettingsOpen);
  const project = useProjectStore((s) => s.project);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      window.setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  const actions = useMemo(() => {
    const q = query.trim().toLowerCase();
    const items: { id: string; label: string; group: string; run: () => void }[] = [];

    for (const [view, label] of Object.entries(VIEW_LABELS) as [ActiveView, string][]) {
      if (!q || label.toLowerCase().includes(q) || view.includes(q)) {
        items.push({
          id: `view-${view}`,
          label,
          group: 'Views',
          run: () => {
            setActiveView(view);
            setOpen(false);
          },
        });
      }
    }

    for (const quest of project.quests) {
      const name = quest.name || 'Untitled quest';
      if (!q || name.toLowerCase().includes(q)) {
        items.push({
          id: `quest-${quest.id}`,
          label: `Edit quest: ${name}`,
          group: 'Quests',
          run: () => {
            setSelectedQuestId(quest.id);
            setActiveView('editor');
            setOpen(false);
          },
        });
      }
    }

    for (const job of project.jobs ?? []) {
      const name = job.name || 'Untitled job';
      if (!q || name.toLowerCase().includes(q) || 'job'.includes(q)) {
        items.push({
          id: `job-${job.id}`,
          label: `Edit job: ${name}`,
          group: 'Jobs',
          run: () => {
            setActiveView('jobs');
            setOpen(false);
          },
        });
      }
    }

    if (!q || 'settings'.includes(q) || 'import'.includes(q)) {
      items.push({
        id: 'settings',
        label: 'Open project settings',
        group: 'Actions',
        run: () => {
          setSettingsOpen(true);
          setOpen(false);
        },
      });
    }

    if (!q || 'export'.includes(q) || 'download'.includes(q)) {
      items.push({
        id: 'export',
        label: 'Go to Export',
        group: 'Actions',
        run: () => {
          setActiveView('export');
          setOpen(false);
        },
      });
    }

    return items;
  }, [query, project.quests, project.jobs, setActiveView, setOpen, setSelectedQuestId, setSettingsOpen]);

  if (!open) return null;

  return (
    <div
      className="dialog-overlay command-palette-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
      onClick={() => setOpen(false)}
    >
      <div className="command-palette" onClick={(e) => e.stopPropagation()}>
        <input
          ref={inputRef}
          className="command-palette-input"
          placeholder="Search quests, views, actions…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setOpen(false);
            if (e.key === 'Enter' && actions[0]) actions[0].run();
          }}
          aria-label="Command search"
        />
        <div className="command-palette-list" role="listbox">
          {actions.length === 0 && (
            <div className="command-palette-empty muted">No matching commands</div>
          )}
          {actions.map((action) => (
            <button
              key={action.id}
              type="button"
              className="command-palette-item"
              onClick={action.run}
            >
              <span className="command-palette-group">{action.group}</span>
              {action.label}
            </button>
          ))}
        </div>
        <div className="command-palette-hint muted">
          <kbd>Ctrl</kbd>+<kbd>K</kbd> to open · <kbd>Esc</kbd> to close
        </div>
      </div>
    </div>
  );
}
