import { type Project } from '../types/quest';
import { buildContext } from './context';

export interface CommandEntry {
  command: string;
  description: string;
}

export interface CommandGroup {
  title: string;
  description?: string;
  commands: CommandEntry[];
}

/**
 * Build the list of in-game commands for a project, using the real datapack
 * namespace and per-NPC spawn function names so each command is copy-paste ready.
 */
export function buildCommandReference(project: Project): CommandGroup[] {
  const ctx = buildContext(project);
  const ns = ctx.namespace;

  const spawnCommands: CommandEntry[] = ctx.quests.map((qc) => {
    const npc = qc.quest.npc;
    let where: string;
    if (npc.spawnMode === 'fixed' && npc.coordinates) {
      where = `spawns at fixed coords ${npc.coordinates.x} ${npc.coordinates.y} ${npc.coordinates.z}`;
    } else if (npc.spawnMode === 'manual') {
      where = 'spawns where you run it';
    } else {
      where = 'spawns at your location';
    }
    return {
      command: `/function ${ns}:${qc.spawnFn}`,
      description: `Spawn NPC(s) for "${qc.quest.name}" (${where})`,
    };
  });

  return [
    {
      title: 'Setup & Spawning',
      description: 'Run these after installing the datapack and reloading the world.',
      commands: [
        {
          command: '/reload',
          description: 'Load the datapack after dropping the ZIP into the datapacks folder.',
        },
        {
          command: `/function ${ns}:setup_guide`,
          description: 'Show clickable spawn commands for every NPC in chat.',
        },
        {
          command: `/function ${ns}:spawn_all`,
          description: 'Spawn every NPC at your current location at once.',
        },
        ...spawnCommands,
      ],
    },
    {
      title: 'Progress & Admin',
      description: 'Reset quest progress and completions. Requires operator/cheats.',
      commands: [
        {
          command: `/function ${ns}:reset`,
          description: 'Reset your own quest progress and completions.',
        },
        {
          command: `/execute as <player> run function ${ns}:reset`,
          description: "Reset a specific player's quest progress (replace <player>).",
        },
        {
          command: `/function ${ns}:reset_all`,
          description: 'Reset quest progress for everyone currently online.',
        },
      ],
    },
    {
      title: 'Diagnostics',
      commands: [
        {
          command: `/function ${ns}:debug`,
          description: 'Verify that NPCs exist and view your current quest state values.',
        },
      ],
    },
  ];
}
