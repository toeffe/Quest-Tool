import i18n from '../i18n';
import type { AppLocale } from '../i18n/types';
import type { CustomMob } from '../types/customMob';
import type { Dimension, TeleportPad } from '../types/dimension';
import type { Dungeon, DungeonRoom } from '../types/dungeon';
import { uid } from '../types/ids';
import type { CustomItem } from '../types/item';
import type { Job } from '../types/job';
import type { Objective, Project, Quest, Reward, ZoneDrop } from '../types/quest';

export const CLIPBOARD_MARKER = 1 as const;
export const CLIPBOARD_VERSION = 1 as const;

export type EntityKind =
  | 'quest'
  | 'customItem'
  | 'customMob'
  | 'job'
  | 'dungeon'
  | 'dimension'
  | 'teleportPad';

export interface QtmcClipboard {
  qtmc: typeof CLIPBOARD_MARKER;
  version: typeof CLIPBOARD_VERSION;
  root: { kind: EntityKind; id: string };
  entities: ClipboardEntities;
}

export interface ClipboardEntities {
  quests?: Quest[];
  customItems?: CustomItem[];
  customMobs?: CustomMob[];
  jobs?: Job[];
  dungeons?: Dungeon[];
  dimensions?: Dimension[];
  teleportPads?: TeleportPad[];
}

export interface PasteResult {
  project: Project;
  rootKind: EntityKind;
  rootId: string;
}

export class ClipboardError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ClipboardError';
  }
}

function projectLocale(project: Project): AppLocale {
  return project.locale === 'en' ? 'en' : 'da';
}

function duplicateName(name: string, locale: AppLocale): string {
  return `${name} ${i18n.getFixedT(locale, 'common')('actions.duplicateSuffix')}`;
}

function emptyBundle(): Required<ClipboardEntities> {
  return {
    quests: [],
    customItems: [],
    customMobs: [],
    jobs: [],
    dungeons: [],
    dimensions: [],
    teleportPads: [],
  };
}

function addUniqueById<T extends { id: string }>(list: T[], entity: T): void {
  if (!list.some((e) => e.id === entity.id)) list.push(structuredClone(entity));
}

function addItemRef(bundle: Required<ClipboardEntities>, project: Project, itemId?: string): void {
  if (!itemId) return;
  const item = (project.customItems ?? []).find((i) => i.id === itemId);
  if (item) addUniqueById(bundle.customItems, item);
}

function addMobRef(bundle: Required<ClipboardEntities>, project: Project, mobId?: string): void {
  if (!mobId) return;
  const mob = (project.customMobs ?? []).find((m) => m.id === mobId);
  if (mob) addUniqueById(bundle.customMobs, mob);
}

function addJobRef(bundle: Required<ClipboardEntities>, project: Project, jobId?: string): void {
  if (!jobId) return;
  const job = (project.jobs ?? []).find((j) => j.id === jobId);
  if (job) {
    addUniqueById(bundle.jobs, job);
    for (const milestone of job.milestones ?? []) {
      for (const reward of milestone.rewards) {
        addItemRef(bundle, project, reward.customItemId);
      }
    }
  }
}

function addDimensionRef(
  bundle: Required<ClipboardEntities>,
  project: Project,
  dimensionId?: string,
): void {
  if (!dimensionId) return;
  const dimension = (project.dimensions ?? []).find((d) => d.id === dimensionId);
  if (dimension) addUniqueById(bundle.dimensions, dimension);
}

