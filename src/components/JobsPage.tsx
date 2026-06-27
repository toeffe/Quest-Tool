import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type Project } from '../types/quest';
import {
  type Job,
  type JobAction,
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
import { ACTION_PRESETS, defaultPresetForAction } from '../generator/jobStats';
import { type ValidationIssue } from '../generator/validate';
import { useJobActionLabels, useJobStatPresetLabels } from '../i18n/useLabels';
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

const BG_LABEL_KEY: Record<string, string> = {
  'minecraft:gui/advancements/backgrounds/husbandry': 'husbandry',
  'minecraft:gui/advancements/backgrounds/adventure': 'adventure',
  'minecraft:gui/advancements/backgrounds/stone': 'stone',
  'minecraft:gui/advancements/backgrounds/nether': 'nether',
  'minecraft:gui/advancements/backgrounds/end': 'end',
};

export function JobsPage({ project, issues = [], onChange, onAdd, onDuplicate, onDelete }: Props) {
  const { t } = useTranslation('jobs');
  const { t: tc } = useTranslation('common');
  const jobActionLabels = useJobActionLabels();
  const statPresetLabels = useJobStatPresetLabels();
  const jobs = project.jobs ?? [];
  const customItems = project.customItems ?? [];
  const [selectedId, setSelectedId] = useState<string>(() => jobs[0]?.id ?? '');

  const actionOptions = useMemo(
    () =>
      (Object.keys(jobActionLabels) as JobAction[]).map((value) => ({
        value,
        label: jobActionLabels[value],
      })),
    [jobActionLabels],
  );

  const bgOptions = useMemo(
    () =>
      JOB_ADVANCEMENT_BACKGROUNDS.map((b) => ({
        value: b.value,
        label: t(`advancementBackgrounds.${BG_LABEL_KEY[b.value] ?? 'stone'}`),
      })),
    [t],
  );

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
        label: statPresetLabels[p] ?? p,
      }))
    : [];

  const xpPerActionLabel = jobIsDistance(selected?.action ?? 'mine')
    ? t('settings.xpPerDistance')
    : t('settings.xpPerAction');
  const xpPerActionHint = jobIsDistance(selected?.action ?? 'mine')
    ? t('settings.xpPerDistanceHint')
    : t('settings.xpPerActionHint');

  return (
    <div className="items-page">
      <h1 className="step-title">{t('title')}</h1>
      <p className="step-sub">{t('subtitle')}</p>

      <div className="items-layout">
        <aside className="items-list card">
          <div className="row-between" style={{ marginBottom: 12 }}>
            <h3 style={{ margin: 0 }}>{t('list.title', { count: jobs.length })}</h3>
            <button className="btn small" onClick={onAdd} title={t('list.addTitle')}>
              {tc('actions.add')}
            </button>
          </div>

          {jobs.length === 0 && <p className="muted">{t('list.empty')}</p>}

          {jobs.map((job) => (
            <div
              key={job.id}
              className={`quest-item ${job.id === selected?.id ? 'active' : ''}`}
              onClick={() => setSelectedId(job.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setSelectedId(job.id)}
            >
              <div className="quest-item-name">{job.name || t('list.untitled')}</div>
              <div className="quest-item-meta muted">
                {t('list.meta', { action: jobActionLabels[job.action], maxLevel: job.maxLevel })}
              </div>
            </div>
          ))}
        </aside>

        <div className="items-editor">
          {selected ? (
            <>
              <div className="card">
                <div className="row-between" style={{ marginBottom: 14 }}>
                  <h3 style={{ margin: 0 }}>{selected.name || t('settings.jobSettings')}</h3>
                  <div className="row-actions">
                    <button
                      type="button"
                      className="btn small"
                      onClick={() => updateJob(applyBalancedDefaults(selected))}
                      title={t('settings.balancedDefaultsTitle')}
                    >
                      {t('settings.balancedDefaults')}
                    </button>
                    <button type="button" className="btn small" onClick={() => onDuplicate(selected.id)}>
                      {tc('actions.duplicate')}
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
                      {tc('actions.delete')}
                    </button>
                  </div>
                </div>

                <TextInput
                  label={t('settings.jobName')}
                  hint={t('settings.jobNameHint')}
                  value={selected.name}
                  onChange={(name) => updateJob({ name })}
                />

                <Select
                  label={t('settings.actionType')}
                  hint={t('settings.actionTypeHint')}
                  value={selected.action}
                  options={actionOptions}
                  onChange={setAction}
                />

                {jobUsesPresets(selected.action) && presetOptions.length > 0 && (
                  <Select
                    label={t('settings.targetPreset')}
                    hint={t('settings.targetPresetHint')}
                    value={selected.statPreset ?? defaultPresetForAction(selected.action)}
                    options={presetOptions}
                    onChange={(statPreset) => updateJob({ statPreset })}
                  />
                )}

                {selected.statPreset === 'single' && (
                  <TextInput
                    label={t('settings.singleTarget')}
                    hint={t('settings.singleTargetHint')}
                    value={selected.statTarget ?? ''}
                    onChange={(statTarget) => updateJob({ statTarget })}
                  />
                )}

                {selected.action === 'custom' && (
                  <TextInput
                    label={t('settings.customCriterion')}
                    hint={t('settings.customCriterionHint')}
                    value={selected.customCriterion ?? ''}
                    onChange={(customCriterion) => updateJob({ customCriterion })}
                  />
                )}

                {jobIsDistance(selected.action) && (
                  <NumberInput
                    label={t('settings.cmPerXpUnit')}
                    hint={t('settings.cmPerXpUnitHint')}
                    value={selected.distanceUnit ?? 1000}
                    min={100}
                    onChange={(distanceUnit) => updateJob({ distanceUnit })}
                  />
                )}

                <NumberInput
                  label={xpPerActionLabel}
                  hint={xpPerActionHint}
                  value={selected.xpPerAction}
                  min={1}
                  onChange={(xpPerAction) => updateJob({ xpPerAction })}
                />

                <NumberInput
                  label={t('settings.xpPerLevel')}
                  hint={t('settings.xpPerLevelHint')}
                  value={selected.xpPerLevel}
                  min={1}
                  onChange={(xpPerLevel) => updateJob({ xpPerLevel })}
                />

                <NumberInput
                  label={t('settings.maxLevel')}
                  value={selected.maxLevel}
                  min={1}
                  onChange={(maxLevel) => updateJob({ maxLevel })}
                />

                <Field label={t('settings.showActionBar')}>
                  <label className="muted" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input
                      type="checkbox"
                      style={{ width: 'auto' }}
                      checked={selected.showActionBar}
                      onChange={(e) => updateJob({ showActionBar: e.target.checked })}
                    />
                    {t('settings.showActionBarHint')}
                  </label>
                </Field>
                <Field label={t('settings.progressDisplay')}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="checkbox"
                      style={{ width: 'auto' }}
                      checked={selected.showProgressBar !== false}
                      onChange={(e) => updateJob({ showProgressBar: e.target.checked })}
                    />
                    {t('settings.progressDisplayHint')}
                  </label>
                </Field>
              </div>

              <JobMilestonesEditor
                job={selected}
                customItems={customItems}
                onChange={(milestones) => updateJob({ milestones })}
              />

              <div className="card">
                <h3>{t('advancements.title')}</h3>
                <p className="hint" style={{ marginTop: 0 }}>
                  {t('advancements.hint')}
                </p>
                <TextInput
                  label={t('advancements.icon')}
                  hint={t('advancements.iconHint')}
                  value={selected.advancementIcon ?? defaultJobAdvancementIcon(selected.action)}
                  onChange={(advancementIcon) => updateJob({ advancementIcon })}
                />
                <Select
                  label={t('advancements.background')}
                  hint={t('advancements.backgroundHint')}
                  value={
                    selected.advancementBackground ??
                    defaultJobAdvancementBackground(selected.action)
                  }
                  options={bgOptions}
                  onChange={(advancementBackground) => updateJob({ advancementBackground })}
                />
                <TextArea
                  label={t('advancements.rootDescription')}
                  hint={t('advancements.rootDescriptionHint')}
                  value={selected.advancementDescription ?? ''}
                  onChange={(advancementDescription) =>
                    updateJob({ advancementDescription: advancementDescription || undefined })
                  }
                />
                <TextInput
                  label={t('advancements.levelTitle')}
                  hint={t('advancements.levelTitleHint')}
                  value={selected.levelTitle ?? ''}
                  placeholder={t('advancements.levelTitlePlaceholder')}
                  onChange={(levelTitle) => updateJob({ levelTitle: levelTitle || undefined })}
                />
              </div>

              <div className="card">
                <h3>{t('preview.title')}</h3>
                <p className="muted" style={{ marginTop: 0 }}>
                  {t('preview.xpPerAction', { xp: selected.xpPerAction })}{' '}
                  {t('preview.level2', {
                    xp: level2Xp,
                    actions: actionsToReachLevel(selected, 2),
                  })}{' '}
                  {t('preview.level5', {
                    xp: level5Xp,
                    actions: actionsToReachLevel(selected, 5),
                  })}
                </p>
                <p className="hint">{t('preview.noRetroactive')}</p>
              </div>
            </>
          ) : (
            <div className="card">
              <p className="muted">{t('list.selectEmpty')}</p>
            </div>
          )}
        </div>
      </div>
      <ValidationBar issues={jobIssues} />
    </div>
  );
}
