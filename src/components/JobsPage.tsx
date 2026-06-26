import { useMemo, useState } from 'react';
import { type Project } from '../types/quest';
import {
  type Job,
  type JobAction,
  JOB_ACTION_LABELS,
  jobUsesPresets,
  jobIsDistance,
  totalXpForLevel,
} from '../types/job';
import { applyBalancedDefaults, actionsToReachLevel } from '../generator/jobBalance';
import {
  defaultJobAdvancementIcon,
  defaultJobAdvancementBackground,
  JOB_ADVANCEMENT_BACKGROUNDS,
} from '../generator/jobAdvancements';
import {
  ACTION_PRESETS,
  JOB_STAT_PRESET_LABELS,
  defaultPresetForAction,
} from '../generator/jobStats';
import { type ValidationIssue } from '../generator/validate';
import { ValidationBar } from './editor/ValidationBar';
import { JobMilestonesEditor } from './JobMilestonesEditor';
import { TextInput, NumberInput, Field, TextArea, Select } from './ui/Field';

interface Props {
  project: Project;
  issues?: ValidationIssue[];
  onChange: (project: Project) => void;
  onAdd: () => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}

const ACTION_OPTIONS: { value: JobAction; label: string }[] = (
  Object.keys(JOB_ACTION_LABELS) as JobAction[]
).map((value) => ({ value, label: JOB_ACTION_LABELS[value] }));

function xpPerActionLabel(action: JobAction): string {
  if (jobIsDistance(action)) return 'XP per distance unit';
  return 'XP per action';
}

function xpPerActionHint(action: JobAction): string {
  if (jobIsDistance(action)) {
    return 'Centimeters per unit is set below (default 1000 cm = 10 blocks).';
  }
  return 'How much job XP is granted each time the tracked action occurs.';
}

