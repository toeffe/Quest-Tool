import { type Project, type Quest } from '../../types/quest';
import { Field, Select, NumberInput } from '../ui/Field';

interface Props {
  quest: Quest;
  project: Project;
  onChange: (quest: Quest) => void;
}

export function StepChain({ quest, project, onChange }: Props) {
  const others = project.quests.filter((q) => q.id !== quest.id);
  const jobs = project.jobs ?? [];
  const noneOption = { value: '', label: '— None —' };
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
        <h3>Job requirement</h3>
        <Select
          label="Requires job level"
          hint="Quest stays locked until the player reaches the required job level."
          value={quest.chain.requiresJob?.jobId ?? ''}
          options={jobOptions}
          onChange={setJobRequirement}
        />
        {quest.chain.requiresJob && (
          <NumberInput
            label="Minimum level"
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
          <p className="hint">Add a job in the Jobs tab to gate quests by skill level.</p>
        )}
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
