import {
  type Job,
  type JobMilestone,
  type JobMilestoneReward,
  type JobMilestoneRewardType,
  JOB_MILESTONE_REWARD_LABELS,
} from '../types/job';
import { type CustomItem } from '../types/item';
import { NumberInput } from './ui/Field';

interface Props {
  job: Job;
  customItems: CustomItem[];
  onChange: (milestones: JobMilestone[]) => void;
}

const REWARD_TYPES = Object.keys(JOB_MILESTONE_REWARD_LABELS) as JobMilestoneRewardType[];

function defaultMilestoneReward(type: JobMilestoneRewardType): JobMilestoneReward {
  switch (type) {
    case 'item':
      return { type, value: 'minecraft:diamond', amount: 1 };
    case 'xp':
      return { type, amount: 50 };
    case 'money':
      return { type, amount: 100 };
    case 'command':
      return { type, value: 'say {player} reached a job milestone!' };
  }
}

export function JobMilestonesEditor({ job, customItems, onChange }: Props) {
  const milestones = job.milestones ?? [];

  const setMilestones = (next: JobMilestone[]) => onChange(next);

  const addMilestone = () => {
    const used = new Set(milestones.map((m) => m.level));
    let level = 5;
    while (used.has(level) && level <= job.maxLevel) level += 1;
    if (level > job.maxLevel) level = job.maxLevel;
    setMilestones([...milestones, { level, rewards: [] }].sort((a, b) => a.level - b.level));
  };

  const updateMilestone = (index: number, patch: Partial<JobMilestone>) => {
    setMilestones(
      milestones
        .map((m, i) => (i === index ? { ...m, ...patch } : m))
        .sort((a, b) => a.level - b.level),
    );
  };

  const removeMilestone = (index: number) => {
    setMilestones(milestones.filter((_, i) => i !== index));
  };

  const updateReward = (mi: number, ri: number, patch: Partial<JobMilestoneReward>) => {
    const m = milestones[mi];
    const rewards = m.rewards.map((r, i) => (i === ri ? { ...r, ...patch } : r));
    updateMilestone(mi, { rewards });
  };

  return (
    <div className="card">
      <div className="row-between" style={{ marginBottom: 12 }}>
        <h3 style={{ margin: 0 }}>Milestone rewards</h3>
        <button type="button" className="btn small" onClick={addMilestone}>
          + Add milestone
        </button>
      </div>
      <p className="hint" style={{ marginTop: 0 }}>
        Granted automatically when a player reaches the level in-game. Link custom items from the
        Custom Items tab.
      </p>

      {milestones.length === 0 && (
        <p className="muted">No milestones yet. Add levels 5, 10, 25, 50 to reward loyal players.</p>
      )}

      {milestones.map((milestone, mi) => (
        <div key={`${milestone.level}-${mi}`} className="card" style={{ background: 'var(--bg)', marginBottom: 12 }}>
          <div className="row-between" style={{ marginBottom: 10 }}>
            <NumberInput
              label="At level"
              value={milestone.level}
              min={1}
              onChange={(level) => updateMilestone(mi, { level: Math.min(job.maxLevel, level) })}
            />
            <button type="button" className="btn small danger" onClick={() => removeMilestone(mi)}>
              Remove
            </button>
          </div>

          {milestone.rewards.length === 0 && (
            <p className="muted" style={{ marginTop: 0 }}>
              No rewards configured — this milestone will be skipped in the datapack.
            </p>
          )}

          {milestone.rewards.map((reward, ri) => (
            <div key={ri} className="list-row" style={{ marginBottom: 8, alignItems: 'flex-end' }}>
              <div className="field">
                <label>Type</label>
                <select
                  value={reward.type}
                  onChange={(e) => {
                    const type = e.target.value as JobMilestoneRewardType;
                    const next = defaultMilestoneReward(type);
                    if (type === 'item' && customItems[0]) {
                      next.customItemId = customItems[0].id;
                      next.value = undefined;
                    }
                    updateReward(mi, ri, next);
                  }}
                >
                  {REWARD_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {JOB_MILESTONE_REWARD_LABELS[t]}
                    </option>
                  ))}
                </select>
              </div>

              {reward.type === 'item' && (
                <div className="field" style={{ flex: 2 }}>
                  <label>Item</label>
                  {customItems.length > 0 ? (
                    <select
                      value={reward.customItemId ?? ''}
                      onChange={(e) => {
                        const id = e.target.value;
                        if (id) {
                          updateReward(mi, ri, { customItemId: id, value: undefined });
                        } else {
                          updateReward(mi, ri, {
                            customItemId: undefined,
                            value: reward.value ?? 'minecraft:diamond',
                          });
                        }
                      }}
                    >
                      <option value="">Vanilla: {reward.value ?? 'minecraft:diamond'}</option>
                      {customItems.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      value={reward.value ?? 'minecraft:diamond'}
                      onChange={(e) =>
                        updateReward(mi, ri, { value: e.target.value, customItemId: undefined })
                      }
                    />
                  )}
                </div>
              )}

              {(reward.type === 'item' ||
                reward.type === 'xp' ||
                reward.type === 'money') && (
                <div className="field">
                  <label>Amount</label>
                  <input
                    type="number"
                    min={1}
                    value={reward.amount ?? 1}
                    onChange={(e) => updateReward(mi, ri, { amount: +e.target.value })}
                  />
                </div>
              )}

              {reward.type === 'command' && (
                <div className="field" style={{ flex: 2 }}>
                  <label>Command</label>
                  <input
                    value={reward.value ?? ''}
                    onChange={(e) => updateReward(mi, ri, { value: e.target.value })}
                    placeholder="effect give {player} minecraft:speed 60 1"
                  />
                </div>
              )}

              <button
                type="button"
                className="btn small danger"
                onClick={() =>
                  updateMilestone(mi, {
                    rewards: milestone.rewards.filter((_, i) => i !== ri),
                  })
                }
              >
                ✕
              </button>
            </div>
          ))}

          <button
            type="button"
            className="btn small"
            onClick={() =>
              updateMilestone(mi, {
                rewards: [...milestone.rewards, defaultMilestoneReward('item')],
              })
            }
          >
            + Add reward
          </button>
        </div>
      ))}
    </div>
  );
}
