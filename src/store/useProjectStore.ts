import { create } from 'zustand';
import type { AppLocale } from '../i18n/types';
import { defaultsT } from '../i18n/useLabels';
import {
  addQuest,
  addRoom,
  createAndAddCustomItem,
  createAndAddCustomMob,
  createAndAddDimension,
  createAndAddDungeon,
  createAndAddJob,
  createAndAddTeleportPad,
  deleteCustomItem,
  deleteCustomMob,
  deleteDimension,
  deleteDungeon,
  deleteJob,
  deleteQuest,
  deleteRoom,
  deleteTeleportPad,
  duplicateCustomItem,
  duplicateCustomMob,
  duplicateDimension,
  duplicateDungeon,
  duplicateJob,
  duplicateQuest,
  duplicateTeleportPad,
  importProjectJson,
  loadProject,
  renameQuestReferences,
  updateDungeon,
  updateJob,
  updateQuest,
  updateRoom,
} from '../state/projectStore';
import type { CustomMob } from '../types/customMob';
import type { Dimension, TeleportPad } from '../types/dimension';
import { createDungeonRoom, type Dungeon, type DungeonRoom } from '../types/dungeon';
import { createQuest } from '../types/factory';
import type { CustomItem, CustomItemKind } from '../types/item';
import type { Job } from '../types/job';
import type { Project, Quest } from '../types/quest';

interface ProjectStore {
  project: Project;
  setProject: (project: Project) => void;
  setProjectMeta: (
    patch: Partial<Pick<Project, 'name' | 'namespace' | 'platform' | 'locale'>>,
  ) => void;
  addQuest: () => Quest;
  updateQuest: (quest: Quest) => void;
  duplicateQuest: (id: string) => void;
  deleteQuest: (id: string) => boolean;
  importProject: (json: string) => void;
  reorderQuests: (ids: string[]) => void;
  addCustomItem: (kind?: CustomItemKind) => CustomItem;
  updateCustomItem: (item: CustomItem) => void;
  deleteCustomItem: (id: string) => void;
  duplicateCustomItem: (id: string) => void;
  addCustomMob: () => CustomMob;
  updateCustomMob: (mob: CustomMob) => void;
  deleteCustomMob: (id: string) => void;
  duplicateCustomMob: (id: string) => void;
  addJob: () => Job;
  updateJob: (job: Job) => void;
  deleteJob: (id: string) => void;
  duplicateJob: (id: string) => void;
  addDungeon: () => Dungeon;
  updateDungeon: (dungeon: Dungeon) => void;
  deleteDungeon: (id: string) => void;
  duplicateDungeon: (id: string) => void;
  addRoom: (dungeonId: string) => DungeonRoom;
  updateRoom: (dungeonId: string, roomId: string, patch: Partial<DungeonRoom>) => void;
  deleteRoom: (dungeonId: string, roomId: string) => void;
  addDimension: () => Dimension;
  deleteDimension: (id: string) => void;
  duplicateDimension: (id: string) => void;
  addTeleportPad: () => TeleportPad;
  deleteTeleportPad: (id: string) => void;
  duplicateTeleportPad: (id: string) => void;
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  project: loadProject(),

  setProject: (project) => set({ project }),

  setProjectMeta: (patch) => set((s) => ({ project: { ...s.project, ...patch } })),

  addQuest: () => {
    const { project } = get();
    const locale = (project.locale === 'en' ? 'en' : 'da') as AppLocale;
    const t = defaultsT(locale);
    const n = project.quests.length + 1;
    const quest = createQuest(t('quest.numberedName', { n }), 'kill', locale);
    set({ project: addQuest(project, quest) });
    return quest;
  },

  updateQuest: (quest) => {
    const { project } = get();
    const previous = project.quests.find((q) => q.id === quest.id);
    let next = updateQuest(project, quest);
    if (previous && previous.name !== quest.name) {
      next = renameQuestReferences(next, previous.name, quest.name);
    }
    set({ project: next });
  },

  duplicateQuest: (id) => {
    const { project } = get();
    set({ project: duplicateQuest(project, id) });
  },

  deleteQuest: (id) => {
    const { project } = get();
    if (project.quests.length <= 1) return false;
    set({ project: deleteQuest(project, id) });
    return true;
  },

