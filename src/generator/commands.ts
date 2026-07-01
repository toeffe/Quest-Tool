import i18n from '../i18n';
import type { AppLocale } from '../i18n/types';
import { toIdentifier } from '../types/ids';
import type { Project } from '../types/quest';
import { buildContext, projectLocale } from './context';
import { mobHasPhaseTransitions } from './customMobPhases';
import { buildDungeonCommandEntries } from './dungeons';

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
export function buildCommandReference(project: Project, locale?: AppLocale): CommandGroup[] {
  const ctx = buildContext(project);
  const lng = locale ?? projectLocale(project);
  const t = i18n.getFixedT(lng, 'commands');
  const ns = ctx.namespace;
  const STR = ctx.str;

  const spawnCommands: CommandEntry[] = ctx.quests.map((qc) => {
    const npc = qc.quest.npc;
    let where: string;
    if (npc.spawnMode === 'fixed' && npc.coordinates) {
      where = t('entries.spawnFixed', {
        x: npc.coordinates.x,
        y: npc.coordinates.y,
        z: npc.coordinates.z,
      });
    } else if (npc.spawnMode === 'manual') {
      where = t('entries.spawnManual');
    } else {
      where = t('entries.spawnPlayer');
    }
    return {
      command: `/function ${ns}:${qc.spawnFn}`,
      description: t('entries.spawnQuest', { questName: qc.quest.name, where }),
    };
  });

  return [
    {
      title: t('groups.setup.title'),
      description: t('groups.setup.description'),
      commands: [
        { command: '/reload', description: t('entries.reload') },
        { command: `/function ${ns}:setup_guide`, description: t('entries.setupGuide') },
        { command: `/function ${ns}:spawn_all`, description: t('entries.spawnAll') },
        ...spawnCommands,
      ],
    },
    {
      title: t('groups.progress.title'),
      description: t('groups.progress.description', { resetJobsNote: STR.resetJobsNote }),
      commands: [
        { command: `/function ${ns}:reset`, description: t('entries.resetSelf') },
        {
          command: `/execute as <player> run function ${ns}:reset`,
          description: t('entries.resetPlayer'),
        },
        { command: `/function ${ns}:reset_all`, description: t('entries.resetAll') },
      ],
    },
    {
      title: t('groups.diagnostics.title'),
      commands: [{ command: `/function ${ns}:debug`, description: t('entries.debug') }],
    },
    ...(ctx.jobs.length > 0
      ? [
          {
            title: t('groups.jobs.title'),
            description: t('groups.jobs.description'),
            commands: [
              {
                command: `/function ${ns}:jobs/sync_all`,
                description: t('entries.syncAll'),
              },
              ...ctx.jobs.map((jc) => ({
                command: `/function ${ns}:${jc.fnBase}/sync_advancements`,
                description: t('entries.syncJob', { jobName: jc.job.name }),
              })),
              ...ctx.jobs.map((jc) => ({
                command: `(passive) ${jc.job.name}`,
                description: t('entries.passiveJob', {
                  xpPerAction: jc.job.xpPerAction,
                  maxLevel: jc.job.maxLevel,
                }),
              })),
            ],
          },
        ]
      : []),
    ...((project.customMobs ?? []).length > 0
      ? [
          {
            title: t('groups.customMobs.title'),
            description: t('groups.customMobs.description'),
            commands: [
              {
                command: `/function ${ns}:give_custom_mobs`,
                description: t('entries.giveCustomMobs'),
              },
              ...(project.customMobs ?? []).flatMap((mob) => {
                const entries: CommandEntry[] = [
                  {
                    command: `/function ${ns}:spawn_mob/${mob.tag}`,
                    description: t('entries.spawnCustomMob', {
                      mobName: mob.displayName || mob.name,
                    }),
                  },
                ];
                if (mobHasPhaseTransitions(mob)) {
                  entries.push({
                    command: `/function ${ns}:mobs/phases/${mob.tag}/debug`,
                    description: t('entries.debugCustomMobPhases', {
                      mobName: mob.displayName || mob.name,
                    }),
                  });
                }
                return entries;
              }),
            ],
          },
        ]
      : []),
    ...((project.dungeons ?? []).length > 0
      ? [
          {
            title: t('groups.dungeons.title'),
            description: t('groups.dungeons.description'),
            commands: [
              ...(project.dungeons ?? []).flatMap((dungeon) => {
                const tag = toIdentifier(dungeon.tag, 'dungeon');
                const roomEntries = buildDungeonCommandEntries(ctx).filter((e) =>
                  e.command.includes(`dungeons/${tag}/`),
                );
                return [
                  {
                    command: `/function ${ns}:dungeons/${tag}/init`,
                    description: t('entries.dungeonInit', { name: dungeon.name }),
                  },
                  {
                    command: `/function ${ns}:dungeons/${tag}/reset`,
                    description: t('entries.dungeonReset', { name: dungeon.name }),
                  },
                  ...roomEntries
                    .filter((e) => e.command.includes('/rooms/'))
                    .map((e) => ({
                      command: e.command,
                      description: e.description,
                    })),
                ];
              }),
            ],
          },
        ]
      : []),
  ];
}
