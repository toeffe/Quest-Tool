import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { type Project } from '../types/quest';
import { buildCommandReference } from '../generator/commands';
import { CopyButton } from './ui/CopyButton';

interface Props {
  project: Project;
}

export function CommandsPage({ project }: Props) {
  const { t } = useTranslation('commands');
  const groups = useMemo(() => buildCommandReference(project), [project]);

  return (
    <div>
      <h1 className="step-title">{t('page.title')}</h1>
      <p className="step-sub">{t('page.subtitle')}</p>

      {groups.map((group) => (
        <div className="card" key={group.title}>
          <h3 style={{ marginBottom: group.description ? 4 : 14 }}>{group.title}</h3>
          {group.description && (
            <p className="muted" style={{ marginTop: 0, marginBottom: 14, fontSize: 13 }}>
              {group.description}
            </p>
          )}
          {group.commands.map((entry) => (
            <div className="cmd-row" key={entry.command}>
              <div className="cmd-main">
                <code className="cmd-code">{entry.command}</code>
                <div className="cmd-desc">{entry.description}</div>
              </div>
              <CopyButton value={entry.command} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
