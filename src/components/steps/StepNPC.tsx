import { type Coordinates, type Quest, type SpawnMode } from '../../types/quest';
import { TextInput, TextArea, Select, NumberInput, DataListInput } from '../ui/Field';
import { toIdentifier } from '../../types/ids';
import { MOB_OPTIONS } from '../../data/mobs';
import { VariantFields } from './VariantFields';
import { QuestPreview } from '../preview/QuestPreview';

interface Props {
  quest: Quest;
  onChange: (quest: Quest) => void;
}

const PROFESSIONS = [
  'none', 'armorer', 'butcher', 'cartographer', 'cleric', 'farmer', 'fisherman',
  'fletcher', 'leatherworker', 'librarian', 'mason', 'nitwit', 'shepherd',
  'toolsmith', 'weaponsmith',
];

const VARIANTS = ['plains', 'desert', 'jungle', 'savanna', 'snow', 'swamp', 'taiga'];

/** Villagers expose profession/variant appearance options; other mobs do not. */
function isVillager(entityType: string): boolean {
  return (entityType ?? 'minecraft:villager') === 'minecraft:villager';
}

const SPAWN_MODES: { value: SpawnMode; label: string }[] = [
  { value: 'player', label: 'At my location (recommended)' },
  { value: 'fixed', label: 'Fixed coordinates' },
  { value: 'manual', label: 'I will place it manually' },
];

export function CoordsRow({
  value,
  onChange,
}: {
  value: Coordinates;
  onChange: (c: Coordinates) => void;
}) {
  return (
    <div className="grid-3">
      <NumberInput label="X" value={value.x} onChange={(x) => onChange({ ...value, x })} />
      <NumberInput label="Y" value={value.y} onChange={(y) => onChange({ ...value, y })} />
      <NumberInput label="Z" value={value.z} onChange={(z) => onChange({ ...value, z })} />
    </div>
  );
}

export function StepNPC({ quest, onChange }: Props) {
  const npc = quest.npc;
  const update = (patch: Partial<typeof npc>) => onChange({ ...quest, npc: { ...npc, ...patch } });
  const updateDialogue = (patch: Partial<typeof npc.dialogue>) =>
    update({ dialogue: { ...npc.dialogue, ...patch } });

  return (
    <div>
      <h1 className="step-title">Quest Giver (NPC)</h1>
      <p className="step-sub">
        Design the villager who offers this quest. They greet players nearby, hand out
        the quest, and accept the turn-in.
      </p>

      <div className="card">
        <h3>Identity</h3>
        <TextInput
          label="NPC name"
          hint="Shown floating above the villager and in dialogue."
          value={npc.name}
          onChange={(name) => update({ name, tag: toIdentifier(name, npc.tag) })}
        />
        <TextInput
          label="Unique tag"
          hint="Auto-generated id used to find this NPC. Keep it unique per NPC."
          value={npc.tag}
          onChange={(tag) => update({ tag: toIdentifier(tag) })}
        />
        <DataListInput
          label="Entity type"
          hint="Any Minecraft mob can be a quest giver (villager, piglin, zombie, etc.). You can also type a custom/modded entity id."
          value={npc.entityType ?? 'minecraft:villager'}
          onChange={(entityType) => update({ entityType })}
          options={MOB_OPTIONS}
          listId="mc-mob-list"
          placeholder="minecraft:villager"
        />
        {isVillager(npc.entityType) ? (
          <div className="grid-2">
            <Select
              label="Profession (appearance)"
              value={npc.profession}
              options={PROFESSIONS.map((p) => ({ value: p, label: p }))}
              onChange={(profession) => update({ profession })}
            />
            <Select
              label="Biome variant (appearance)"
              value={npc.variant}
              options={VARIANTS.map((v) => ({ value: v, label: v }))}
              onChange={(variant) => update({ variant })}
            />
          </div>
        ) : (
          <VariantFields
            entityType={npc.entityType}
            variants={npc.variants}
            onChange={(variants) => update({ variants })}
          />
        )}
      </div>

      <div className="card">
        <h3>Dialogue</h3>
        <TextArea
          label="Greeting"
          hint="First line shown when a player walks up before starting the quest."
          value={npc.dialogue.greeting}
          onChange={(greeting) => updateDialogue({ greeting })}
        />
        <TextArea
          label="Offer"
          hint="The pitch shown just above the clickable [Accept Quest] button."
          value={npc.dialogue.offer}
          onChange={(offer) => updateDialogue({ offer })}
        />
        <TextArea
          label="In-progress"
          hint="Shown when a player returns while the quest is still unfinished."
          value={npc.dialogue.inProgress}
          onChange={(inProgress) => updateDialogue({ inProgress })}
        />
        <TextArea
          label="Completion"
          hint="Shown when the quest is turned in and rewards are granted."
          value={npc.dialogue.completion}
          onChange={(completion) => updateDialogue({ completion })}
        />

        <div style={{ marginTop: 16 }}>
          <QuestPreview quest={quest} variant="dialogue" />
        </div>
      </div>

      <div className="card">
        <h3>Spawn location</h3>
        <Select
          label="How should this NPC be placed?"
          hint="Player location is easiest: stand where you want it and run the spawn command."
          value={npc.spawnMode}
          options={SPAWN_MODES}
          onChange={(spawnMode) =>
            update({
              spawnMode,
              coordinates:
                spawnMode === 'fixed'
                  ? npc.coordinates ?? { x: 0, y: 64, z: 0 }
                  : npc.coordinates,
            })
          }
        />
        {npc.spawnMode === 'fixed' && (
          <CoordsRow
            value={npc.coordinates ?? { x: 0, y: 64, z: 0 }}
            onChange={(coordinates) => update({ coordinates })}
          />
        )}
      </div>
    </div>
  );
}
