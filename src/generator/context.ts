import { type Project, type Quest } from '../types/quest';
import { type CustomItem } from '../types/item';
import { toIdentifier } from '../types/ids';

/**
 * Stable, short identifiers for a quest's scoreboard objectives and entity tags.
 * Objective names are kept short (well under any historical 16-char limit) and
 * derived from the quest's slot index so generated functions stay readable.
 */
/** Per-objective scoreboard names for one quest objective. */
export interface ObjectiveScores {
  /** Dummy progress counter (items held for gather/delivery/daily). */
  progress: string;
  /** Kill-criterion objective (kill quests only). */
  killed: string;
  /** Reached latch (exploration only): 1 once the player gets close enough. */
  reached: string;
  /** Entity tag for quest-spawned kill mobs (kill spawn zones only). */
  mobTag: string;
  /** Fake-player holder for spawn timer ticks on qt_sys. */
  timerHolder: string;
  /** Fake-player holder for live mob count on qt_sys. */
  liveHolder: string;
}

export interface QuestContext {
  quest: Quest;
  /** Slot index in the project (also used to name objectives). */
  index: number;
  /** State machine objective: 0 available, 1 active, 2 ready-to-turn-in, 3 done, -1 locked. */
  state: string;
  /** Per-objective scoreboard names, one entry per quest objective. */
  objectives: ObjectiveScores[];
  /** Aggregate counter of how many objectives are currently satisfied. */
  done: string;
  /** "Near the giver" latch so dialogue fires once per approach. */
  near: string;
  /** Trigger objective players use to accept / turn in without cheats. */
  trigger: string;
  /** Unique tag binding the spawned giver to this quest. */
  giverTag: string;
  /** Unique tag binding the spawned target NPC to this quest (talk quests). */
  targetTag: string;
  /** Display tag for the giver NPC, derived from the user-facing npc tag. */
  npcTag: string;
  /** Display tag for the target NPC. */
  npcTargetTag: string;
  /** Folder (within the namespace function root) holding this quest's functions. */
  fnBase: string;
  /** mcfunction name for spawning the giver/target NPCs. */
  spawnFn: string;
}

export interface CompileContext {
  project: Project;
  namespace: string;
  quests: QuestContext[];
  /** Quick lookup from quest name to its context (for chains). */
  byName: Map<string, QuestContext>;
  /** Custom items keyed by internal id. */
  customItemsById: Map<string, CustomItem>;
}

/** A quest always compiles with at least one objective. */
export function questObjectives(quest: Quest): Quest['objectives'] {
  return quest.objectives.length ? quest.objectives : [{}];
}

export function buildContext(project: Project): CompileContext {
  const namespace = toIdentifier(project.namespace || project.name, 'questpack');
  const quests: QuestContext[] = project.quests.map((quest, index) => {
    const slug = toIdentifier(quest.name, `quest_${index}`);
    return {
      quest,
      index,
      state: `q${index}`,
      objectives: questObjectives(quest).map((_, j) => ({
        progress: `q${index}p${j}`,
        killed: `q${index}k${j}`,
        reached: `q${index}r${j}`,
        mobTag: `qk_${index}_${j}`,
        timerHolder: `#qk_${index}_${j}_t`,
        liveHolder: `#qk_${index}_${j}_live`,
      })),
      done: `q${index}d`,
      near: `q${index}n`,
      trigger: `q${index}t`,
      giverTag: `qg_${index}`,
      targetTag: `qtg_${index}`,
      npcTag: `npc_${toIdentifier(quest.npc.tag, slug)}`,
      npcTargetTag: quest.targetNpc
        ? `npc_${toIdentifier(quest.targetNpc.tag, `${slug}_target`)}`
        : '',
      fnBase: `quests/${index}_${slug}`.slice(0, 60),
      spawnFn: `spawn/${index}_${slug}`.slice(0, 60),
    };
  });

  const byName = new Map<string, QuestContext>();
  for (const qc of quests) byName.set(qc.quest.name, qc);

  const customItemsById = new Map<string, CustomItem>();
  for (const item of project.customItems ?? []) {
    customItemsById.set(item.id, item);
  }

  return { project, namespace, quests, byName, customItemsById };
}

/** Convert an entity/item id like "minecraft:zombie" to the stat suffix "minecraft.zombie". */
export function statId(id: string): string {
  const full = id.includes(':') ? id : `minecraft:${id}`;
  return full.replace(/:/g, '.');
}

/** Ensure an item/entity id has a namespace. */
export function namespaced(id: string): string {
  return id.includes(':') ? id : `minecraft:${id}`;
}