  importProject: (json) => {
    const imported = importProjectJson(json);
    set({ project: imported });
  },

  reorderQuests: (ids) => {
    const { project } = get();
    const map = new Map(project.quests.map((q) => [q.id, q]));
    const quests = ids.map((id) => map.get(id)).filter((q): q is Quest => !!q);
    if (quests.length !== project.quests.length) return;
    set({ project: { ...project, quests } });
  },

  addCustomItem: (kind = 'general') => {
    const { project } = get();
    const { project: next, item } = createAndAddCustomItem(project, kind);
    set({ project: next });
    return item;
  },

  updateCustomItem: (item) => {
    const { project } = get();
    const items = project.customItems ?? [];
    set({
      project: {
        ...project,
        customItems: items.map((i) => (i.id === item.id ? item : i)),
      },
    });
  },

  deleteCustomItem: (id) => {
    const { project } = get();
    set({ project: deleteCustomItem(project, id) });
  },

  duplicateCustomItem: (id) => {
    const { project } = get();
    set({ project: duplicateCustomItem(project, id) });
  },

  addCustomMob: () => {
    const { project } = get();
    const { project: next, mob } = createAndAddCustomMob(project);
    set({ project: next });
    return mob;
  },

  updateCustomMob: (mob) => {
    const { project } = get();
    const mobs = project.customMobs ?? [];
    set({
      project: {
        ...project,
        customMobs: mobs.map((m) => (m.id === mob.id ? mob : m)),
      },
    });
  },

  deleteCustomMob: (id) => {
    const { project } = get();
    set({ project: deleteCustomMob(project, id) });
  },

  duplicateCustomMob: (id) => {
    const { project } = get();
    set({ project: duplicateCustomMob(project, id) });
  },

  addJob: () => {
    const { project } = get();
    const { project: next, job } = createAndAddJob(project);
    set({ project: next });
    return job;
  },

  updateJob: (job) => {
    const { project } = get();
    set({ project: updateJob(project, job) });
  },

  deleteJob: (id) => {
    const { project } = get();
    set({ project: deleteJob(project, id) });
  },

  duplicateJob: (id) => {
    const { project } = get();
    set({ project: duplicateJob(project, id) });
  },

  addDungeon: () => {
    const { project } = get();
    const { project: next, dungeon } = createAndAddDungeon(project);
    set({ project: next });
    return dungeon;
  },

  updateDungeon: (dungeon) => {
    const { project } = get();
    set({ project: updateDungeon(project, dungeon) });
  },

  deleteDungeon: (id) => {
    const { project } = get();
    set({ project: deleteDungeon(project, id) });
  },

  duplicateDungeon: (id) => {
    const { project } = get();
    set({ project: duplicateDungeon(project, id) });
  },

  addRoom: (dungeonId) => {
    const { project } = get();
    const room = createDungeonRoom();
    set({ project: addRoom(project, dungeonId, room) });
    return room;
  },

  updateRoom: (dungeonId, roomId, patch) => {
    const { project } = get();
    set({ project: updateRoom(project, dungeonId, roomId, patch) });
  },

  deleteRoom: (dungeonId, roomId) => {
    const { project } = get();
    set({ project: deleteRoom(project, dungeonId, roomId) });
  },

  addDimension: () => {
    const { project } = get();
    const { project: next, dimension } = createAndAddDimension(project);
    set({ project: next });
    return dimension;
  },

  deleteDimension: (id) => {
    const { project } = get();
    set({ project: deleteDimension(project, id) });
  },

  duplicateDimension: (id) => {
    const { project } = get();
    set({ project: duplicateDimension(project, id) });
  },

  addTeleportPad: () => {
    const { project } = get();
    const { project: next, pad } = createAndAddTeleportPad(project);
    set({ project: next });
    return pad;
  },

  deleteTeleportPad: (id) => {
    const { project } = get();
    set({ project: deleteTeleportPad(project, id) });
  },

  duplicateTeleportPad: (id) => {
    const { project } = get();
    set({ project: duplicateTeleportPad(project, id) });
  },
}));

/** Convenience selector for the current project. */
export function useProject(): Project {
  return useProjectStore((s) => s.project);
}
