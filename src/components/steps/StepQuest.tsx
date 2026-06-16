import {
  type Objective,
  type Quest,
  type QuestType,
  type SpawnMode,
  type TargetNpc,
  QUEST_TYPE_LABELS,
} from '../../types/quest';
import {
  TextInput,
  TextArea,
  NumberInput,
  Select,
  PillSelect,
  Field,
  DataListInput,
} from '../ui/Field';
import { defaultObjectiveFor, newObjectiveFor } from '../../types/factory';
import { toIdentifier } from '../../types/ids';
import { CoordsRow } from './StepNPC';
import { MOB_OPTIONS, isVillager } from '../../data/mobs';
import { VariantFields, BabySelect } from './VariantFields';
import { QuestPreview } from '../preview/QuestPreview';

interface Props {
  quest: Quest;
  onChange: (quest: Quest) => void;
}

const TYPE_OPTIONS = (Object.keys(QUEST_TYPE_LABELS) as QuestType[]).map((t) => ({
  value: t,
  label: QUEST_TYPE_LABELS[t],
}));

const SPAWN_MODES: { value: SpawnMode; label: string }[] = [
  { value: 'player', label: 'At my location' },
  { value: 'fixed', label: 'Fixed coordinates' },
  { value: 'manual', label: 'Manual' },
];

const usesItemTarget = (t: QuestType) => t === 'gather' || t === 'delivery' || t === 'daily';

