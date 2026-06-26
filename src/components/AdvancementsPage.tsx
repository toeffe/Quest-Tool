import { useMemo, useState } from 'react';
import { type Project } from '../types/quest';
import { type Job, totalXpForLevel } from '../types/job';
import {
  defaultJobAdvancementIcon,
  jobAdvancementBackground,
  jobAdvancementId,
} from '../generator/jobAdvancements';
import { buildContext } from '../generator/context';

interface Props {
  project: Project;
}

function levelTitle(job: Job, level: number): string {
  if (job.levelTitle) {
    return job.levelTitle.replace(/\{name\}/g, job.name).replace(/\{n\}/g, String(level));
  }
  return `${job.name} — Level ${level}`;
}

function rootDescription(job: Job): string {
  if (job.advancementDescription?.trim()) return job.advancementDescription.trim();
  if (job.action === 'fish') return 'Catch fish to earn XP and level up this skill.';
  return 'Perform actions to earn XP and level up this skill.';
}

function previewLevels(maxLevel: number): number[] {
  if (maxLevel <= 10) return Array.from({ length: maxLevel }, (_, i) => i + 1);
  return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, maxLevel];
}

function backgroundPreviewClass(background: string): string {
  if (background.includes('husbandry')) return 'adv-bg-husbandry';
  if (background.includes('adventure')) return 'adv-bg-adventure';
  if (background.includes('nether')) return 'adv-bg-nether';
  if (background.includes('/end')) return 'adv-bg-end';
  return 'adv-bg-stone';
}

export function AdvancementsPage({ project }: Props) {
  const jobs = project.jobs ?? [];
  const [selectedId, setSelectedId] = useState(() => jobs[0]?.id ?? '');
  const ctx = useMemo(() => buildContext(project), [project]);

  const selected = useMemo(
    () => jobs.find((j) => j.id === selectedId) ?? jobs[0],
    [jobs, selectedId],
  );

  const jc = selected ? ctx.jobs.find((j) => j.job.id === selected.id) : undefined;
  const background = selected ? jobAdvancementBackground(selected) : '';
  const previewClass = backgroundPreviewClass(background);

  return (
    <div className="items-page">
      <h1 className="step-title">Advancements</h1>
      <p className="step-sub">
        Preview how job skills appear in Minecraft. In-game, open{' '}
        <strong>Esc → Advancements → {project.namespace || 'your namespace'}</strong> to track
        levels. Each job generates a root node and a level chain (Lv.1 → Lv.2 → …).
      </p>

      {jobs.length === 0 ? (
        <div className="card">
          <p className="muted">No jobs defined. Add a job on the Jobs tab to generate a skill tree.</p>
        </div>
      ) : (
        <div className="items-layout">
          <aside className="items-list card">
            <h3 style={{ margin: '0 0 12px' }}>Job trees ({jobs.length})</h3>
            {jobs.map((job) => (
              <div
                key={job.id}
                className={`quest-item ${job.id === selected?.id ? 'active' : ''}`}
                onClick={() => setSelectedId(job.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && setSelectedId(job.id)}
              >
                <div className="quest-item-name">{job.name}</div>
                <div className="quest-item-meta muted">{job.maxLevel} levels</div>
              </div>
            ))}
          </aside>

          <div className="items-editor">
            {selected && jc && (
              <>
                <div className="card adv-tab-preview-wrap">
                  <h3 style={{ marginTop: 0 }}>In-game preview</h3>
                  <div className={`adv-tab-preview ${previewClass}`}>
                    <div className="adv-tab-preview-title">{selected.name}</div>
                    <div className="adv-tab-preview-tree">
                      <div className="adv-tab-preview-node root">
                        <span className="adv-tab-preview-icon" title="Root">
                          🎣
                        </span>
                      </div>
                      {previewLevels(Math.min(selected.maxLevel, 6)).map((level) => (
                        <div key={level} className="adv-tab-preview-branch">
                          <span className="adv-tab-preview-connector" />
                          <div className="adv-tab-preview-node">
                            <span className="adv-tab-preview-icon" title={`Level ${level}`}>
                              🎣
                            </span>
                          </div>
                        </div>
                      ))}
                      {selected.maxLevel > 6 && (
                        <span className="adv-tab-preview-more muted">+{selected.maxLevel - 6} more</span>
                      )}
                    </div>
                  </div>
                  <p className="hint" style={{ marginBottom: 0 }}>
                    Background: <code>{background}</code>
                  </p>
                </div>

                <div className="card">
                  <h3 style={{ marginTop: 0 }}>Root — {selected.name}</h3>
                  <p className="muted">
                    <strong>Icon:</strong>{' '}
                    {selected.advancementIcon ?? defaultJobAdvancementIcon(selected.action)}
                  </p>
                  <p className="muted">
                    <strong>Description:</strong> {rootDescription(selected)}
                  </p>
                  <p className="hint">
                    ID: <code>{jobAdvancementId(ctx, jc, 'root')}</code>
                  </p>
                </div>

                <div className="card">
                  <h3 style={{ marginTop: 0 }}>Level chain</h3>
                  <div className="adv-chain-preview">
                    {previewLevels(selected.maxLevel).map((level, i, arr) => {
                      const hasReward = (selected.milestones ?? []).some(
                        (m) => m.level === level && m.rewards.length > 0,
                      );
                      return (
                      <span key={level} className="adv-chain-node">
                        <span className={`adv-chain-pill${hasReward ? ' adv-chain-milestone' : ''}`}>
                          <strong>Lv.{level}</strong>
                          <span className="muted">
                            {levelTitle(selected, level)} · {totalXpForLevel(selected, level)} XP
                            {hasReward ? ' · reward' : ''}
                          </span>
                        </span>
                        {i < arr.length - 1 && <span className="adv-chain-arrow">→</span>}
                      </span>
                      );
                    })}
                    {selected.maxLevel > 10 && (
                      <p className="hint" style={{ marginTop: 12 }}>
                        Showing milestones; all {selected.maxLevel} levels are generated in the
                        datapack.
                      </p>
                    )}
                  </div>
                </div>

                <div className="card">
                  <p className="hint" style={{ margin: 0 }}>
                    Quest kill-zone advancements are internal counters only and do not appear here.
                    Edit icons, background, and descriptions on the Jobs tab. After re-export, run{' '}
                    <code>/function {project.namespace}:jobs/sync_all</code> if tabs look wrong.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