function collectQuestRefs(
  bundle: Required<ClipboardEntities>,
  project: Project,
  quest: Quest,
  visitedQuestIds: Set<string>,
): void {
  if (visitedQuestIds.has(quest.id)) return;
  visitedQuestIds.add(quest.id);
  addUniqueById(bundle.quests, quest);

  if (quest.chain.requires) {
    const prereq = project.quests.find((q) => q.name === quest.chain.requires);
    if (prereq) collectQuestRefs(bundle, project, prereq, visitedQuestIds);
  }

  if (quest.chain.requiresJob?.jobId) {
    addJobRef(bundle, project, quest.chain.requiresJob.jobId);
  }

  for (const o of quest.objectives) {
    addItemRef(bundle, project, o.customItemId);
    addMobRef(bundle, project, o.eliteMobId);
    addDimensionRef(bundle, project, o.location?.dimensionId);
    for (const drop of o.zoneDrops ?? []) {
      addItemRef(bundle, project, drop.customItemId);
    }
  }

  for (const r of quest.rewards) {
    addItemRef(bundle, project, r.customItemId);
    addJobRef(bundle, project, r.jobId);
  }

  addDimensionRef(bundle, project, quest.npc.coordinates?.dimensionId);
  addDimensionRef(bundle, project, quest.targetNpc?.coordinates?.dimensionId);
}

function collectDungeonRefs(
  bundle: Required<ClipboardEntities>,
  project: Project,
  dungeon: Dungeon,
): void {
  addUniqueById(bundle.dungeons, dungeon);
  addDimensionRef(bundle, project, dungeon.dimensionId);
  for (const room of dungeon.rooms) {
    for (const spawn of room.spawns) {
      addMobRef(bundle, project, spawn.customMobId);
    }
  }
}

export function collectDependencies(
  kind: EntityKind,
  id: string,
  project: Project,
): ClipboardEntities {
  const bundle = emptyBundle();
  const visitedQuestIds = new Set<string>();

  switch (kind) {
    case 'quest': {
      const quest = project.quests.find((q) => q.id === id);
      if (!quest) throw new ClipboardError('Quest not found.');
      collectQuestRefs(bundle, project, quest, visitedQuestIds);
      break;
    }
    case 'customItem': {
      const item = (project.customItems ?? []).find((i) => i.id === id);
      if (!item) throw new ClipboardError('Custom item not found.');
      addUniqueById(bundle.customItems, item);
      break;
    }
    case 'customMob': {
      const mob = (project.customMobs ?? []).find((m) => m.id === id);
      if (!mob) throw new ClipboardError('Custom mob not found.');
      addUniqueById(bundle.customMobs, mob);
      break;
    }
    case 'job': {
      const job = (project.jobs ?? []).find((j) => j.id === id);
      if (!job) throw new ClipboardError('Job not found.');
      addUniqueById(bundle.jobs, job);
      for (const milestone of job.milestones ?? []) {
        for (const reward of milestone.rewards) {
          addItemRef(bundle, project, reward.customItemId);
        }
      }
      break;
    }
    case 'dungeon': {
      const dungeon = (project.dungeons ?? []).find((d) => d.id === id);
      if (!dungeon) throw new ClipboardError('Dungeon not found.');
      collectDungeonRefs(bundle, project, dungeon);
      break;
    }
    case 'dimension': {
      const dimension = (project.dimensions ?? []).find((d) => d.id === id);
      if (!dimension) throw new ClipboardError('Dimension not found.');
      addUniqueById(bundle.dimensions, dimension);
      break;
    }
    case 'teleportPad': {
      const pad = (project.teleportPads ?? []).find((p) => p.id === id);
      if (!pad) throw new ClipboardError('Teleport pad not found.');
      addUniqueById(bundle.teleportPads, pad);
      addDimensionRef(bundle, project, pad.at.dimensionId);
      addDimensionRef(bundle, project, pad.to.dimensionId);
      break;
    }
    default:
      throw new ClipboardError('Unsupported entity type.');
  }

  const result: ClipboardEntities = {};
  if (bundle.quests.length) result.quests = bundle.quests;
  if (bundle.customItems.length) result.customItems = bundle.customItems;
  if (bundle.customMobs.length) result.customMobs = bundle.customMobs;
  if (bundle.jobs.length) result.jobs = bundle.jobs;
  if (bundle.dungeons.length) result.dungeons = bundle.dungeons;
  if (bundle.dimensions.length) result.dimensions = bundle.dimensions;
  if (bundle.teleportPads.length) result.teleportPads = bundle.teleportPads;
  return result;
}