export function StepQuest({ quest, onChange }: Props) {
  const objectives: Objective[] = quest.objectives.length ? quest.objectives : [{}];
  const isMultiType = quest.type !== 'talk';

  const setObjectiveAt = (i: number, patch: Partial<Objective>) =>
    onChange({
      ...quest,
      objectives: objectives.map((o, idx) => (idx === i ? { ...o, ...patch } : o)),
    });

  const addObjective = () =>
    onChange({ ...quest, objectives: [...objectives, newObjectiveFor(quest.type)] });

  const removeObjective = (i: number) =>
    onChange({ ...quest, objectives: objectives.filter((_, idx) => idx !== i) });

  function changeType(type: QuestType) {
    onChange({
      ...quest,
      type,
      objectives: defaultObjectiveFor(type),
      cooldownSeconds: type === 'daily' ? quest.cooldownSeconds || 86400 : quest.cooldownSeconds,
      targetNpc: type === 'talk' ? quest.targetNpc : undefined,
    });
  }

  function setTarget(patch: Partial<TargetNpc>) {
    const base: TargetNpc =
      quest.targetNpc ?? {
        name: 'Target NPC',
        tag: 'target_npc',
        entityType: 'minecraft:villager',
        dialogue: 'You found me! Now return to the quest giver.',
        spawnMode: 'player',
      };
    onChange({ ...quest, targetNpc: { ...base, ...patch } });
  }

  return (
    <div>
      <h1 className="step-title">Quest Definition</h1>
      <p className="step-sub">Pick what the player must do and describe the objective.</p>

      <div className="card">
        <h3>Type</h3>
        <Field label="Quest type" hint="This decides how progress is tracked in-game.">
          <PillSelect value={quest.type} options={TYPE_OPTIONS} onChange={changeType} />
        </Field>
        <div className="grid-2">
          <TextInput
            label="Quest name"
            hint="Must be unique within the project."
            value={quest.name}
            onChange={(name) => onChange({ ...quest, name })}
          />
          <TextInput
            label="Category"
            hint="A label for organizing quests (e.g. Main, Side, Daily)."
            value={quest.category}
            onChange={(category) => onChange({ ...quest, category })}
          />
        </div>
        <TextArea
          label="Description"
          hint="A short summary of the quest's story or purpose."
          value={quest.description}
          onChange={(description) => onChange({ ...quest, description })}
        />
      </div>

      <div className="card">
        <div className="row-between" style={{ marginBottom: 14 }}>
          <h3 style={{ margin: 0 }}>{isMultiType ? 'Objectives' : 'Objective'}</h3>
          {isMultiType && (
            <button className="btn small" onClick={addObjective}>
              + Add objective
            </button>
          )}
        </div>

        {isMultiType && objectives.length > 1 && (
          <p className="muted" style={{ marginTop: -6, marginBottom: 14, fontSize: 13 }}>
            The player must complete every objective below before turning the quest in.
          </p>
        )}

        {objectives.map((obj, i) => {
          const showSub = isMultiType && objectives.length > 1;
          const fields = (
            <>
              <TextInput
                label="Objective text"
                hint="Shown to the player on the action bar and in chat."
                value={obj.description ?? ''}
                onChange={(description) => setObjectiveAt(i, { description })}
              />

              {quest.type === 'kill' && (
                <div className="grid-2">
                  <DataListInput
                    label="Mob / creature"
                    hint="Pick any Minecraft mob, or type a custom/modded entity id."
                    value={obj.target ?? ''}
                    onChange={(target) => setObjectiveAt(i, { target })}
                    options={MOB_OPTIONS}
                    listId="mc-mob-list"
                    placeholder="minecraft:zombie"
                  />
                  <NumberInput
                    label="Amount to kill"
                    min={1}
                    value={obj.amount ?? 1}
                    onChange={(amount) => setObjectiveAt(i, { amount })}
                  />
                </div>
              )}

              {usesItemTarget(quest.type) && (
                <div className="grid-2">
                  <TextInput
                    label="Item id"
                    hint="e.g. minecraft:wheat, minecraft:diamond"
                    value={obj.target ?? ''}
                    onChange={(target) => setObjectiveAt(i, { target })}
                  />
                  <NumberInput
                    label="Amount required"
                    min={1}
                    value={obj.amount ?? 1}
                    onChange={(amount) => setObjectiveAt(i, { amount })}
                  />
                </div>
              )}

              {quest.type === 'exploration' && (
                <>
                  <CoordsRow
                    value={obj.location ?? { x: 0, y: 64, z: 0 }}
                    onChange={(location) => setObjectiveAt(i, { location })}
                  />
                  <NumberInput
                    label="Discovery radius (blocks)"
                    hint="How close the player must get to the location."
                    min={1}
                    value={obj.radius ?? 5}
                    onChange={(radius) => setObjectiveAt(i, { radius })}
                  />
                </>
              )}
            </>
          );

          if (!showSub) return <div key={i}>{fields}</div>;
          return (
            <div key={i} className="card" style={{ background: 'var(--bg)', marginBottom: 12 }}>
              <div className="row-between" style={{ marginBottom: 12 }}>
                <strong>Objective {i + 1}</strong>
                <button className="btn small danger" onClick={() => removeObjective(i)}>
                  Remove
                </button>
              </div>
              {fields}
            </div>
          );
        })}

        {quest.type === 'talk' && (
          <p className="muted" style={{ fontSize: 13 }}>
            Talk quests complete by speaking to an NPC. Add a separate target NPC below if the
            player must visit someone other than the quest giver.
          </p>
        )}

        {quest.type === 'daily' && (
          <NumberInput
            label="Cooldown (seconds)"
            hint="Time before the quest can be taken again. 86400 = 24 hours."
            min={1}
            value={quest.cooldownSeconds}
            onChange={(cooldownSeconds) => onChange({ ...quest, cooldownSeconds })}
          />
        )}

        {quest.type !== 'talk' && (
          <div style={{ marginTop: 16 }}>
            <QuestPreview quest={quest} variant="objective" />
          </div>
        )}
      </div>

      {quest.type === 'talk' && (
        <div className="card">
          <h3>Target NPC (optional)</h3>
          <Field
            label="Require visiting a separate NPC?"
            hint="When enabled, the player must reach this NPC, then return to the giver."
          >
            <PillSelect
              value={quest.targetNpc ? 'yes' : 'no'}
              options={[
                { value: 'no', label: 'No - talk to the giver' },
                { value: 'yes', label: 'Yes - visit a target NPC' },
              ]}
              onChange={(v) =>
                v === 'yes'
                  ? setTarget({})
                  : onChange({ ...quest, targetNpc: undefined })
              }
            />
          </Field>

          {quest.targetNpc && (
            <>
              <div className="grid-2">
                <TextInput
                  label="Target name"
                  value={quest.targetNpc.name}
                  onChange={(name) =>
                    setTarget({ name, tag: toIdentifier(name, quest.targetNpc!.tag) })
                  }
                />
                <TextInput
                  label="Target tag"
                  value={quest.targetNpc.tag}
                  onChange={(tag) => setTarget({ tag: toIdentifier(tag) })}
                />
              </div>
              <DataListInput
                label="Target entity type"
                hint="Any Minecraft mob, or a custom/modded entity id."
                value={quest.targetNpc.entityType ?? 'minecraft:villager'}
                onChange={(entityType) => setTarget({ entityType })}
                options={MOB_OPTIONS}
                listId="mc-mob-list"
                placeholder="minecraft:villager"
              />
              {isVillager(quest.targetNpc.entityType) ? (
                <BabySelect
                  value={quest.targetNpc.baby}
                  onChange={(baby) => setTarget({ baby })}
                />
              ) : (
                <VariantFields
                  entityType={quest.targetNpc.entityType}
                  variants={quest.targetNpc.variants}
                  onChange={(variants) => setTarget({ variants })}
                />
              )}
              <TextArea
                label="Target dialogue"
                hint="Shown when the player reaches this NPC."
                value={quest.targetNpc.dialogue}
                onChange={(dialogue) => setTarget({ dialogue })}
              />
              <Select
                label="Target spawn location"
                value={quest.targetNpc.spawnMode}
                options={SPAWN_MODES}
                onChange={(spawnMode) =>
                  setTarget({
                    spawnMode,
                    coordinates:
                      spawnMode === 'fixed'
                        ? quest.targetNpc!.coordinates ?? { x: 0, y: 64, z: 0 }
                        : quest.targetNpc!.coordinates,
                  })
                }
              />
              {quest.targetNpc.spawnMode === 'fixed' && (
                <CoordsRow
                  value={quest.targetNpc.coordinates ?? { x: 0, y: 64, z: 0 }}
                  onChange={(coordinates) => setTarget({ coordinates })}
                />
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
