import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useProject } from '../../store/useProjectStore';
import { useValidation } from '../../hooks/useValidation';
import { useExport } from '../../hooks/useExport';
import { hasBlockingErrors } from '../../generator/validate';
import {
  buildRawCommands,
  buildDatapackFiles,
} from '../../generator/datapack';
import { installGuide } from '../../generator/platform';
import { buildContext } from '../../generator/context';
import { exportProjectJson, projectJsonFileName } from '../../state/projectStore';
import {
  TEST_DATAPACK_NAMESPACE,
  TEST_DATAPACK_SURFACE_Y,
} from '../../fixtures/testDatapackProject';
import { JOB_STATION_LABELS, JOB_STATION_X } from '../../fixtures/testDatapackStations';

export function ExportPanel() {
  const { t } = useTranslation('export');
  const { t: tc } = useTranslation('common');
  const project = useProject();
  const issues = useValidation();
  const { busy, downloaded, testDownloaded, error, testError, downloadDatapack, downloadTestDatapack } =
    useExport();
  const [copied, setCopied] = useState(false);

  const blocked = hasBlockingErrors(issues);
  const errors = issues.filter((i) => i.level === 'error');
  const warnings = issues.filter((i) => i.level === 'warning');
  const projectLocale = project.locale ?? 'da';
  const namespace = buildContext(project).namespace;

  const rawCommands = useMemo(
    () => (blocked ? '' : buildRawCommands(project)),
    [project, blocked],
  );
  const guide = useMemo(
    () => installGuide(project.platform, namespace, projectLocale),
    [project.platform, namespace, projectLocale],
  );
  const files = useMemo(() => {
    try {
      return buildDatapackFiles(project);
    } catch {
      return {} as Record<string, string>;
    }
  }, [project]);

  async function handleCopy() {
    await navigator.clipboard.writeText(rawCommands);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
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
    <div className="export-panel content-inner">
      <h1 className="step-title">{t('title')}</h1>
      <p className="step-sub">{t('subtitle')}</p>

      <div className="card" style={{ borderColor: 'var(--color-accent)' }}>
        <h3 style={{ marginTop: 0 }}>{t('testPack.title')}</h3>
        <p className="muted" style={{ marginTop: -4, lineHeight: 1.6 }}>
          {t('testPack.description')}
        </p>
        <p className="muted" style={{ marginBottom: 8, lineHeight: 1.6 }}>
          {t('testPack.guideCommand', { namespace: TEST_DATAPACK_NAMESPACE })}
        </p>
        <details style={{ marginBottom: 12 }}>
          <summary style={{ cursor: 'pointer', fontWeight: 600 }}>{t('testPack.setupSummary')}</summary>
          <ol style={{ margin: '8px 0 0', paddingLeft: 18, lineHeight: 1.7 }}>
            <li>{t('testPack.steps.flatWorld')}</li>
            <li>{t('testPack.steps.spawnAll', { namespace: TEST_DATAPACK_NAMESPACE })}</li>
            <li>{t('testPack.steps.giveKit', { namespace: TEST_DATAPACK_NAMESPACE })}</li>
            <li>{t('testPack.steps.syncJobs', { namespace: TEST_DATAPACK_NAMESPACE })}</li>
            <li>{t('testPack.steps.debug', { namespace: TEST_DATAPACK_NAMESPACE })}</li>
            <li>{t('testPack.steps.questLayout', { y: TEST_DATAPACK_SURFACE_Y })}</li>
            <li>
              {t('testPack.steps.jobStations', {
                x: JOB_STATION_X,
                stations: JOB_STATION_LABELS.map((s) => s.name).join(', '),
              })}
            </li>
            <li>{t('testPack.steps.reset', { namespace: TEST_DATAPACK_NAMESPACE })}</li>
          </ol>
        </details>
        {testDownloaded && (
          <div className="success-banner" style={{ marginBottom: 12 }}>
            {t('testPack.downloaded', { y: TEST_DATAPACK_SURFACE_Y })}
          </div>
        )}
        {testError && (
          <div className="issue" style={{ marginBottom: 12 }}>
            <span className="badge error">{tc('validation.error')}</span>
            {testError}
          </div>
        )}
        <button
          type="button"
          className="btn primary"
          disabled={busy}
          onClick={downloadTestDatapack}
        >
          {busy ? tc('actions.building') : t('testPack.downloadButton')}
        </button>
      </div>

      <div className={`card validation-summary ${blocked ? 'blocked' : warnings.length ? 'warn' : 'ok'}`}>
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
        {error && (
          <div className="issue">
            <span className="badge error">{tc('validation.error')}</span>
            {error}
          </div>
        )}
        <div className="toolbar">
          <button
            type="button"
            className="btn primary"
            disabled={blocked || busy}
            onClick={downloadDatapack}
          >
            {busy ? tc('actions.building') : t('exportCard.downloadButton')}
          </button>
          <button type="button" className="btn" disabled={blocked} onClick={handleCopy}>
            {copied ? tc('actions.copied') : t('exportCard.copyCommands')}
          </button>
          {blocked && (
            <button type="button" className="btn" onClick={handleProjectBackup}>
              {t('exportCard.projectBackup')}
            </button>
          )}
        </div>
        {blocked && (
          <p className="muted" style={{ marginTop: 8 }}>
            {t('exportCard.blockedHint')}
          </p>
        )}
      </div>

      {!blocked && (
        <div className="card">
          <h3>{t('files.title', { count: Object.keys(files).length })}</h3>
          <p className="muted" style={{ marginTop: -6, marginBottom: 12 }}>
            {t('files.subtitle')}
          </p>
          <div className="export-file-list">
            {Object.entries(files).slice(0, 12).map(([name, content]) => (
              <details key={name} className="export-file-item">
                <summary>
                  <code>{name}</code>
                </summary>
                <pre className="code">{content.slice(0, 600)}{content.length > 600 ? `\n${t('files.truncated')}` : ''}</pre>
              </details>
            ))}
            {Object.keys(files).length > 12 && (
              <p className="muted">{t('files.moreFiles', { count: Object.keys(files).length - 12 })}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