export function serializeClipboard(project: Project, kind: EntityKind, id: string): string {
  const entities = collectDependencies(kind, id, project);
  const clipboard: QtmcClipboard = {
    qtmc: CLIPBOARD_MARKER,
    version: CLIPBOARD_VERSION,
    root: { kind, id },
    entities,
  };
  return JSON.stringify(clipboard);
}

const ENTITY_KINDS: EntityKind[] = [
  'quest',
  'customItem',
  'customMob',
  'job',
  'dungeon',
  'dimension',
  'teleportPad',
];

function parseClipboard(json: string): QtmcClipboard {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new ClipboardError('Invalid clipboard data.');
  }
  if (!parsed || typeof parsed !== 'object') {
    throw new ClipboardError('Invalid clipboard data.');
  }
  const clip = parsed as Partial<QtmcClipboard>;
  if (clip.qtmc !== CLIPBOARD_MARKER) {
    throw new ClipboardError('Clipboard data is not from Quest Tool MC.');
  }
  if (clip.version !== CLIPBOARD_VERSION) {
    throw new ClipboardError('Unsupported clipboard version.');
  }
  if (!clip.root?.kind || !ENTITY_KINDS.includes(clip.root.kind)) {
    throw new ClipboardError('Unsupported entity type in clipboard.');
  }
  if (!clip.root.id || typeof clip.root.id !== 'string') {
    throw new ClipboardError('Invalid clipboard data.');
  }
  if (!clip.entities || typeof clip.entities !== 'object') {
    throw new ClipboardError('Invalid clipboard data.');
  }
  return clip as QtmcClipboard;
}

function itemTags(project: Project): Set<string> {
  return new Set((project.customItems ?? []).map((i) => i.tag));
}

function mobTags(project: Project): Set<string> {
  return new Set((project.customMobs ?? []).map((m) => m.tag));
}

function dungeonTags(project: Project): Set<string> {
  return new Set((project.dungeons ?? []).map((d) => d.tag));
}

function dimensionTags(project: Project): Set<string> {
  return new Set((project.dimensions ?? []).map((d) => d.tag));
}

function resolveUniqueTag(existing: Set<string>, tag: string): string {
  if (!existing.has(tag)) return tag;
  let n = 1;
  while (true) {
    const candidate = n === 1 ? `${tag}_copy` : `${tag}_copy${n}`;
    if (!existing.has(candidate)) return candidate;
    n++;
  }
}

function remapZoneDrop(drop: ZoneDrop, idMap: Map<string, string>): ZoneDrop {
  return {
    ...drop,
    customItemId: drop.customItemId ? idMap.get(drop.customItemId) ?? drop.customItemId : undefined,
  };
}

function remapObjective(obj: Objective, idMap: Map<string, string>): Objective {
  return {
    ...obj,
    customItemId: obj.customItemId ? idMap.get(obj.customItemId) ?? obj.customItemId : undefined,
    eliteMobId: obj.eliteMobId ? idMap.get(obj.eliteMobId) ?? obj.eliteMobId : undefined,
    location: obj.location
      ? {
          ...obj.location,
          dimensionId: obj.location.dimensionId
            ? idMap.get(obj.location.dimensionId) ?? obj.location.dimensionId
            : undefined,
        }
      : undefined,
    zoneDrops: obj.zoneDrops?.map((d) => remapZoneDrop(d, idMap)),
  };
}

function remapReward(reward: Reward, idMap: Map<string, string>): Reward {
  return {
    ...reward,
    customItemId: reward.customItemId
      ? idMap.get(reward.customItemId) ?? reward.customItemId
      : undefined,
    jobId: reward.jobId ? idMap.get(reward.jobId) ?? reward.jobId : undefined,
  };
}

