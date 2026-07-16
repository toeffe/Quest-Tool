import type { TriggerAction } from '../types/dungeon';
import type { Project } from '../types/quest';

/** Strip control characters that must not appear in user-authored text fields. */
export function sanitizeUserString(value: string): string {
  return value.replace(/[\r\n]/g, ' ');
}

function sanitizeOptional(value: string | undefined): string | undefined {
  return value == null ? value : sanitizeUserString(value);
}

function sanitizeTriggerAction(action: TriggerAction): TriggerAction {
  switch (action.type) {
    case 'set_quest_state':
      return { ...action, questName: sanitizeUserString(action.questName) };
    case 'dialogue':
      return { ...action, message: sanitizeUserString(action.message) };
    case 'custom_command':
      return { ...action, command: sanitizeUserString(action.command) };
    default:
      return action;
  }
}

/** Sanitize all known user-authored string fields on import/migrate. */
export function sanitizeProjectStrings(project: Project): Project {
  const next: Project = {
    ...project,
    name: sanitizeUserString(project.name),
    quests: project.quests.map((quest) => ({
      ...quest,
      name: sanitizeUserString(quest.name),
      description: sanitizeUserString(quest.description),
      npc: quest.npc
        ? {
            ...quest.npc,
            name: sanitizeUserString(quest.npc.name),
            dialogue: {
              greeting: sanitizeUserString(quest.npc.dialogue.greeting),
              offer: sanitizeUserString(quest.npc.dialogue.offer),
              inProgress: sanitizeUserString(quest.npc.dialogue.inProgress),
              completion: sanitizeUserString(quest.npc.dialogue.completion),
            },
          }
        : quest.npc,
      targetNpc: quest.targetNpc
        ? {
            ...quest.targetNpc,
            name: sanitizeUserString(quest.targetNpc.name),
            dialogue: sanitizeUserString(quest.targetNpc.dialogue),
          }
        : quest.targetNpc,
      chain: {
        ...quest.chain,
        requires: sanitizeOptional(quest.chain.requires),
        unlocks: sanitizeOptional(quest.chain.unlocks),
      },
      objectives: quest.objectives.map((o) => ({
        ...o,
        description: sanitizeOptional(o.description),
      })),
    })),
    customItems: (project.customItems ?? []).map((item) => ({
      ...item,
      name: sanitizeUserString(item.name),
      displayName: sanitizeUserString(item.displayName),
      lore: item.lore.map((line) => sanitizeUserString(line)),
    })),
    customMobs: (project.customMobs ?? []).map((mob) => ({
      ...mob,
      name: sanitizeUserString(mob.name),
      displayName: sanitizeUserString(mob.displayName),
      phases: mob.phases?.map((phase) => ({
        ...phase,
        name: sanitizeUserString(phase.name),
        announceMessage: sanitizeOptional(phase.announceMessage),
      })),
    })),
    jobs: (project.jobs ?? []).map((job) => ({
      ...job,
      name: sanitizeUserString(job.name),
    })),
    dungeons: (project.dungeons ?? []).map((dungeon) => ({
      ...dungeon,
      name: sanitizeUserString(dungeon.name),
      rooms: dungeon.rooms.map((room) => ({
        ...room,
        name: sanitizeUserString(room.name),
        customTypeLabel: sanitizeOptional(room.customTypeLabel),
        questGate: room.questGate
          ? { ...room.questGate, questName: sanitizeUserString(room.questGate.questName) }
          : room.questGate,
        triggers: room.triggers.map((trigger) => ({
          ...trigger,
          action: sanitizeTriggerAction(trigger.action),
        })),
      })),
    })),
    dimensions: (project.dimensions ?? []).map((dim) => ({
      ...dim,
      name: sanitizeUserString(dim.name),
    })),
    teleportPads: (project.teleportPads ?? []).map((pad) => ({
      ...pad,
      name: sanitizeUserString(pad.name),
    })),
    containers: (project.containers ?? []).map((container) => ({
      ...container,
      name: sanitizeUserString(container.name),
    })),
  };
  return next;
}
