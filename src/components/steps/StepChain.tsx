import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { type Project, type Quest } from '../../types/quest';
import { Field, Select, NumberInput } from '../ui/Field';
import { disconnectQuests } from '../flow/chainEdges';

interface Props {
  quest: Quest;
  project: Project;
  onChange: (quest: Quest) => void;
  onChangeProject?: (project: Project) => void;
  canvasFirst?: boolean;
}

function resolveQuestName(project: Project, name: string | undefined): Quest | undefined {
  if (!name) return undefined;
  return project.quests.find((q) => q.name === name);
}

function ChainTopologySummary({
  quest,
  project,
  onClearRequires,
  onClearUnlocks,
}: {
  quest: Quest;
  project: Project;
  onClearRequires?: () => void;
  onClearUnlocks?: () => void;
}) {
  const { t } = useTranslation('editor');
  const { t: tc } = useTranslation('common');
  const requires = quest.chain.requires;
  const unlocks = quest.chain.unlocks;
  const requiresOk = !requires || resolveQuestName(project, requires);
  const unlocksOk = !unlocks || resolveQuestName(project, unlocks);

  return (
    <div className="chain-topology-summary">
      <p className="chain-topology-hint">{t('chain.topologyHint')}</p>
      <dl className="chain-topology-list">
        <div className="chain-topology-row">
          <dt>{t('chain.requires')}</dt>
          <dd className={requires && !requiresOk ? 'chain-link-broken' : ''}>
            <span>{requires || tc('actions.noneDash')}</span>
            {requires && !requiresOk && ` ${t('chain.missingQuest')}`}
            {requires && onClearRequires && (
              <button type="button" className="btn small danger chain-unlink-btn" onClick={onClearRequires}>
                {tc('actions.unlink')}
              </button>
            )}
          </dd>
        </div>
        <div className="chain-topology-row">
          <dt>{t('chain.unlocks')}</dt>
          <dd className={unlocks && !unlocksOk ? 'chain-link-broken' : ''}>
            <span>{unlocks || tc('actions.noneDash')}</span>
            {unlocks && !unlocksOk && ` ${t('chain.missingQuest')}`}
            {unlocks && onClearUnlocks && (
              <button type="button" className="btn small danger chain-unlink-btn" onClick={onClearUnlocks}>
                {tc('actions.unlink')}
              </button>
            )}
          </dd>
        </div>
      </dl>
    </div>
  );
}

export function StepChain({ quest, project, onChange, onChangeProject, canvasFirst }: Props) {
  const { t } = useTranslation('editor');
  const { t: tc } = useTranslation('common');
  const others = project.quests.filter((q) => q.id !== quest.id);
  const jobs = project.jobs ?? [];
  const noneOption = useMemo(() => ({ value: '', label: tc('actions.none') }), [tc]);
  const questOptions = [noneOption, ...others.map((q) => ({ value: q.name, label: q.name }))];
  const jobOptions = [noneOption, ...jobs.map((j) => ({ value: j.id, label: j.name }))];

  const setChain = (patch: Partial<Quest['chain']>) =>
    onChange({ ...quest, chain: { ...quest.chain, ...patch } });

  const setJobRequirement = (jobId: string) => {
    if (!jobId) {
      setChain({ requiresJob: undefined });
      return;
    }
    const existing = quest.chain.requiresJob;
    setChain({
      requiresJob: {
        jobId,
        level: existing?.jobId === jobId ? existing.level : 1,
      },
    });
  };

  const clearRequires = () => {
    const prereq = quest.chain.requires
      ? project.quests.find((q) => q.name === quest.chain.requires)
      : undefined;
    if (prereq && onChangeProject) {
      onChangeProject(disconnectQuests(project, prereq.id, quest.id));
      return;
    }
    setChain({ requires: undefined });
  };

  const clearUnlocks = () => {
    const next = quest.chain.unlocks
      ? project.quests.find((q) => q.name === quest.chain.unlocks)
      : undefined;
    if (next && onChangeProject) {
      onChangeProject(disconnectQuests(project, quest.id, next.id));
      return;
    }
    setChain({ unlocks: undefined });
  };

  return (
    <div>
      <h1 className="step-title">{t('chain.title')}</h1>
      <p className="step-sub">
        {canvasFirst ? t('chain.subtitleCanvas') : t('chain.subtitleEditor')}
      </p>

      <div className="card">
        <h3>{t('chain.storyOrder')}</h3>
        <ChainTopologySummary
          quest={quest}
          project={project}
          onClearRequires={quest.chain.requires ? clearRequires : undefined}
          onClearUnlocks={quest.chain.unlocks ? clearUnlocks : undefined}
        />
        {!canvasFirst && (
          <details className="chain-manual-edit">
            <summary>{t('chain.manualEdit')}</summary>
            <div className="chain-manual-fields">
              <Select
                label={t('chain.requiresQuestFirst')}
                hint={t('chain.requiresQuestFirstHint')}
                value={quest.chain.requires ?? ''}
                options={questOptions}
                onChange={(requires) => setChain({ requires: requires || undefined })}
              />
              <Select
                label={t('chain.completingUnlocks')}
                hint={t('chain.completingUnlocksHint')}
                value={quest.chain.unlocks ?? ''}
                options={questOptions}
                onChange={(unlocks) => setChain({ unlocks: unlocks || undefined })}
              />
            </div>
          </details>
        )}
      </div>

      <div className="card">
        <h3>{t('chain.jobRequirement')}</h3>
        <Select
          label={t('chain.requiresJobLevel')}
          hint={t('chain.requiresJobLevelHint')}
          value={quest.chain.requiresJob?.jobId ?? ''}
          options={jobOptions}
          onChange={setJobRequirement}
        />
        {quest.chain.requiresJob && (
          <NumberInput
            label={t('chain.minimumLevel')}
            value={quest.chain.requiresJob.level}
            min={1}
            onChange={(level) =>
              setChain({
                requiresJob: { ...quest.chain.requiresJob!, level },
              })
            }
          />
        )}
        {jobs.length === 0 && (
          <p className="hint">{t('chain.noJobsHint')}</p>
        )}
      </div>

      <div className="card">
        <h3>{t('chain.followUp')}</h3>
        <Field label={t('chain.autoStart')} hint={t('chain.autoStartHint')}>
          <label className="muted" style={{ display: 'flex', gap: 8, alignItems: 'center', fontWeight: 500 }}>
            <input
              type="checkbox"
              style={{ width: 'auto' }}
              checked={quest.chain.autoStart}
              onChange={(e) => setChain({ autoStart: e.target.checked })}
            />
            {t('chain.autoStartCheckbox')}
          </label>
        </Field>
        {!quest.chain.unlocks && (
          <p className="hint">{t('chain.autoStartNoUnlockHint')}</p>
        )}
      </div>

      <div className="card">
        <h3>{t('chain.announcement')}</h3>
        <Field label={t('chain.announceCompletion')} hint={t('chain.announceHint')}>
          <label className="muted" style={{ display: 'flex', gap: 8, alignItems: 'center', fontWeight: 500 }}>
            <input
              type="checkbox"
              style={{ width: 'auto' }}
              checked={quest.chain.announce}
              onChange={(e) => setChain({ announce: e.target.checked })}
            />
            {t('chain.announceCheckbox')}
          </label>
        </Field>
      </div>
    </div>
  );
}
