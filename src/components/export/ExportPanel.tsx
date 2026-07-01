import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  TEST_DATAPACK_NAMESPACE,
  TEST_DATAPACK_SURFACE_Y,
} from '../../fixtures/testDatapackProject';
import { JOB_STATION_LABELS, JOB_STATION_X } from '../../fixtures/testDatapackStations';
import { buildContext } from '../../generator/context';
import { buildDatapackFiles, buildRawCommands } from '../../generator/datapack';
import { installGuide } from '../../generator/platform';
import { hasBlockingErrors } from '../../generator/validate';
import { useExport } from '../../hooks/useExport';
import { useValidation } from '../../hooks/useValidation';
import { exportProjectJson, projectJsonFileName } from '../../state/projectStore';
import { useProject } from '../../store/useProjectStore';
import { PageHeader } from '../ui/PageHeader';

export function ExportPanel() {
  const { t } = useTranslation('export');
  const { t: tc } = useTranslation('common');
  const { t: tDefaults } = useTranslation('defaults');
  const project = useProject();
  const issues = useValidation();
  const {
    busy,
    downloaded,
    resourcePackDownloaded,
    testDownloaded,
    error,
    resourcePackError,
    testError,
    hasSkins,
    downloadDatapack,
    downloadResourcePack,
    downloadTestDatapack,
  } = useExport();
  const [copied, setCopied] = useState(false);

  const blocked = hasBlockingErrors(issues);
  const errors = issues.filter((i) => i.level === 'error');
  const warnings = issues.filter((i) => i.level === 'warning');
  const projectLocale = project.locale ?? 'da';
  const namespace = buildContext(project).namespace;

  const rawCommands = useMemo(() => (blocked ? '' : buildRawCommands(project)), [project, blocked]);
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
  const fileEntries = Object.entries(files);

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
      <PageHeader title={t('title')} lead={t('subtitle')} hint={t('subtitleHint')} />

      <section
        className={`card export-primary ${blocked ? 'blocked' : warnings.length ? 'warn' : 'ok'}`}
      >
        <div className="export-primary-head">
          <div>
            <h2 className="export-section-title">{t('exportCard.title')}</h2>
            {!blocked && issues.length === 0 && (
              <p className="export-status-text ok">{t('validation.allGood')}</p>
            )}
            {blocked && <p className="export-status-text blocked">{t('exportCard.blockedHint')}</p>}
            {!blocked && warnings.length > 0 && issues.length > 0 && (
              <p className="export-status-text warn">{t('exportCard.warningsHint')}</p>
            )}
          </div>
          <div className="export-badges">
            <span className="badge error">{tc('validation.errors', { count: errors.length })}</span>
            <span className="badge warning">
              {tc('validation.warnings', { count: warnings.length })}
            </span>
          </div>
        </div>

        {downloaded && <div className="success-banner">{t('exportCard.downloaded')}</div>}
        {resourcePackDownloaded && (
          <div className="success-banner">{t('exportCard.resourcePackDownloaded')}</div>
        )}
        {error && (
          <div className="issue">
            <span className="badge error">{tc('validation.error')}</span>
            {error}
          </div>
        )}
        {resourcePackError && (
          <div className="issue">
            <span className="badge error">{tc('validation.error')}</span>
            {resourcePackError}
          </div>
        )}

        <div className="toolbar export-toolbar">
          <button
            type="button"
            className="btn primary"
            disabled={blocked || busy}
            onClick={downloadDatapack}
          >
            {busy ? tc('actions.building') : t('exportCard.downloadButton')}
          </button>
          {hasSkins && (
            <button
              type="button"
              className="btn"
              disabled={blocked || busy}
              onClick={downloadResourcePack}
            >
              {busy ? tc('actions.building') : t('exportCard.downloadResourcePackButton')}
            </button>
          )}
          <button type="button" className="btn" disabled={blocked} onClick={handleCopy}>
            {copied ? tc('actions.copied') : t('exportCard.copyCommands')}
          </button>
          {blocked && (
            <button type="button" className="btn" onClick={handleProjectBackup}>
              {t('exportCard.projectBackup')}
            </button>
          )}
        </div>
      </section>

      {issues.length > 0 && (
        <details className="card export-issues" open={blocked}>
          <summary className="export-details-summary">
            {t('validation.detailsSummary', { count: issues.length })}
          </summary>
          <div className="export-issues-list">
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
        </details>
      )}

      <section className="card">
        <h2 className="export-section-title">{guide.title}</h2>
        <ol className="export-steps">
          {guide.steps.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
      </section>

      <details className="card export-test-pack">
        <summary className="export-details-summary">{t('testPack.title')}</summary>
        <p className="muted export-test-pack-desc">{t('testPack.description')}</p>
        <p className="muted">
          {t('testPack.guideCommand', { namespace: TEST_DATAPACK_NAMESPACE })}
        </p>
        <details className="export-nested-details">
          <summary className="export-details-summary subtle">{t('testPack.setupSummary')}</summary>
          <ol className="export-steps">
            <li>{t('testPack.steps.flatWorld')}</li>
            <li>{t('testPack.steps.spawnAll', { namespace: TEST_DATAPACK_NAMESPACE })}</li>
            <li>{t('testPack.steps.giveKit', { namespace: TEST_DATAPACK_NAMESPACE })}</li>
            <li>{t('testPack.steps.syncJobs', { namespace: TEST_DATAPACK_NAMESPACE })}</li>
            <li>{t('testPack.steps.debug', { namespace: TEST_DATAPACK_NAMESPACE })}</li>
            <li>{t('testPack.steps.questLayout', { y: TEST_DATAPACK_SURFACE_Y })}</li>
            <li>
              {t('testPack.steps.jobStations', {
                x: JOB_STATION_X,
                stations: JOB_STATION_LABELS.map((s) => tDefaults(`starterJobs.${s.nameKey}`)).join(
                  ', ',
                ),
              })}
            </li>
            <li>{t('testPack.steps.reset', { namespace: TEST_DATAPACK_NAMESPACE })}</li>
          </ol>
        </details>
        {testDownloaded && (
          <div className="success-banner">
            {t('testPack.downloaded', { y: TEST_DATAPACK_SURFACE_Y })}
          </div>
        )}
        {testError && (
          <div className="issue">
            <span className="badge error">{tc('validation.error')}</span>
            {testError}
          </div>
        )}
        <button type="button" className="btn" disabled={busy} onClick={downloadTestDatapack}>
          {busy ? tc('actions.building') : t('testPack.downloadButton')}
        </button>
      </details>

      {!blocked && fileEntries.length > 0 && (
        <details className="card export-files">
          <summary className="export-details-summary">
            {t('files.title', { count: fileEntries.length })}
          </summary>
          <p className="muted export-files-sub">{t('files.subtitle')}</p>
          <div className="export-file-list">
            {fileEntries.slice(0, 12).map(([name, content]) => (
              <details key={name} className="export-file-item">
                <summary>
                  <code>{name}</code>
                </summary>
                <pre className="code">
                  {content.slice(0, 600)}
                  {content.length > 600 ? `\n${t('files.truncated')}` : ''}
                </pre>
              </details>
            ))}
            {fileEntries.length > 12 && (
              <p className="muted">{t('files.moreFiles', { count: fileEntries.length - 12 })}</p>
            )}
          </div>
        </details>
      )}
    </div>
  );
}
