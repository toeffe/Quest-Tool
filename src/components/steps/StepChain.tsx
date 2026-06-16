import { type Project, type Quest } from '../../types/quest';
import { Field, Select } from '../ui/Field';

interface Props {
  quest: Quest;
  project: Project;
  onChange: (quest: Quest) => void;
}

export function StepChain({ quest, project, onChange }: Props) {
  const others = project.quests.filter((q) => q.id !== quest.id);
  const noneOption = { value: '', label: '— None —' };
  const questOptions = [noneOption, ...others.map((q) => ({ value: q.name, label: q.name }))];

  const setChain = (patch: Partial<Quest['chain']>) =>
    onChange({ ...quest, chain: { ...quest.chain, ...patch } });

  return (
    <div>
      <h1 className="step-title">Quest Chain</h1>
      <p className="step-sub">
        Link quests into storylines. A quest can require a previous one and unlock the next.
      </p>

      <div className="card">
        <h3>Prerequisite</h3>
        <Select
          label="Requires this quest first"
          hint="This quest stays locked until the selected quest is completed."
          value={quest.chain.requires ?? ''}
          options={questOptions}
          onChange={(requires) => setChain({ requires: requires || undefined })}
        />
      </div>

      <div className="card">
        <h3>Follow-up</h3>
        <Select
          label="Completing this unlocks"
          hint="When this quest is finished, the selected quest becomes available."
          value={quest.chain.unlocks ?? ''}
          options={questOptions}
          onChange={(unlocks) => setChain({ unlocks: unlocks || undefined })}
        />

        <Field
          label="Auto-start when unlocked"
          hint="If enabled, this quest starts automatically once its prerequisite is complete (no need to talk to the giver to accept)."
        >
          <label className="muted" style={{ display: 'flex', gap: 8, alignItems: 'center', fontWeight: 500 }}>
            <input
              type="checkbox"
              style={{ width: 'auto' }}
              checked={quest.chain.autoStart}
              onChange={(e) => setChain({ autoStart: e.target.checked })}
            />
            Auto-start this quest
          </label>
        </Field>
      </div>

      <div className="card">
        <h3>Announcement</h3>
        <Field
          label="Announce completion to everyone"
          hint="Broadcasts a server-wide message in chat when a player completes this quest."
        >
          <label className="muted" style={{ display: 'flex', gap: 8, alignItems: 'center', fontWeight: 500 }}>
            <input
              type="checkbox"
              style={{ width: 'auto' }}
              checked={quest.chain.announce}
              onChange={(e) => setChain({ announce: e.target.checked })}
            />
            Broadcast a completion announcement
          </label>
        </Field>
      </div>
    </div>
  );
}
