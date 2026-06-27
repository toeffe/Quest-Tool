import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type Project } from '../../types/quest';
import {
  validateProject,
  hasBlockingErrors,
  type ValidationIssue,
} from '../../generator/validate';
import {
  buildRawCommands,
  buildDatapackZip,
  datapackFileName,
} from '../../generator/datapack';
import { installGuide } from '../../generator/platform';
import { buildContext } from '../../generator/context';
import { exportProjectJson, projectJsonFileName } from '../../state/projectStore';

interface Props {
  project: Project;
}

export function StepGenerate({ project }: Props) {
  const { t } = useTranslation('export');
  const { t: tc } = useTranslation('common');
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [busy, setBusy] = useState(false);

  const issues = useMemo<ValidationIssue[]>(() => validateProject(project), [project]);
  const blocked = hasBlockingErrors(issues);
  const errors = issues.filter((i) => i.level === 'error');
  const warnings = issues.filter((i) => i.level === 'warning');
  const projectLocale = project.locale ?? 'da';

  const rawCommands = useMemo(() => (blocked ? '' : buildRawCommands(project)), [project, blocked]);
  const guide = useMemo(
    () => installGuide(project.platform, buildContext(project).namespace, projectLocale),
    [project, projectLocale],
  );

  async function handleDownload() {
    setBusy(true);
    try {
      const blob = await buildDatapackZip(project);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = datapackFileName(project);
      a.click();
      URL.revokeObjectURL(url);
      setDownloaded(true);
    } finally {
      setBusy(false);
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(rawCommands);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function handleProjectBackup() {
    const blob = new Blob([exportProjectJson(project)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = projectJsonFileName(project);
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <h1 className="step-title">{t('title')}</h1>
      <p className="step-sub">{t('subtitle')}</p>

      <div className="card">
        <div className="row-between" style={{ marginBottom: 12 }}>
          <h3 style={{ margin: 0 }}>{t('validation.title')}</h3>
          <div>
            <span className="badge error" style={{ marginRight: 8 }}>
              {tc('validation.errors', { count: errors.length })}
            </span>
            <span className="badge warning">{tc('validation.warnings', { count: warnings.length })}</span>
          </div>
        </div>

        {issues.length === 0 && (
          <div className="success-banner">{t('validation.allGood')}</div>
        )}

        {issues.map((issue, i) => (
          <div key={i} className="issue">
            <span className={`badge ${issue.level}`}>{issue.level}</span>
            <div>
              {issue.questName && (
                <strong>{t('validation.questPrefix', { name: issue.questName })}</strong>
              )}
              {issue.message}
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <h3>{guide.title}</h3>
        <ol style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
          {guide.steps.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
      </div>

      <div className="card">
        <div className="row-between" style={{ marginBottom: 12 }}>
          <h3 style={{ margin: 0 }}>{t('exportCard.title')}</h3>
        </div>
        {downloaded && (
          <div className="success-banner">{t('exportCard.downloaded')}</div>
        )}
        <div className="toolbar">
          <button className="btn primary" disabled={blocked || busy} onClick={handleDownload}>
            {busy ? tc('actions.building') : t('exportCard.downloadButton')}
          </button>
          <button className="btn" disabled={blocked} onClick={handleCopy}>
            {copied ? tc('actions.copied') : t('exportCard.copyCommands')}
          </button>
        </div>
        {blocked && (
          <p className="muted" style={{ marginTop: 4 }}>
            {t('exportCard.blockedHint')}
          </p>
        )}
        <div className="toolbar" style={{ marginTop: blocked ? 10 : 0 }}>
          {blocked && (
            <button className="btn primary" type="button" onClick={handleProjectBackup}>
              {t('exportCard.projectBackup')}
            </button>
          )}
        </div>
      </div>

      {!blocked && (
        <div className="card">
          <h3>Command preview</h3>
          <p className="muted" style={{ marginTop: -6, marginBottom: 12 }}>
            {t('files.subtitle')}
          </p>
          <pre className="code">{rawCommands}</pre>
        </div>
      )}
    </div>
  );
}
