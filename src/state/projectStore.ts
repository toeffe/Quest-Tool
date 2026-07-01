import JSZip from 'jszip';
import i18n from '../i18n';
import type { AppLocale } from '../i18n/types';
import { defaultsT } from '../i18n/useLabels';
import type { CustomMob } from '../types/customMob';
import {
  createDimension,
  createTeleportPad,
  type Dimension,
  type LegacyPortalLink,
  type TeleportPad,
} from '../types/dimension';
import { createDungeon, createDungeonRoom, type Dungeon, type DungeonRoom } from '../types/dungeon';
import {
  createCustomItem,
  createCustomMob,
  createJob,
  createProject,
  mergeStarterJobs,
  PROJECT_SCHEMA_VERSION,
} from '../types/factory';
import { uid } from '../types/ids';
import type { CustomItem } from '../types/item';
import type { Job } from '../types/job';
import type { Project, Quest } from '../types/quest';
import { sanitizeProjectStrings } from './sanitizeStrings';

const STORAGE_KEY = 'quest-tool-mc.project';

function projectLocale(project: Project): AppLocale {
  return project.locale === 'en' ? 'en' : 'da';
}

function duplicateName(name: string, locale: AppLocale): string {
  return `${name} ${i18n.getFixedT(locale, 'common')('actions.duplicateSuffix')}`;
}

/** Bundled inside every generated datapack ZIP for restore in Quest Tool MC. */
export const PROJECT_BACKUP_FILENAME = 'quest-tool-project.json';

/** Load the saved project from localStorage, or create a fresh one. */
export function loadProject(): Project {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createProject();
    const parsed = JSON.parse(raw) as Project;
    return migrate(parsed);
  } catch {
    return createProject();
  }
}

/** Persist the project to localStorage. Safe to call frequently (auto-save). */
export function saveProject(project: Project): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
    return true;
  } catch {
    // Storage may be full or unavailable.
    return false;
  }
}

/** Bring older saved projects up to the current schema. */
function migrate(project: Project): Project {
  const next: Project = { ...createProject(project.name), ...project };
  next.version = PROJECT_SCHEMA_VERSION;
  if (!Array.isArray(next.quests)) {
    next.quests = createProject().quests;
  }
  if (!Array.isArray(next.customItems)) {
    next.customItems = [];
  }
  if (!Array.isArray(next.customMobs)) {
    next.customMobs = [];
  }
  if (!Array.isArray(next.jobs)) {
    next.jobs = [];
  }
  const fromVersion = project.version ?? 0;
  // Backfill fields added after the initial schema (e.g. NPC entity type).
  for (const quest of next.quests) {
    if (quest.npc && !quest.npc.entityType) quest.npc.entityType = 'minecraft:villager';
    if (quest.targetNpc && !quest.targetNpc.entityType) {
      quest.targetNpc.entityType = 'minecraft:villager';
    }
    if (quest.type === 'kill') {
      for (const o of quest.objectives) {
        if (o.spawnZone && o.zoneDropMode == null && fromVersion < 3) {
          o.zoneDropMode = 'vanilla';
        }
      }
    }
  }
  if (fromVersion < 6) {
    const jobs = [...(next.jobs ?? [])];
    if (jobs.length === 1 && jobs[0].action === 'fish' && !jobs[0].starterKey) {
      jobs[0] = { ...jobs[0], starterKey: 'starter_fishing' };
    }
    next.jobs = mergeStarterJobs(jobs, next.locale ?? 'da');
  }
  if (fromVersion < 7) {
    next.customMobs = next.customMobs ?? [];
  }
  if (fromVersion < 8) {
    next.dungeons = next.dungeons ?? [];
  }
  if (!Array.isArray(next.dungeons)) {
    next.dungeons = [];
  }
  if (fromVersion < 9) {
    next.dimensions = next.dimensions ?? [];
    next.teleportPads = next.teleportPads ?? [];
  }
  if (!Array.isArray(next.dimensions)) {
    next.dimensions = [];
  }
  if (!Array.isArray(next.teleportPads)) {
    next.teleportPads = [];
  }
  if (fromVersion < 10) {
    next.teleportPads = migratePortalLinksToPads(next);
  }
  next.teleportPads = (next.teleportPads ?? []).map(normalizeTeleportPad);
  if (!next.locale) {
    next.locale = 'da';
  }
  return sanitizeProjectStrings(next);
}

/** Convert removed portal links (schema v9) into teleport pads. */
function normalizeTeleportPad(pad: TeleportPad): TeleportPad {
  return {
    ...pad,
    at: { ...pad.at, radius: pad.at.radius ?? 1 },
    cooldownSeconds: pad.cooldownSeconds && pad.cooldownSeconds > 0 ? pad.cooldownSeconds : 1,
  };
}

