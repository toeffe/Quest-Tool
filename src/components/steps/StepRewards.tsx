import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  type Platform,
  type Quest,
  type Reward,
  type RewardType,
} from '../../types/quest';
import { type CustomItem } from '../../types/item';
import { type Job } from '../../types/job';
import { isRewardSupported } from '../../generator/platform';
import { useRewardTypeLabels } from '../../i18n/useLabels';
import { PillSelect } from '../ui/Field';

interface Props {
  quest: Quest;
  platform: Platform;
  customItems: CustomItem[];
  jobs: Job[];
  onChange: (quest: Quest) => void;
}

function defaultReward(type: RewardType): Reward {
  switch (type) {
    case 'item':
      return { type, value: 'minecraft:diamond', amount: 1 };
    case 'xp':
      return { type, amount: 50 };
    case 'money':
      return { type, amount: 100 };
    case 'permission':
      return { type, value: 'quest.reward.example' };
    case 'command':
      return { type, value: 'say {player} finished the quest!' };
    case 'jobXp':
      return { type, amount: 50 };
  }
}

type ItemSource = 'vanilla' | 'custom';

function itemSource(reward: Reward): ItemSource {
  return reward.customItemId ? 'custom' : 'vanilla';
}

export function StepRewards({ quest, platform, customItems, jobs, onChange }: Props) {
  const { t } = useTranslation('editor');
  const { t: tc } = useTranslation('common');
  const rewardTypeLabels = useRewardTypeLabels();
  const REWARD_TYPES = Object.keys(rewardTypeLabels) as RewardType[];
  const rewards = quest.rewards;
  const setRewards = (next: Reward[]) => onChange({ ...quest, rewards: next });

  const valuePlaceholder = useMemo(
    () =>
      ({
        item: t('rewards.placeholders.item'),
        permission: t('rewards.placeholders.permission'),
        command: t('rewards.placeholders.command'),
      }) as Partial<Record<RewardType, string>>,
    [t],
  );

  const update = (i: number, patch: Partial<Reward>) =>
    setRewards(rewards.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  const remove = (i: number) => setRewards(rewards.filter((_, idx) => idx !== i));
  const add = () => setRewards([...rewards, defaultReward('item')]);

  const setItemSource = (i: number, source: ItemSource) => {
    const reward = rewards[i];
    if (source === 'custom') {
      const first = customItems[0];
      update(i, {
        customItemId: first?.id,
        value: undefined,
      });
    } else {
      update(i, {
        value: reward.value ?? 'minecraft:diamond',
        customItemId: undefined,
      });
    }
  };

  return (
    <div>
      <h1 className="step-title">{t('rewards.title')}</h1>
      <p className="step-sub">{t('rewards.subtitle')}</p>

      <div className="card">
        <div className="row-between" style={{ marginBottom: 14 }}>
          <h3 style={{ margin: 0 }}>{t('rewards.rewardList')}</h3>
          <button className="btn small" onClick={add}>
            {t('rewards.addReward')}
          </button>
        </div>

        {rewards.length === 0 && (
          <p className="muted">{t('rewards.empty')}</p>
        )}

        {rewards.map((reward, i) => {
          const support = isRewardSupported(platform, reward);
          const showAmount =
            reward.type === 'item' ||
            reward.type === 'xp' ||
            reward.type === 'money' ||
            reward.type === 'jobXp';
          const isItem = reward.type === 'item';
          const isJobXp = reward.type === 'jobXp';
          const source = itemSource(reward);
          return (
            <div key={i} className="card" style={{ background: 'var(--bg)', marginBottom: 12 }}>
              <div className="list-row">
                <div className="field">
                  <label>{t('rewards.type')}</label>
                  <select
                    value={reward.type}
                    onChange={(e) => {
                      const type = e.target.value as RewardType;
                      const next = defaultReward(type);
                      if (type === 'jobXp' && jobs[0]) {
                        (next as Reward).jobId = jobs[0].id;
                      }
                      setRewards(rewards.map((r, idx) => (idx === i ? next : r)));
                    }}
                  >
                    {REWARD_TYPES.map((rt) => (
                      <option key={rt} value={rt}>
                        {rewardTypeLabels[rt]}
                      </option>
                    ))}
                  </select>
                </div>

                {isItem && (
                  <div className="field" style={{ flex: 2 }}>
                    <label>{tc('itemSource.label')}</label>
                    <PillSelect
                      value={source}
                      options={[
                        { value: 'vanilla', label: tc('itemSource.vanilla') },
                        { value: 'custom', label: tc('itemSource.custom') },
                      ]}
                      onChange={(v) => setItemSource(i, v)}
                    />
                  </div>
                )}

                {isItem && source === 'vanilla' && (
                  <div className="field" style={{ flex: 2 }}>
                    <label>{t('quest.itemId')}</label>
                    <input
                      value={reward.value ?? ''}
                      placeholder={valuePlaceholder.item}
                      onChange={(e) => update(i, { value: e.target.value })}
                    />
                  </div>
                )}

                {isItem && source === 'custom' && (
                  <div className="field" style={{ flex: 2 }}>
                    <label>{tc('itemSource.custom')}</label>
                    {customItems.length === 0 ? (
                      <div className="hint" style={{ marginTop: 8 }}>
                        {tc('itemSource.noCustomItems')}
                      </div>
                    ) : (
                      <select
                        value={reward.customItemId ?? ''}
                        onChange={(e) =>
                          update(i, { customItemId: e.target.value, value: undefined })
                        }
                      >
                        {!reward.customItemId && <option value="">{tc('actions.selectItem')}</option>}
                        {customItems.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name} ({item.displayName})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}

                {isJobXp && (
                  <div className="field" style={{ flex: 2 }}>
                    <label>{t('rewards.job')}</label>
                    {jobs.length === 0 ? (
                      <div className="hint" style={{ marginTop: 8 }}>
                        {t('rewards.noJobs')}
                      </div>
                    ) : (
                      <select
                        value={reward.jobId ?? ''}
                        onChange={(e) => update(i, { jobId: e.target.value })}
                      >
                        {!reward.jobId && <option value="">{tc('actions.selectJob')}</option>}
                        {jobs.map((job) => (
                          <option key={job.id} value={job.id}>
                            {job.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}

                {(reward.type === 'permission' || reward.type === 'command') && (
                  <div className="field" style={{ flex: 2 }}>
                    <label>{reward.type === 'command' ? t('rewards.command') : t('rewards.value')}</label>
                    <input
                      value={reward.value ?? ''}
                      placeholder={valuePlaceholder[reward.type] ?? ''}
                      onChange={(e) => update(i, { value: e.target.value })}
                    />
                  </div>
                )}

                {showAmount && (
                  <div className="field" style={{ maxWidth: 120 }}>
                    <label>{t('rewards.amount')}</label>
                    <input
                      type="number"
                      min={1}
                      value={reward.amount ?? 1}
                      onChange={(e) => update(i, { amount: Number(e.target.value) })}
                    />
                  </div>
                )}

                <button className="btn small danger" onClick={() => remove(i)}>
                  {tc('actions.remove')}
                </button>
              </div>

              {reward.type === 'command' && (
                <div className="hint">{t('rewards.commandPlaceholder')}</div>
              )}
              {isItem && source === 'vanilla' && (
                <div className="hint">{t('rewards.vanillaItemHint')}</div>
              )}
              {isItem && source === 'custom' && (
                <div className="hint">{t('rewards.customItemHint')}</div>
              )}
              {isJobXp && (
                <div className="hint">{t('rewards.jobXpHint')}</div>
              )}
              {support.note && (
                <div className="hint" style={{ color: 'var(--gold)' }}>
                  {support.note}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