function remapQuest(quest: Quest, idMap: Map<string, string>): Quest {
  return {
    ...quest,
    objectives: quest.objectives.map((o) => remapObjective(o, idMap)),
    rewards: quest.rewards.map((r) => remapReward(r, idMap)),
    chain: {
      ...quest.chain,
      requiresJob: quest.chain.requiresJob
        ? {
            ...quest.chain.requiresJob,
            jobId: idMap.get(quest.chain.requiresJob.jobId) ?? quest.chain.requiresJob.jobId,
          }
        : undefined,
    },
    npc: {
      ...quest.npc,
      coordinates: quest.npc.coordinates
        ? {
            ...quest.npc.coordinates,
            dimensionId: quest.npc.coordinates.dimensionId
              ? idMap.get(quest.npc.coordinates.dimensionId) ?? quest.npc.coordinates.dimensionId
              : undefined,
          }
        : undefined,
    },
    targetNpc: quest.targetNpc
      ? {
          ...quest.targetNpc,
          coordinates: quest.targetNpc.coordinates
            ? {
                ...quest.targetNpc.coordinates,
                dimensionId: quest.targetNpc.coordinates.dimensionId
                  ? idMap.get(quest.targetNpc.coordinates.dimensionId) ??
                    quest.targetNpc.coordinates.dimensionId
                  : undefined,
              }
            : undefined,
        }
      : undefined,
  };
}

function remapDungeonRoom(room: DungeonRoom, idMap: Map<string, string>): DungeonRoom {
  return {
    ...structuredClone(room),
    id: uid(),
    spawns: room.spawns.map((s) => ({
      ...s,
      id: uid(),
      customMobId: s.customMobId ? idMap.get(s.customMobId) ?? s.customMobId : undefined,
    })),
    triggers: room.triggers.map((t) => ({ ...t, id: uid() })),
  };
}

function remapDungeon(dungeon: Dungeon, idMap: Map<string, string>): Dungeon {
  return {
    ...dungeon,
    dimensionId: dungeon.dimensionId
      ? idMap.get(dungeon.dimensionId) ?? dungeon.dimensionId
      : undefined,
    rooms: dungeon.rooms.map((r) => remapDungeonRoom(r, idMap)),
  };
}

function remapJob(job: Job, idMap: Map<string, string>): Job {
  return {
    ...job,
    milestones: (job.milestones ?? []).map((m) => ({
      ...m,
      rewards: m.rewards.map((r) => ({
        ...r,
        customItemId: r.customItemId ? idMap.get(r.customItemId) ?? r.customItemId : undefined,
      })),
    })),
  };
}

function remapPad(pad: TeleportPad, idMap: Map<string, string>): TeleportPad {
  return {
    ...pad,
    at: {
      ...pad.at,
      dimensionId: pad.at.dimensionId
        ? idMap.get(pad.at.dimensionId) ?? pad.at.dimensionId
        : undefined,
    },
    to: {
      ...pad.to,
      dimensionId: pad.to.dimensionId
        ? idMap.get(pad.to.dimensionId) ?? pad.to.dimensionId
        : undefined,
    },
  };
}

function findRootEntity(clip: QtmcClipboard): unknown {
  const { kind, id } = clip.root;
  const entities = clip.entities;
  switch (kind) {
    case 'quest':
      return entities.quests?.find((q) => q.id === id);
    case 'customItem':
      return entities.customItems?.find((i) => i.id === id);
    case 'customMob':
      return entities.customMobs?.find((m) => m.id === id);
    case 'job':
      return entities.jobs?.find((j) => j.id === id);
    case 'dungeon':
      return entities.dungeons?.find((d) => d.id === id);
    case 'dimension':
      return entities.dimensions?.find((d) => d.id === id);
    case 'teleportPad':
      return entities.teleportPads?.find((p) => p.id === id);
    default:
      return undefined;
  }
}