function migratePortalLinksToPads(project: Project): TeleportPad[] {
  const pads = [...(project.teleportPads ?? [])];
  const legacy = (project as Project & { portalLinks?: LegacyPortalLink[] }).portalLinks ?? [];
  for (const link of legacy) {
    pads.push({
      id: uid(),
      name: link.bidirectional ? `${link.name} →` : link.name,
      at: { ...link.from },
      to: {
        dimensionId: link.to.dimensionId,
        x: link.to.x,
        y: link.to.y,
        z: link.to.z,
      },
      cooldownSeconds: 1,
    });
    if (link.bidirectional) {
      pads.push({
        id: uid(),
        name: `${link.name} ←`,
        at: { ...link.to },
        to: {
          dimensionId: link.from.dimensionId,
          x: link.from.x,
          y: link.from.y,
          z: link.from.z,
        },
        cooldownSeconds: 1,
      });
    }
  }
  return pads.map(normalizeTeleportPad);
}

/** Serialize the project for download. */
export function exportProjectJson(project: Project): string {
  return JSON.stringify(project, null, 2);
}

/** Safe download name for a standalone project JSON export. */
export function projectJsonFileName(project: Project): string {
  const base = (project.name || 'project').toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return `${base || 'project'}.json`;
}

/**
 * Read project JSON from a standalone .json file or a datapack .zip that contains
 * {@link PROJECT_BACKUP_FILENAME} (included in every generated datapack download).
 */
export async function readProjectJsonFromFile(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  if (name.endsWith('.zip')) {
    const zip = await JSZip.loadAsync(await file.arrayBuffer());
    const entry = zip.file(PROJECT_BACKUP_FILENAME);
    if (!entry) {
      throw new Error(
        `This ZIP does not contain ${PROJECT_BACKUP_FILENAME}. Use a Quest Tool MC datapack download, or import a .json project file.`,
      );
    }
    return entry.async('string');
  }
  return file.text();
}

/** Parse an imported JSON string into a project (throws on invalid input). */
export function importProjectJson(json: string): Project {
  const parsed = JSON.parse(json) as Project;
  if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.quests)) {
    throw new Error('This file does not look like a Quest Tool MC project.');
  }
  return migrate({ ...parsed, id: parsed.id || uid() });
}

// ---- Quest operations (pure: return a new project) ----

export function addQuest(project: Project, quest: Quest): Project {
  return { ...project, quests: [...project.quests, quest] };
}

export function updateQuest(project: Project, quest: Quest): Project {
  return {
    ...project,
    quests: project.quests.map((q) => (q.id === quest.id ? quest : q)),
  };
}

/**
 * Rewrite every chain reference (`requires` / `unlocks`) that points at
 * `oldName` so it points at `newName` instead. Keeps storylines intact when a
 * quest is renamed. Returns the project unchanged when there is nothing to do.
 */
export function renameQuestReferences(project: Project, oldName: string, newName: string): Project {
  if (!oldName || oldName === newName) return project;
  let changed = false;
  const quests = project.quests.map((q) => {
    const requires = q.chain.requires === oldName ? newName : q.chain.requires;
    const unlocks = q.chain.unlocks === oldName ? newName : q.chain.unlocks;
    if (requires === q.chain.requires && unlocks === q.chain.unlocks) return q;
    changed = true;
    return { ...q, chain: { ...q.chain, requires, unlocks } };
  });
  return changed ? { ...project, quests } : project;
}

export function deleteQuest(project: Project, questId: string): Project {
  if (project.quests.length <= 1) return project;
  return { ...project, quests: project.quests.filter((q) => q.id !== questId) };
}

export function duplicateQuest(project: Project, questId: string): Project {
  const original = project.quests.find((q) => q.id === questId);
  if (!original) return project;
  const copy: Quest = {
    ...structuredClone(original),
    id: uid(),
    name: duplicateName(original.name, projectLocale(project)),
  };
  const index = project.quests.findIndex((q) => q.id === questId);
  const quests = [...project.quests];
  quests.splice(index + 1, 0, copy);
  return { ...project, quests };
}

// ---- Custom item operations ----

export function addCustomItem(project: Project, item: CustomItem): Project {
  const items = project.customItems ?? [];
  return { ...project, customItems: [...items, item] };
}

export function updateCustomItem(project: Project, item: CustomItem): Project {
  const items = project.customItems ?? [];
  return {
    ...project,
    customItems: items.map((i) => (i.id === item.id ? item : i)),
  };
}

