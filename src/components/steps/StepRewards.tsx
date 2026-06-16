import {
  type Platform,
  type Quest,
  type Reward,
  type RewardType,
  REWARD_TYPE_LABELS,
} from '../../types/quest';
import { isRewardSupported } from '../../generator/platform';

interface Props {
  quest: Quest;
  platform: Platform;
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

export function StepRewards({ quest, platform, onChange }: Props) {
  const rewards = quest.rewards;
  const setRewards = (next: Reward[]) => onChange({ ...quest, rewards: next });

  const update = (i: number, patch: Partial<Reward>) =>
    setRewards(rewards.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  const remove = (i: number) => setRewards(rewards.filter((_, idx) => idx !== i));
  const add = () => setRewards([...rewards, defaultReward('item')]);

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
          const showValue = reward.type === 'item' || reward.type === 'permission' || reward.type === 'command';
          const showAmount = reward.type === 'item' || reward.type === 'xp' || reward.type === 'money';
          return (
            <div key={i} className="card" style={{ background: 'var(--bg)', marginBottom: 12 }}>
              <div className="list-row">
                <div className="field">
                  <label>Type</label>
                  <select
                    value={reward.type}
                    onChange={(e) => {
                      const type = e.target.value as RewardType;
                      setRewards(rewards.map((r, idx) => (idx === i ? defaultReward(type) : r)));
                    }}
                  >
                    {REWARD_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {REWARD_TYPE_LABELS[t]}
                      </option>
                    ))}
                  </select>
                </div>

                {showValue && (
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
              {reward.type === 'item' && (
                <div className="hint">
                  Use an exact Minecraft item id (e.g. minecraft:diamond, minecraft:golden_apple). A
                  typo means the item silently won't be given in-game.
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
