import { type Project } from '../types/quest';
import { buildContext } from './context';
import { STR } from './strings';

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
      description: `Reset quest progress and job XP/levels. Requires operator/cheats. ${STR.resetJobsNote}`,
      commands: [
        {
          command: `/function ${ns}:reset`,
          description: 'Reset your own quest progress, job XP, and job levels.',
        },
        {
          command: `/execute as <player> run function ${ns}:reset`,
          description: "Reset a specific player's quest and job progress (replace <player>).",
        },
        {
          command: `/function ${ns}:reset_all`,
          description: 'Reset quest and job progress for everyone currently online.',
        },
      ],
    },
    {
      title: 'Diagnostics',
      commands: [
        {
          command: `/function ${ns}:debug`,
          description:
            'Verify that NPCs exist, view quest state values, and see your job levels and XP.',
        },
      ],
    },
    ...(ctx.jobs.length > 0
      ? [
          {
            title: 'Jobs',
            description:
              'Jobs run automatically every tick. Track levels under Esc → Advancements → your pack namespace tab.',
            commands: [
              {
                command: `/function ${ns}:jobs/sync_all`,
                description:
                  'Re-grant job advancement nodes for all online players (fixes missing tabs after export).',
              },
              ...ctx.jobs.map((jc) => ({
                command: `/function ${ns}:${jc.fnBase}/sync_advancements`,
                description: `Sync "${jc.job.name}" advancement tree to current levels.`,
              })),
              ...ctx.jobs.map((jc) => ({
                command: `(passive) ${jc.job.name}`,
                description: `${jc.job.xpPerAction} XP per fish caught, max level ${jc.job.maxLevel}`,
              })),
            ],
          },
        ]
      : []),
  ];
}