export function deleteCustomItem(project: Project, itemId: string): Project {
  const items = (project.customItems ?? []).filter((i) => i.id !== itemId);
  const quests = project.quests.map((q) => ({
    ...q,
    objectives: q.objectives.map((o) => {
      let next = o;
      if (o.customItemId === itemId) {
        next = { ...next, customItemId: undefined };
      }
      if (next.zoneDrops?.length) {
        const zoneDrops = next.zoneDrops.map((d) =>
          d.customItemId === itemId ? { ...d, customItemId: undefined } : d,
        );
        next = { ...next, zoneDrops };
      }
      return next;
    }),
    rewards: q.rewards.map((r) =>
      r.customItemId === itemId ? { ...r, customItemId: undefined, type: r.type } : r,
    ),
  }));
  const jobs = (project.jobs ?? []).map((job) => ({
    ...job,
    milestones: (job.milestones ?? []).map((m) => ({
      ...m,
      rewards: m.rewards.map((r) =>
        r.customItemId === itemId ? { ...r, customItemId: undefined, type: r.type } : r,
      ),
    })),
  }));
  return { ...project, customItems: items, quests, jobs };
}

export function duplicateCustomItem(project: Project, itemId: string): Project {
  const original = (project.customItems ?? []).find((i) => i.id === itemId);
  if (!original) return project;
  const copy: CustomItem = {
    ...structuredClone(original),
    id: uid(),
    name: duplicateName(original.name, projectLocale(project)),
    tag: `${original.tag}_copy`,
  };
  const items = [...(project.customItems ?? [])];
  const index = items.findIndex((i) => i.id === itemId);
  items.splice(index + 1, 0, copy);
  return { ...project, customItems: items };
}

export function createAndAddCustomItem(
  project: Project,
  kind: CustomItem['kind'] = 'general',
): { project: Project; item: CustomItem } {
  const locale = projectLocale(project);
  const t = defaultsT(locale);
  const n = (project.customItems ?? []).length + 1;
  const item = createCustomItem(kind, t('customItem.numberedName', { n }), locale);
  return { project: addCustomItem(project, item), item };
}

// ---- Custom mob operations ----

export function addCustomMob(project: Project, mob: CustomMob): Project {
  const mobs = project.customMobs ?? [];
  return { ...project, customMobs: [...mobs, mob] };
}

export function updateCustomMob(project: Project, mob: CustomMob): Project {
  const mobs = project.customMobs ?? [];
  return {
    ...project,
    customMobs: mobs.map((m) => (m.id === mob.id ? mob : m)),
  };
}

export function deleteCustomMob(project: Project, mobId: string): Project {
  const mobs = (project.customMobs ?? []).filter((m) => m.id !== mobId);
  const quests = project.quests.map((q) => ({
    ...q,
    objectives: q.objectives.map((o) =>
      o.eliteMobId === mobId ? { ...o, eliteMobId: undefined } : o,
    ),
  }));
  const dungeons = (project.dungeons ?? []).map((d) => ({
    ...d,
    rooms: d.rooms.map((r) => ({
      ...r,
      spawns: r.spawns.map((s) => (s.customMobId === mobId ? { ...s, customMobId: undefined } : s)),
    })),
  }));
  return { ...project, customMobs: mobs, quests, dungeons };
}

export function duplicateCustomMob(project: Project, mobId: string): Project {
  const original = (project.customMobs ?? []).find((m) => m.id === mobId);
  if (!original) return project;
  const copy: CustomMob = {
    ...structuredClone(original),
    id: uid(),
    name: duplicateName(original.name, projectLocale(project)),
    tag: `${original.tag}_copy`,
  };
  const mobs = [...(project.customMobs ?? [])];
  const index = mobs.findIndex((m) => m.id === mobId);
  mobs.splice(index + 1, 0, copy);
  return { ...project, customMobs: mobs };
}

export function createAndAddCustomMob(project: Project): { project: Project; mob: CustomMob } {
  const locale = projectLocale(project);
  const t = defaultsT(locale);
  const n = (project.customMobs ?? []).length + 1;
  const mob = createCustomMob(t('customMob.numberedName', { n }), locale);
  return { project: addCustomMob(project, mob), mob };
}

// ---- Job operations ----

export function addJob(project: Project, job: Job): Project {
  const jobs = project.jobs ?? [];
  return { ...project, jobs: [...jobs, job] };
}

export function updateJob(project: Project, job: Job): Project {
  const jobs = project.jobs ?? [];
  return {
    ...project,
    jobs: jobs.map((j) => (j.id === job.id ? job : j)),
  };
}