export function pasteClipboard(project: Project, json: string): PasteResult {
  const clip = parseClipboard(json);
  if (!findRootEntity(clip)) {
    throw new ClipboardError('Root entity missing from clipboard data.');
  }

  const locale = projectLocale(project);
  const idMap = new Map<string, string>();
  const items = [...(project.customItems ?? [])];
  const mobs = [...(project.customMobs ?? [])];
  const jobs = [...(project.jobs ?? [])];
  const quests = [...project.quests];
  const dungeons = [...(project.dungeons ?? [])];
  const dimensions = [...(project.dimensions ?? [])];
  const teleportPads = [...(project.teleportPads ?? [])];

  const tags = {
    items: itemTags(project),
    mobs: mobTags(project),
    dungeons: dungeonTags(project),
    dimensions: dimensionTags(project),
  };

  const rootOldId = clip.root.id;
  const rootKind = clip.root.kind;
  let rootNewId = '';

  function isRoot(id: string): boolean {
    return id === rootOldId;
  }

  // Phase 1: dependencies — match existing entities or add new ones (skip root).
  for (const item of clip.entities.customItems ?? []) {
    if (isRoot(item.id)) continue;
    const existing = items.find((i) => i.tag === item.tag);
    if (existing) {
      idMap.set(item.id, existing.id);
      continue;
    }
    const newId = uid();
    const tag = resolveUniqueTag(tags.items, item.tag);
    tags.items.add(tag);
    idMap.set(item.id, newId);
    items.push({ ...structuredClone(item), id: newId, tag });
  }

  for (const mob of clip.entities.customMobs ?? []) {
    if (isRoot(mob.id)) continue;
    const existing = mobs.find((m) => m.tag === mob.tag);
    if (existing) {
      idMap.set(mob.id, existing.id);
      continue;
    }
    const newId = uid();
    const tag = resolveUniqueTag(tags.mobs, mob.tag);
    tags.mobs.add(tag);
    idMap.set(mob.id, newId);
    mobs.push({ ...structuredClone(mob), id: newId, tag });
  }

  for (const dimension of clip.entities.dimensions ?? []) {
    if (isRoot(dimension.id)) continue;
    const existing = dimensions.find((d) => d.tag === dimension.tag);
    if (existing) {
      idMap.set(dimension.id, existing.id);
      continue;
    }
    const newId = uid();
    const tag = resolveUniqueTag(tags.dimensions, dimension.tag);
    tags.dimensions.add(tag);
    idMap.set(dimension.id, newId);
    dimensions.push({ ...structuredClone(dimension), id: newId, tag });
  }

  for (const job of clip.entities.jobs ?? []) {
    if (isRoot(job.id)) continue;
    const existing = jobs.find(
      (j) => (job.starterKey && j.starterKey === job.starterKey) || j.name === job.name,
    );
    if (existing) {
      idMap.set(job.id, existing.id);
      continue;
    }
    const newId = uid();
    idMap.set(job.id, newId);
    jobs.push(remapJob({ ...structuredClone(job), id: newId, starterKey: undefined }, idMap));
  }

  for (const quest of clip.entities.quests ?? []) {
    if (isRoot(quest.id)) continue;
    const existing = quests.find((q) => q.name === quest.name);
    if (existing) {
      idMap.set(quest.id, existing.id);
      continue;
    }
    const newId = uid();
    idMap.set(quest.id, newId);
    quests.push({ ...remapQuest(structuredClone(quest), idMap), id: newId, name: quest.name });
  }

  for (const dungeon of clip.entities.dungeons ?? []) {
    if (isRoot(dungeon.id)) continue;
    const existing = dungeons.find((d) => d.tag === dungeon.tag);
    if (existing) {
      idMap.set(dungeon.id, existing.id);
      continue;
    }
    const newId = uid();
    const tag = resolveUniqueTag(tags.dungeons, dungeon.tag);
    tags.dungeons.add(tag);
    idMap.set(dungeon.id, newId);
    dungeons.push({
      ...remapDungeon(structuredClone(dungeon), idMap),
      id: newId,
      tag,
      name: dungeon.name,
    });
  }

  for (const pad of clip.entities.teleportPads ?? []) {
    if (isRoot(pad.id)) continue;
    const newId = uid();
    idMap.set(pad.id, newId);
    teleportPads.push({ ...remapPad(structuredClone(pad), idMap), id: newId, name: pad.name });
  }

  // Phase 2: always paste root as a new entity.
  switch (rootKind) {
    case 'customItem': {
      const item = clip.entities.customItems?.find((i) => i.id === rootOldId);
      if (!item) break;
      rootNewId = uid();
      const tag = resolveUniqueTag(tags.items, item.tag);
      tags.items.add(tag);
      idMap.set(item.id, rootNewId);
      items.push({
        ...structuredClone(item),
        id: rootNewId,
        tag,
        name: duplicateName(item.name, locale),
      });
      break;
    }
    case 'customMob': {
      const mob = clip.entities.customMobs?.find((m) => m.id === rootOldId);
      if (!mob) break;
      rootNewId = uid();
      const tag = resolveUniqueTag(tags.mobs, mob.tag);
      tags.mobs.add(tag);
      idMap.set(mob.id, rootNewId);
      mobs.push({
        ...structuredClone(mob),
        id: rootNewId,
        tag,
        name: duplicateName(mob.name, locale),
      });
      break;
    }
    case 'dimension': {
      const dimension = clip.entities.dimensions?.find((d) => d.id === rootOldId);
      if (!dimension) break;
      rootNewId = uid();
      const tag = resolveUniqueTag(tags.dimensions, dimension.tag);
      tags.dimensions.add(tag);
      idMap.set(dimension.id, rootNewId);
      dimensions.push({
        ...structuredClone(dimension),
        id: rootNewId,
        tag,
        name: duplicateName(dimension.name, locale),
      });
      break;
    }
    case 'job': {
      const job = clip.entities.jobs?.find((j) => j.id === rootOldId);
      if (!job) break;
      rootNewId = uid();
      idMap.set(job.id, rootNewId);
      jobs.push({
        ...remapJob(structuredClone(job), idMap),
        id: rootNewId,
        name: duplicateName(job.name, locale),
        starterKey: undefined,
      });
      break;
    }
    case 'quest': {
      const quest = clip.entities.quests?.find((q) => q.id === rootOldId);
      if (!quest) break;
      rootNewId = uid();
      idMap.set(quest.id, rootNewId);
      quests.push({
        ...remapQuest(structuredClone(quest), idMap),
        id: rootNewId,
        name: duplicateName(quest.name, locale),
      });
      break;
    }
    case 'dungeon': {
      const dungeon = clip.entities.dungeons?.find((d) => d.id === rootOldId);
      if (!dungeon) break;
      rootNewId = uid();
      const tag = resolveUniqueTag(tags.dungeons, dungeon.tag);
      tags.dungeons.add(tag);
      idMap.set(dungeon.id, rootNewId);
      dungeons.push({
        ...remapDungeon(structuredClone(dungeon), idMap),
        id: rootNewId,
        tag,
        name: duplicateName(dungeon.name, locale),
      });
      break;
    }
    case 'teleportPad': {
      const pad = clip.entities.teleportPads?.find((p) => p.id === rootOldId);
      if (!pad) break;
      rootNewId = uid();
      idMap.set(pad.id, rootNewId);
      teleportPads.push({
        ...remapPad(structuredClone(pad), idMap),
        id: rootNewId,
        name: duplicateName(pad.name, locale),
      });
      break;
    }
  }

  if (!rootNewId) {
    throw new ClipboardError('Failed to paste entity.');
  }

  return {
    project: {
      ...project,
      customItems: items,
      customMobs: mobs,
      jobs,
      quests,
      dungeons,
      dimensions,
      teleportPads,
    },
    rootKind,
    rootId: rootNewId,
  };
}
