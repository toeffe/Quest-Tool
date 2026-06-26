import { useMemo, useState } from 'react';
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

export function ExportPanel() {
  const project = useProject();
  const issues = useValidation();
  const { busy, downloaded, error, downloadDatapack } = useExport();
  const [copied, setCopied] = useState(false);

  const blocked = hasBlockingErrors(issues);
  const errors = issues.filter((i) => i.level === 'error');
  const warnings = issues.filter((i) => i.level === 'warning');

  const rawCommands = useMemo(
    () => (blocked ? '' : buildRawCommands(project)),
    [project, blocked],
  );
  const guide = useMemo(
    () => installGuide(project.platform, buildContext(project).namespace),
    [project],
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
      <h1 className="step-title">Generate &amp; Export</h1>
      <p className="step-sub">
        Validate your quests and download a ready-to-install datapack for Minecraft 1.21.11.
        The ZIP includes <code>quest-tool-project.json</code> for re-import.
      </p>

      <div className={`card validation-summary ${blocked ? 'blocked' : warnings.length ? 'warn' : 'ok'}`}>
        <div className="row-between" style={{ marginBottom: 12 }}>
          <h3 style={{ margin: 0 }}>Validation</h3>
          <div>
            <span className="badge error" style={{ marginRight: 8 }}>
              {errors.length} errors
            </span>
            <span className="badge warning">{warnings.length} warnings</span>
          </div>
        </div>

        {issues.length === 0 && (
          <div className="success-banner">Everything looks good. You are ready to export.</div>
        )}

        {issues.map((issue, i) => (
          <div key={i} className="issue">
            <span className={`badge ${issue.level}`}>{issue.level}</span>
            <div>
              {issue.questName && <strong>{issue.questName}: </strong>}
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
          <h3 style={{ margin: 0 }}>Export</h3>
        </div>
        {downloaded && (
          <div className="success-banner">
            Datapack downloaded. Drop it into your world&apos;s datapacks folder and run /reload.
          </div>
        )}
        {error && <div className="issue"><span className="badge error">error</span>{error}</div>}
        <div className="toolbar">
          <button
            type="button"
            className="btn primary"
            disabled={blocked || busy}
            onClick={downloadDatapack}
          >
            {busy ? 'Building…' : 'Download datapack (.zip)'}
          </button>
          <button type="button" className="btn" disabled={blocked} onClick={handleCopy}>
            {copied ? 'Copied!' : 'Copy raw commands'}
          </button>
          {blocked && (
            <button type="button" className="btn" onClick={handleProjectBackup}>
              Download project backup (.json)
            </button>
          )}
        </div>
        {blocked && (
          <p className="muted" style={{ marginTop: 8 }}>
            Fix the errors above to download the datapack.
          </p>
        )}
      </div>

      {!blocked && (
        <div className="card">
          <h3>Generated files ({Object.keys(files).length})</h3>
          <p className="muted" style={{ marginTop: -6, marginBottom: 12 }}>
            Preview of datapack contents. Use Download for the full ZIP.
          </p>
          <div className="export-file-list">
            {Object.entries(files).slice(0, 12).map(([name, content]) => (
              <details key={name} className="export-file-item">
                <summary>
                  <code>{name}</code>
                </summary>
                <pre className="code">{content.slice(0, 600)}{content.length > 600 ? '\n…' : ''}</pre>
              </details>
            ))}
            {Object.keys(files).length > 12 && (
              <p className="muted">…and {Object.keys(files).length - 12} more files in the ZIP.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
