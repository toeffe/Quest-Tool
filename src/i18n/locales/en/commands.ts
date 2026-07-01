export const commandsEn = {
  page: {
    title: 'In-Game Commands',
    subtitle: 'Admin commands added by your datapack.',
    subtitleHint:
      "Copy-ready commands using your project namespace. Re-export after renaming. Players don't need these for normal quest play.",
  },

  groups: {
    setup: {
      title: 'Setup & Spawning',
      description: 'Run these after installing the datapack and reloading the world.',
    },
    progress: {
      title: 'Progress & Admin',
      description:
        'Reset quest progress and job XP/levels. Requires operator/cheats. {{resetJobsNote}}',
    },
    diagnostics: {
      title: 'Diagnostics',
    },
    jobs: {
      title: 'Jobs',
      description:
        'Jobs run automatically every tick. Track levels under Esc → Advancements → your pack namespace tab.',
    },
    customMobs: {
      title: 'Custom mobs',
      description: 'Spawn project-defined custom mobs for testing or world placement.',
    },
    dungeons: {
      title: 'Dungeons',
      description: 'Initialize, reset, and manually control dungeon rooms.',
    },
  },

  entries: {
    reload: 'Load the datapack after dropping the ZIP into the datapacks folder.',
    setupGuide: 'Show clickable spawn commands for every NPC in chat.',
    spawnAll: 'Spawn every NPC at your current location at once.',
    spawnQuest: 'Spawn NPC(s) for "{{questName}}" ({{where}})',
    spawnFixed: 'spawns at fixed coords {{x}} {{y}} {{z}}',
    spawnManual: 'spawns where you run it',
    spawnPlayer: 'spawns at your location',
    resetSelf: 'Reset your own quest progress, job XP, and job levels.',
    resetPlayer: "Reset a specific player's quest and job progress (replace <player>).",
    resetAll: 'Reset quest and job progress for everyone currently online.',
    debug: 'Verify that NPCs exist, view quest state values, and see your job levels and XP.',
    syncAll:
      'Re-grant job advancement nodes for all online players (fixes missing tabs after export).',
    syncJob: 'Sync "{{jobName}}" advancement tree to current levels.',
    passiveJob: '{{xpPerAction}} XP per fish caught, max level {{maxLevel}}',
    giveCustomMobs: 'Spawn one of each custom mob in front of you (testing).',
    spawnCustomMob: 'Spawn custom mob "{{mobName}}" at your location.',
    debugCustomMobPhases: 'Debug phase state for "{{mobName}}" (HP%, phase index, thresholds).',
    dungeonInit: 'Initialize dungeon "{{name}}" — scoreboards and init spawns.',
    dungeonReset: 'Reset dungeon "{{name}}" — kill mobs and clear room state.',
  },
} as const;
