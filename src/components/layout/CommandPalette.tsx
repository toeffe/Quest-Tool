import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type ActiveView, useUIStore } from '../../store/uiStore';
import { useProjectStore } from '../../store/useProjectStore';

const VIEW_IDS: ActiveView[] = [
  'editor',
  'flow',
  'items',
  'mobs',
  'dungeons',
  'dimensions',
  'containers',
  'jobs',
  'advancements',
  'commands',
  'export',
];

export function CommandPalette() {
  const { t } = useTranslation('common');
  const open = useUIStore((s) => s.commandPaletteOpen);
  const setOpen = useUIStore((s) => s.setCommandPaletteOpen);
  const setActiveView = useUIStore((s) => s.setActiveView);
  const setSelectedQuestId = useUIStore((s) => s.setSelectedQuestId);
  const setDimensionsFocus = useUIStore((s) => s.setDimensionsFocus);
  const setSettingsOpen = useUIStore((s) => s.setSettingsOpen);
  const project = useProjectStore((s) => s.project);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const modKey =
    typeof navigator !== 'undefined' && /Mac|iPhone|iPod|iPad/.test(navigator.platform)
      ? 'Cmd'
      : 'Ctrl';

  useEffect(() => {
    if (open) {
      setQuery('');
      window.setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  const actions = useMemo(() => {
    const q = query.trim().toLowerCase();
    const items: { id: string; label: string; group: string; run: () => void }[] = [];

    for (const view of VIEW_IDS) {
      const label = t(`commandPalette.views.${view}`);
      if (!q || label.toLowerCase().includes(q) || view.includes(q)) {
        items.push({
          id: `view-${view}`,
          label,
          group: t('commandPalette.groups.views'),
          run: () => {
            setActiveView(view);
            setOpen(false);
          },
        });
      }
    }

    for (const quest of project.quests) {
      const name = quest.name || t('sidebar.untitledQuest');
      if (!q || name.toLowerCase().includes(q)) {
        items.push({
          id: `quest-${quest.id}`,
          label: t('commandPalette.editInFlow', { name }),
          group: t('commandPalette.groups.quests'),
          run: () => {
            setSelectedQuestId(quest.id);
            setActiveView('flow');
            setOpen(false);
          },
        });
      }
    }

    for (const job of project.jobs ?? []) {
      const name = job.name || t('commandPalette.untitledJob');
      if (!q || name.toLowerCase().includes(q) || 'job'.includes(q)) {
        items.push({
          id: `job-${job.id}`,
          label: t('commandPalette.editJob', { name }),
          group: t('commandPalette.groups.jobs'),
          run: () => {
            setActiveView('jobs');
            setOpen(false);
          },
        });
      }
    }

    for (const dimension of project.dimensions ?? []) {
      const name = dimension.name || t('commandPalette.untitledDimension');
      if (!q || name.toLowerCase().includes(q) || 'dimension'.includes(q)) {
        items.push({
          id: `dimension-${dimension.id}`,
          label: t('commandPalette.editDimension', { name }),
          group: t('commandPalette.groups.dimensions'),
          run: () => {
            setDimensionsFocus({ kind: 'dimension', id: dimension.id });
            setActiveView('dimensions');
            setOpen(false);
          },
        });
      }
    }

    for (const pad of project.teleportPads ?? []) {
      const name = pad.name || t('commandPalette.untitledPad');
      if (!q || name.toLowerCase().includes(q) || 'pad'.includes(q) || 'teleport'.includes(q)) {
        items.push({
          id: `pad-${pad.id}`,
          label: t('commandPalette.editPad', { name }),
          group: t('commandPalette.groups.pads'),
          run: () => {
            setDimensionsFocus({ kind: 'pad', id: pad.id });
            setActiveView('dimensions');
            setOpen(false);
          },
        });
      }
    }

    for (const container of project.containers ?? []) {
      const name = container.name || t('commandPalette.untitledContainer');
      if (
        !q ||
        name.toLowerCase().includes(q) ||
        'container'.includes(q) ||
        'chest'.includes(q) ||
        'barrel'.includes(q)
      ) {
        items.push({
          id: `container-${container.id}`,
          label: t('commandPalette.editContainer', { name }),
          group: t('commandPalette.groups.containers'),
          run: () => {
            setActiveView('containers');
            setOpen(false);
          },
        });
      }
    }

    if (!q || 'settings'.includes(q) || 'import'.includes(q)) {
      items.push({
        id: 'settings',
        label: t('commandPalette.openSettings'),
        group: t('commandPalette.groups.actions'),
        run: () => {
          setSettingsOpen(true);
          setOpen(false);
        },
      });
    }

    if (!q || 'export'.includes(q) || 'download'.includes(q)) {
      items.push({
        id: 'export',
        label: t('commandPalette.goToExport'),
        group: t('commandPalette.groups.actions'),
        run: () => {
          setActiveView('export');
          setOpen(false);
        },
      });
    }

    return items;
  }, [
    query,
    project.quests,
    project.jobs,
    project.dimensions,
    project.teleportPads,
    project.containers,
    setActiveView,
    setOpen,
    setSelectedQuestId,
    setDimensionsFocus,
    setSettingsOpen,
    t,
  ]);

  if (!open) return null;

  return (
    <div
      className="dialog-overlay command-palette-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={t('commandPalette.ariaLabel')}
      onClick={() => setOpen(false)}
    >
      <div className="command-palette" onClick={(e) => e.stopPropagation()}>
        <input
          ref={inputRef}
          className="command-palette-input"
          placeholder={t('commandPalette.searchPlaceholder')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setOpen(false);
            if (e.key === 'Enter' && actions[0]) actions[0].run();
          }}
          aria-label={t('commandPalette.searchAria')}
        />
        <div className="command-palette-list" role="listbox">
          {actions.length === 0 && (
            <div className="command-palette-empty muted">{t('commandPalette.empty')}</div>
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
          {t('commandPalette.hint', { modKey, kKey: 'K' })}
        </div>
      </div>
    </div>
  );
}
