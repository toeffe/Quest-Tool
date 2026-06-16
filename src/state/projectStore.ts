import { type Project, type Quest } from '../types/quest';
import { createProject, PROJECT_SCHEMA_VERSION } from '../types/factory';
import { uid } from '../types/ids';

const STORAGE_KEY = 'quest-tool-mc.project';

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
export function saveProject(project: Project): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
  } catch {
    // Storage may be full or unavailable; fail silently so the UI keeps working.
  }
}

/** Bring older saved projects up to the current schema. */
function migrate(project: Project): Project {
  const next: Project = { ...createProject(project.name), ...project };
  next.version = PROJECT_SCHEMA_VERSION;
  if (!Array.isArray(next.quests) || next.quests.length === 0) {
    next.quests = createProject().quests;
  }
  // Backfill fields added after the initial schema (e.g. NPC entity type).
  for (const quest of next.quests) {
    if (quest.npc && !quest.npc.entityType) quest.npc.entityType = 'minecraft:villager';
    if (quest.targetNpc && !quest.targetNpc.entityType) {
      quest.targetNpc.entityType = 'minecraft:villager';
    }
  }
  return next;
}

/** Serialize the project for download. */
export function exportProjectJson(project: Project): string {
  return JSON.stringify(project, null, 2);
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
export function renameQuestReferences(
  project: Project,
  oldName: string,
  newName: string,
): Project {
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
  return { ...project, quests: project.quests.filter((q) => q.id !== questId) };
}

export function duplicateQuest(project: Project, questId: string): Project {
  const original = project.quests.find((q) => q.id === questId);
  if (!original) return project;
  const copy: Quest = {
    ...structuredClone(original),
    id: uid(),
    name: `${original.name} (copy)`,
  };
  const index = project.quests.findIndex((q) => q.id === questId);
  const quests = [...project.quests];
  quests.splice(index + 1, 0, copy);
  return { ...project, quests };
}