export function deleteJob(project: Project, jobId: string): Project {
  const jobs = (project.jobs ?? []).filter((j) => j.id !== jobId);
  const quests = project.quests.map((q) => ({
    ...q,
    chain: {
      ...q.chain,
      requiresJob: q.chain.requiresJob?.jobId === jobId ? undefined : q.chain.requiresJob,
    },
    rewards: q.rewards.map((r) =>
      r.type === 'jobXp' && r.jobId === jobId ? { ...r, jobId: undefined } : r,
    ),
  }));
  return { ...project, jobs, quests };
}

export function duplicateJob(project: Project, jobId: string): Project {
  const original = (project.jobs ?? []).find((j) => j.id === jobId);
  if (!original) return project;
  const copy: Job = {
    ...structuredClone(original),
    id: uid(),
    name: duplicateName(original.name, projectLocale(project)),
    starterKey: undefined,
  };
  const jobs = [...(project.jobs ?? [])];
  const index = jobs.findIndex((j) => j.id === jobId);
  jobs.splice(index + 1, 0, copy);
  return { ...project, jobs };
}

export function createAndAddJob(project: Project): { project: Project; job: Job } {
  const locale = projectLocale(project);
  const t = defaultsT(locale);
  const n = (project.jobs ?? []).length + 1;
  const job = createJob(t('job.numberedName', { n }), 'fish', {}, locale);
  return { project: addJob(project, job), job };
}

// ---- Dungeon operations ----

export function addDungeon(project: Project, dungeon: Dungeon): Project {
  const dungeons = project.dungeons ?? [];
  return { ...project, dungeons: [...dungeons, dungeon] };
}

export function updateDungeon(project: Project, dungeon: Dungeon): Project {
  const dungeons = project.dungeons ?? [];
  return {
    ...project,
    dungeons: dungeons.map((d) => (d.id === dungeon.id ? dungeon : d)),
  };
}

export function deleteDungeon(project: Project, dungeonId: string): Project {
  const dungeons = (project.dungeons ?? []).filter((d) => d.id !== dungeonId);
  return { ...project, dungeons };
}

export function duplicateDungeon(project: Project, dungeonId: string): Project {
  const original = (project.dungeons ?? []).find((d) => d.id === dungeonId);
  if (!original) return project;
  const copy: Dungeon = {
    ...structuredClone(original),
    id: uid(),
    name: duplicateName(original.name, projectLocale(project)),
    tag: `${original.tag}_copy`,
    rooms: original.rooms.map((r) => ({ ...structuredClone(r), id: uid() })),
  };
  const dungeons = [...(project.dungeons ?? [])];
  const index = dungeons.findIndex((d) => d.id === dungeonId);
  dungeons.splice(index + 1, 0, copy);
  return { ...project, dungeons };
}

export function addRoom(project: Project, dungeonId: string, room?: DungeonRoom): Project {
  const dungeons = project.dungeons ?? [];
  const newRoom = room ?? createDungeonRoom();
  return {
    ...project,
    dungeons: dungeons.map((d) =>
      d.id === dungeonId ? { ...d, rooms: [...d.rooms, newRoom] } : d,
    ),
  };
}

export function updateRoom(
  project: Project,
  dungeonId: string,
  roomId: string,
  patch: Partial<DungeonRoom>,
): Project {
  const dungeons = project.dungeons ?? [];
  return {
    ...project,
    dungeons: dungeons.map((d) =>
      d.id === dungeonId
        ? {
            ...d,
            rooms: d.rooms.map((r) => (r.id === roomId ? { ...r, ...patch } : r)),
          }
        : d,
    ),
  };
}

export function deleteRoom(project: Project, dungeonId: string, roomId: string): Project {
  const dungeons = project.dungeons ?? [];
  return {
    ...project,
    dungeons: dungeons.map((d) =>
      d.id === dungeonId ? { ...d, rooms: d.rooms.filter((r) => r.id !== roomId) } : d,
    ),
  };
}

export function createAndAddDungeon(project: Project): { project: Project; dungeon: Dungeon } {
  const locale = projectLocale(project);
  const t = defaultsT(locale);
  const n = (project.dungeons ?? []).length + 1;
  const dungeon = createDungeon(t('dungeon.numberedName', { n }), locale);
  return { project: addDungeon(project, dungeon), dungeon };
}

// ---- Dimension operations ----

function clearDimensionRef(dimensionId: string | undefined, deletedId: string): string | undefined {
  return dimensionId === deletedId ? undefined : dimensionId;
}

