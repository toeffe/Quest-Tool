import { useTranslation } from 'react-i18next';
import { hasBlockingErrors } from '../../generator/validate';
import { useValidation } from '../../hooks/useValidation';
import { usePlatformLabels } from '../../i18n/useLabels';
import { type ActiveView, useUIStore } from '../../store/uiStore';
import { useProject } from '../../store/useProjectStore';

const VIEW_IDS: ActiveView[] = [
  'flow',
  'editor',
  'items',
  'mobs',
  'dungeons',
  'dimensions',
  'jobs',
  'advancements',
  'commands',
  'export',
];

interface Props {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export function TopBar({ theme, onToggleTheme }: Props) {
  const { t } = useTranslation('common');
  const platformLabels = usePlatformLabels();
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
        <span className="badge platform">{platformLabels[project.platform]}</span>
      </div>

      <nav className="topbar-nav" aria-label={t('nav.mainViewsAria')}>
        {VIEW_IDS.map((id) => (
          <button
            key={id}
            type="button"
            className={`topbar-tab ${activeView === id ? 'active' : ''}`}
            onClick={() => setActiveView(id)}
          >
            {t(`nav.${id}`)}
            {id === 'export' && exportBlocked && (
              <span className="topbar-tab-dot error" aria-label={t('nav.exportBlockedAria')} />
            )}
          </button>
        ))}
      </nav>

      <div className="topbar-actions">
        <button
          type="button"
          className="icon-btn"
          onClick={() => setHelpOpen(!helpOpen)}
          title={helpOpen ? t('actions.closeHelp') : t('actions.help')}
        >
          {helpOpen ? t('actions.closeHelp') : t('actions.help')}
        </button>
        <button
          type="button"
          className="icon-btn"
          onClick={onToggleTheme}
          title={t('theme.toggleTitle')}
        >
          {theme === 'dark' ? t('actions.lightTheme') : t('actions.darkTheme')}
        </button>
        <button
          type="button"
          className="icon-btn"
          onClick={() => setSettingsOpen(true)}
          title={t('settings.titleButton')}
        >
          {t('actions.settings')}
        </button>
      </div>
    </header>
  );
}
