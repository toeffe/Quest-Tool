import {
  type Platform,
  type Quest,
  type Reward,
  type RewardType,
  REWARD_TYPE_LABELS,
} from '../../types/quest';
import { type CustomItem } from '../../types/item';
import { type Job } from '../../types/job';
import { isRewardSupported } from '../../generator/platform';
import { PillSelect } from '../ui/Field';

interface Props {
  quest: Quest;
  platform: Platform;
  customItems: CustomItem[];
  jobs: Job[];
  onChange: (quest: Quest) => void;
}

const REWARD_TYPES = Object.keys(REWARD_TYPE_LABELS) as RewardType[];

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

function valuePlaceholder(type: RewardType): string {
  switch (type) {
    case 'item':
      return 'minecraft:diamond';
    case 'permission':
      return 'group.vip or some.permission.node';
    case 'command':
      return 'effect give {player} minecraft:speed 30 1';
    default:
      return '';
  }
}

type ItemSource = 'vanilla' | 'custom';

function itemSource(reward: Reward): ItemSource {
  return reward.customItemId ? 'custom' : 'vanilla';
}

export function StepRewards({ quest, platform, customItems, jobs, onChange }: Props) {
  const rewards = quest.rewards;
  const setRewards = (next: Reward[]) => onChange({ ...quest, rewards: next });

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
      <h1 className="step-title">Rewards</h1>
      <p className="step-sub">
        What the player receives on completion. Add as many as you like.
      </p>

      <div className="card">
        <div className="row-between" style={{ marginBottom: 14 }}>
          <h3 style={{ margin: 0 }}>Reward list</h3>
          <button className="btn small" onClick={add}>
            + Add reward
          </button>
        </div>

        {rewards.length === 0 && (
          <p className="muted">No rewards yet. Click "Add reward" to create one.</p>
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
                  <label>Type</label>
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
                    {REWARD_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {REWARD_TYPE_LABELS[t]}
                      </option>
                    ))}
                  </select>
                </div>

                {isItem && (
                  <div className="field" style={{ flex: 2 }}>
                    <label>Item source</label>
                    <PillSelect
                      value={source}
                      options={[
                        { value: 'vanilla', label: 'Vanilla item' },
                        { value: 'custom', label: 'Custom item' },
                      ]}
                      onChange={(v) => setItemSource(i, v)}
                    />
                  </div>
                )}

                {isItem && source === 'vanilla' && (
                  <div className="field" style={{ flex: 2 }}>
                    <label>Item id</label>
                    <input
                      value={reward.value ?? ''}
                      placeholder={valuePlaceholder('item')}
                      onChange={(e) => update(i, { value: e.target.value })}
                    />
                  </div>
                )}

                {isItem && source === 'custom' && (
                  <div className="field" style={{ flex: 2 }}>
                    <label>Custom item</label>
                    {customItems.length === 0 ? (
                      <div className="hint" style={{ marginTop: 8 }}>
                        No custom items yet. Open the Custom Items tab to create one.
                      </div>
                    ) : (
                      <select
                        value={reward.customItemId ?? ''}
                        onChange={(e) =>
                          update(i, { customItemId: e.target.value, value: undefined })
                        }
                      >
                        {!reward.customItemId && <option value="">Select an item…</option>}
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
                    <label>Job</label>
                    {jobs.length === 0 ? (
                      <div className="hint" style={{ marginTop: 8 }}>
                        No jobs yet. Open the Jobs tab to create one.
                      </div>
                    ) : (
                      <select
                        value={reward.jobId ?? ''}
                        onChange={(e) => update(i, { jobId: e.target.value })}
                      >
                        {!reward.jobId && <option value="">Select a job…</option>}
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
                    <label>{reward.type === 'command' ? 'Command' : 'Value'}</label>
                    <input
                      value={reward.value ?? ''}
                      placeholder={valuePlaceholder(reward.type)}
                      onChange={(e) => update(i, { value: e.target.value })}
                    />
                  </div>
                )}

                {showAmount && (
                  <div className="field" style={{ maxWidth: 120 }}>
                    <label>Amount</label>
                    <input
                      type="number"
                      min={1}
                      value={reward.amount ?? 1}
                      onChange={(e) => update(i, { amount: Number(e.target.value) })}
                    />
                  </div>
                )}

                <button className="btn small danger" onClick={() => remove(i)}>
                  Remove
                </button>
              </div>

              {reward.type === 'command' && (
                <div className="hint">Use {'{player}'} as a placeholder for the rewarded player.</div>
              )}
              {isItem && source === 'vanilla' && (
                <div className="hint">
                  Use an exact Minecraft item id (e.g. minecraft:diamond). A typo means the item
                  silently won't be given in-game.
                </div>
              )}
              {isItem && source === 'custom' && (
                <div className="hint">
                  Gives the item with its custom name, lore, and components from the Items tab.
                </div>
              )}
              {isJobXp && (
                <div className="hint">
                  Grants bonus job XP on quest completion (in addition to passive XP from actions).
                </div>
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