export function addDimension(project: Project, dimension: Dimension): Project {
  const dimensions = project.dimensions ?? [];
  return { ...project, dimensions: [...dimensions, dimension] };
}

export function updateDimension(project: Project, dimension: Dimension): Project {
  const dimensions = project.dimensions ?? [];
  return {
    ...project,
    dimensions: dimensions.map((d) => (d.id === dimension.id ? dimension : d)),
  };
}

export function deleteDimension(project: Project, dimensionId: string): Project {
  const dimensions = (project.dimensions ?? []).filter((d) => d.id !== dimensionId);
  const quests = project.quests.map((q) => ({
    ...q,
    npc: q.npc.coordinates
      ? {
          ...q.npc,
          coordinates: {
            ...q.npc.coordinates,
            dimensionId: clearDimensionRef(q.npc.coordinates.dimensionId, dimensionId),
          },
        }
      : q.npc,
    targetNpc: q.targetNpc?.coordinates
      ? {
          ...q.targetNpc,
          coordinates: {
            ...q.targetNpc.coordinates,
            dimensionId: clearDimensionRef(q.targetNpc.coordinates.dimensionId, dimensionId),
          },
        }
      : q.targetNpc,
    objectives: q.objectives.map((o) =>
      o.location
        ? {
            ...o,
            location: {
              ...o.location,
              dimensionId: clearDimensionRef(o.location.dimensionId, dimensionId),
            },
          }
        : o,
    ),
  }));
  const dungeons = (project.dungeons ?? []).map((d) => ({
    ...d,
    dimensionId: clearDimensionRef(d.dimensionId, dimensionId),
  }));
  const teleportPads = (project.teleportPads ?? []).map((pad) => ({
    ...pad,
    at: {
      ...pad.at,
      dimensionId: clearDimensionRef(pad.at.dimensionId, dimensionId),
    },
    to: {
      ...pad.to,
      dimensionId: clearDimensionRef(pad.to.dimensionId, dimensionId),
    },
  }));
  return {
    ...project,
    dimensions,
    quests,
    dungeons,
    teleportPads,
  };
}

export function duplicateDimension(project: Project, dimensionId: string): Project {
  const original = (project.dimensions ?? []).find((d) => d.id === dimensionId);
  if (!original) return project;
  const copy: Dimension = {
    ...structuredClone(original),
    id: uid(),
    name: duplicateName(original.name, projectLocale(project)),
    tag: `${original.tag}_copy`,
  };
  const dimensions = [...(project.dimensions ?? [])];
  const index = dimensions.findIndex((d) => d.id === dimensionId);
  dimensions.splice(index + 1, 0, copy);
  return { ...project, dimensions };
}

export function createAndAddDimension(project: Project): {
  project: Project;
  dimension: Dimension;
} {
  const locale = projectLocale(project);
  const t = defaultsT(locale);
  const n = (project.dimensions ?? []).length + 1;
  const dimension = createDimension(t('dimension.numberedName', { n }), locale);
  return { project: addDimension(project, dimension), dimension };
}

// ---- Teleport pad operations ----

export function addTeleportPad(project: Project, pad: TeleportPad): Project {
  const teleportPads = project.teleportPads ?? [];
  return { ...project, teleportPads: [...teleportPads, pad] };
}

export function updateTeleportPad(project: Project, pad: TeleportPad): Project {
  const teleportPads = project.teleportPads ?? [];
  return {
    ...project,
    teleportPads: teleportPads.map((p) => (p.id === pad.id ? pad : p)),
  };
}

export function deleteTeleportPad(project: Project, padId: string): Project {
  const teleportPads = (project.teleportPads ?? []).filter((p) => p.id !== padId);
  return { ...project, teleportPads };
}

export function duplicateTeleportPad(project: Project, padId: string): Project {
  const original = (project.teleportPads ?? []).find((p) => p.id === padId);
  if (!original) return project;
  const copy: TeleportPad = {
    ...structuredClone(original),
    id: uid(),
    name: duplicateName(original.name, projectLocale(project)),
  };
  const teleportPads = [...(project.teleportPads ?? [])];
  const index = teleportPads.findIndex((p) => p.id === padId);
  teleportPads.splice(index + 1, 0, copy);
  return { ...project, teleportPads };
}

export function createAndAddTeleportPad(project: Project): { project: Project; pad: TeleportPad } {
  const locale = projectLocale(project);
  const t = defaultsT(locale);
  const n = (project.teleportPads ?? []).length + 1;
  const pad = createTeleportPad(t('pad.numberedName', { n }), locale);
  return { project: addTeleportPad(project, pad), pad };
}
