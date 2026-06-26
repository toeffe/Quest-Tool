import { type ActiveView, useUIStore } from '../../store/uiStore';
import { useValidation } from '../../hooks/useValidation';
import { hasBlockingErrors } from '../../generator/validate';
import { useProject } from '../../store/useProjectStore';
import { PLATFORM_LABELS } from '../../types/quest';

const VIEWS: { id: ActiveView; label: string }[] = [
  { id: 'editor', label: 'Editor' },
  { id: 'flow', label: 'Story flow' },
  { id: 'items', label: 'Custom items' },
  { id: 'commands', label: 'Commands' },
  { id: 'export', label: 'Export' },
];

interface Props {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export function TopBar({ theme, onToggleTheme }: Props) {
  const project = useProject();
  const activeView = useUIStore((s) => s.activeView);
  const setActiveView = useUIStore((s) => s.setActiveView);
  const setSettingsOpen = useUIStore((s) => s.setSettingsOpen);
  const setHelpOpen = useUIStore((s) => s.setHelpOpen);
  const helpOpen = useUIStore((s) => s.helpOpen);
  const issues = useValidation();
  const exportBlocked = hasBlockingErrors(issues);

  return (
    <header className="topbar">
      <div className="topbar-brand">
        <span className="topbar-logo" aria-hidden>
          ⚔
        </span>
        <span className="topbar-project-name" title={project.name}>
          {project.name}
        </span>
        <span className="badge platform">{PLATFORM_LABELS[project.platform]}</span>
      </div>

      <nav className="topbar-nav" aria-label="Main views">
        {VIEWS.map((v) => (
          <button
            key={v.id}
            type="button"
            className={`topbar-tab ${activeView === v.id ? 'active' : ''}`}
            onClick={() => setActiveView(v.id)}
          >
            {v.label}
            {v.id === 'export' && exportBlocked && (
              <span className="topbar-tab-dot error" aria-label="Export blocked by errors" />
            )}
          </button>
        ))}
      </nav>

      <div className="topbar-actions">
        <button
          type="button"
          className="icon-btn"
          onClick={() => setHelpOpen(!helpOpen)}
          title="Help"
        >
          {helpOpen ? 'Close help' : '? Help'}
        </button>
        <button
          type="button"
          className="icon-btn"
          onClick={onToggleTheme}
          title="Toggle light / dark theme"
        >
          {theme === 'dark' ? 'Light' : 'Dark'}
        </button>
        <button
          type="button"
          className="icon-btn"
          onClick={() => setSettingsOpen(true)}
          title="Project settings (namespace, platform, import)"
        >
          Settings
        </button>
      </div>
    </header>
  );
}
