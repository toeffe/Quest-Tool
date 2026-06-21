import { useMemo, useState } from 'react';
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
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [busy, setBusy] = useState(false);

  const issues = useMemo<ValidationIssue[]>(() => validateProject(project), [project]);
  const blocked = hasBlockingErrors(issues);
  const errors = issues.filter((i) => i.level === 'error');
  const warnings = issues.filter((i) => i.level === 'warning');

  const rawCommands = useMemo(() => (blocked ? '' : buildRawCommands(project)), [project, blocked]);
  const guide = useMemo(
    () => installGuide(project.platform, buildContext(project).namespace),
    [project],
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
      <h1 className="step-title">Generate &amp; Export</h1>
      <p className="step-sub">
        Validate your quests, preview the generated commands, and download a ready-to-install
        datapack for Minecraft 1.21.11. The ZIP includes <code>quest-tool-project.json</code> so
        you can re-import your work later.
      </p>

      <div className="card">
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
            Your project backup is inside the ZIP as quest-tool-project.json — keep the file if
            you want to edit this pack again later.
          </div>
        )}
        <div className="toolbar">
          <button className="btn primary" disabled={blocked || busy} onClick={handleDownload}>
            {busy ? 'Building...' : 'Download datapack (.zip)'}
          </button>
          <button className="btn" disabled={blocked} onClick={handleCopy}>
            {copied ? 'Copied!' : 'Copy raw commands'}
          </button>
        </div>
        {blocked && (
          <p className="muted" style={{ marginTop: 4 }}>
            Fix the errors above to download the datapack. You can still save a project backup
            as JSON while you work.
          </p>
        )}
        <div className="toolbar" style={{ marginTop: blocked ? 10 : 0 }}>
          {blocked && (
            <button className="btn primary" type="button" onClick={handleProjectBackup}>
              Download project backup (.json)
            </button>
          )}
        </div>
      </div>

      {!blocked && (
        <div className="card">
          <h3>Command preview</h3>
          <p className="muted" style={{ marginTop: -6, marginBottom: 12 }}>
            This is every file the datapack contains, for reference or manual use.
          </p>
          <pre className="code">{rawCommands}</pre>
        </div>
      )}
    </div>
  );
}