export function JobsPage({ project, issues = [], onChange, onAdd, onDuplicate, onDelete }: Props) {
  const jobs = project.jobs ?? [];
  const customItems = project.customItems ?? [];
  const [selectedId, setSelectedId] = useState<string>(() => jobs[0]?.id ?? '');

  const selected = useMemo(
    () => jobs.find((j) => j.id === selectedId) ?? jobs[0],
    [jobs, selectedId],
  );

  const updateJob = (patch: Partial<Job>) => {
    if (!selected) return;
    onChange({
      ...project,
      jobs: jobs.map((j) => (j.id === selected.id ? { ...j, ...patch } : j)),
    });
  };

  const setAction = (action: JobAction) => {
    if (!selected) return;
    const balanced = applyBalancedDefaults({ ...selected, action });
    const patch: Partial<Job> = {
      action,
      xpPerAction: balanced.xpPerAction,
      xpPerLevel: balanced.xpPerLevel,
      maxLevel: balanced.maxLevel,
      distanceUnit: balanced.distanceUnit,
      customCriterion: undefined,
      statTarget: undefined,
    };
    if (jobUsesPresets(action)) {
      patch.statPreset = defaultPresetForAction(action);
    } else {
      patch.statPreset = undefined;
    }
    updateJob(patch);
  };

  const level2Xp = selected ? totalXpForLevel(selected, 2) : 0;
  const level5Xp = selected ? totalXpForLevel(selected, 5) : 0;
  const jobIssues = useMemo(
    () =>
      issues.filter(
        (i) =>
          i.jobId === selected?.id ||
          (!i.jobId && (i.message.toLowerCase().includes('job') || i.field?.startsWith('jobs'))),
      ),
    [issues, selected?.id],
  );

  const presetOptions = selected
    ? (ACTION_PRESETS[selected.action] ?? []).map((p) => ({
        value: p,
        label: JOB_STAT_PRESET_LABELS[p] ?? p,
      }))
    : [];

  return (
    <div className="items-page">
      <h1 className="step-title">Jobs</h1>
      <p className="step-sub">
        Passive skills that level up as players perform actions — fishing, mining, combat, and more.
        Job progress ships in the same datapack as your quests. Configure milestone rewards to grant
        custom items at key levels.
      </p>

      <div className="items-layout">
        <aside className="items-list card">
          <div className="row-between" style={{ marginBottom: 12 }}>
            <h3 style={{ margin: 0 }}>Jobs ({jobs.length})</h3>
            <button className="btn small" onClick={onAdd} title="Add job">
              + Add
            </button>
          </div>

          {jobs.length === 0 && (
            <p className="muted">No jobs yet. Add one to enable passive skill progression.</p>
          )}

          {jobs.map((job) => (
            <div
              key={job.id}
              className={`quest-item ${job.id === selected?.id ? 'active' : ''}`}
              onClick={() => setSelectedId(job.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setSelectedId(job.id)}
            >
              <div className="quest-item-name">{job.name || 'Untitled job'}</div>
              <div className="quest-item-meta muted">
                {JOB_ACTION_LABELS[job.action]} · max Lv.{job.maxLevel}
              </div>
            </div>
          ))}
        </aside>

        <div className="items-editor">
          {selected ? (
            <>
              <div className="card">
                <div className="row-between" style={{ marginBottom: 14 }}>
                  <h3 style={{ margin: 0 }}>{selected.name || 'Job settings'}</h3>
                  <div className="row-actions">
                    <button
                      type="button"
                      className="btn small"
                      onClick={() => updateJob(applyBalancedDefaults(selected))}
                      title="Reset XP curve to balanced defaults for this action"
                    >
                      Balanced defaults
                    </button>
                    <button type="button" className="btn small" onClick={() => onDuplicate(selected.id)}>
                      Duplicate
                    </button>
                    <button
                      type="button"
                      className="btn small danger"
                      onClick={() => {
                        onDelete(selected.id);
                        const remaining = jobs.filter((j) => j.id !== selected.id);
                        setSelectedId(remaining[0]?.id ?? '');
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <TextInput
                  label="Job name"
                  hint="Shown in level-up messages and quest requirements."
                  value={selected.name}
                  onChange={(name) => updateJob({ name })}
                />

                <Select
                  label="Action type"
                  hint="What player activity this job tracks."
                  value={selected.action}
                  options={ACTION_OPTIONS}
                  onChange={setAction}
                />

                {jobUsesPresets(selected.action) && presetOptions.length > 0 && (
                  <Select
                    label="Target preset"
                    hint="Which blocks, mobs, or items count toward this job."
                    value={selected.statPreset ?? defaultPresetForAction(selected.action)}
                    options={presetOptions}
                    onChange={(statPreset) => updateJob({ statPreset })}
                  />
                )}

                {selected.statPreset === 'single' && (
                  <TextInput
                    label="Single target id"
                    hint="e.g. minecraft:coal_ore, minecraft:zombie, minecraft:bread"
                    value={selected.statTarget ?? ''}
                    onChange={(statTarget) => updateJob({ statTarget })}
                  />
                )}

                {selected.action === 'custom' && (
                  <TextInput
                    label="Custom scoreboard criterion"
                    hint="e.g. minecraft.custom:minecraft.jump"
                    value={selected.customCriterion ?? ''}
                    onChange={(customCriterion) => updateJob({ customCriterion })}
                  />
                )}

                {jobIsDistance(selected.action) && (
                  <NumberInput
                    label="Centimeters per XP unit"
                    hint="Default 1000 (10 blocks walked/sprinted per XP tick)."
                    value={selected.distanceUnit ?? 1000}
                    min={100}
                    onChange={(distanceUnit) => updateJob({ distanceUnit })}
                  />
                )}

                <NumberInput
                  label={xpPerActionLabel(selected.action)}
                  hint={xpPerActionHint(selected.action)}
                  value={selected.xpPerAction}
                  min={1}
                  onChange={(xpPerAction) => updateJob({ xpPerAction })}
                />

                <NumberInput
                  label="XP per level"
                  hint="Flat curve: total XP to reach level L = XP per level × L."
                  value={selected.xpPerLevel}
                  min={1}
                  onChange={(xpPerLevel) => updateJob({ xpPerLevel })}
                />

                <NumberInput
                  label="Max level"
                  value={selected.maxLevel}
                  min={1}
                  onChange={(maxLevel) => updateJob({ maxLevel })}
                />

                <Field label="Show XP gain on action bar">
                  <label className="muted" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input
                      type="checkbox"
                      style={{ width: 'auto' }}
                      checked={selected.showActionBar}
                      onChange={(e) => updateJob({ showActionBar: e.target.checked })}
                    />
                    Brief action bar message when XP is earned
                  </label>
                </Field>
                <Field label="Progress display">
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="checkbox"
                      style={{ width: 'auto' }}
                      checked={selected.showProgressBar !== false}
                      onChange={(e) => updateJob({ showProgressBar: e.target.checked })}
                    />
                    Personal boss bar at top (level, XP, progress — one per player)
                  </label>
                </Field>
              </div>

              <JobMilestonesEditor
                job={selected}
                customItems={customItems}
                onChange={(milestones) => updateJob({ milestones })}
              />

              <div className="card">
                <h3>Advancements</h3>
                <p className="hint" style={{ marginTop: 0 }}>
                  Players see job tabs under Esc → Advancements after joining the world (or /reload).
                </p>
                <TextInput
                  label="Advancement icon"
                  hint="Vanilla item id shown on the advancement tree."
                  value={selected.advancementIcon ?? defaultJobAdvancementIcon(selected.action)}
                  onChange={(advancementIcon) => updateJob({ advancementIcon })}
                />
                <Select
                  label="Tab background"
                  hint="Texture behind the in-game advancement tree (Minecraft 1.21.11 format)."
                  value={
                    selected.advancementBackground ??
                    defaultJobAdvancementBackground(selected.action)
                  }
                  options={JOB_ADVANCEMENT_BACKGROUNDS.map((b) => ({
                    value: b.value,
                    label: b.label,
                  }))}
                  onChange={(advancementBackground) => updateJob({ advancementBackground })}
                />
                <TextArea
                  label="Root description"
                  hint="Shown on the root advancement node for this job."
                  value={selected.advancementDescription ?? ''}
                  onChange={(advancementDescription) =>
                    updateJob({ advancementDescription: advancementDescription || undefined })
                  }
                />
                <TextInput
                  label="Level title template"
                  hint='Use {name} and {n} for job name and level. Default: "{name} — Level {n}"'
                  value={selected.levelTitle ?? ''}
                  placeholder={`${selected.name} — Level {n}`}
                  onChange={(levelTitle) => updateJob({ levelTitle: levelTitle || undefined })}
                />
              </div>

              <div className="card">
                <h3>Preview</h3>
                <p className="muted" style={{ marginTop: 0 }}>
                  Each action grants <strong>{selected.xpPerAction}</strong> XP.
                  Level 2 requires <strong>{level2Xp}</strong> total XP (~
                  {actionsToReachLevel(selected, 2)} actions).
                  Level 5 requires <strong>{level5Xp}</strong> total XP (~
                  {actionsToReachLevel(selected, 5)} actions).
                </p>
                <p className="hint">
                  Actions performed before installing the datapack do not grant retroactive XP.
                </p>
              </div>
            </>
          ) : (
            <div className="card">
              <p className="muted">Select a job from the list or click + Add to create one.</p>
            </div>
          )}
        </div>
      </div>
      <ValidationBar issues={jobIssues} />
    </div>
  );
}
