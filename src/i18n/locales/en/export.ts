export const exportEn = {
  title: 'Generate & Export',
  subtitle:
    'Validate your quests and download a ready-to-install datapack for Minecraft 1.21.11. The ZIP includes quest-tool-project.json for re-import.',

  testPack: {
    title: 'Test datapack (flat world)',
    description:
      'Complete in-game test suite: 18 quests, 11 job stations, all reward types, and starter jobs with fast milestones. Use a creative superflat world (1.21.11).',
    guideCommand: 'Full checklist in-game: /function {{namespace}}:test_guide',
    setupSummary: 'Setup & quick reference',
    steps: {
      flatWorld: 'Create a flat world, copy ZIP to datapacks/, /reload',
      spawnAll: '/function {{namespace}}:spawn_all — NPCs + job stations',
      giveKit: '/function {{namespace}}:give_test_kit — tools & items',
      syncJobs: '/function {{namespace}}:jobs/sync_all — refresh advancements',
      debug: '/function {{namespace}}:debug — quest state + job Lv/XP',
      questLayout:
        'Quests 1–18 (rows at Z=0, 12, 24). Quest 5: gold block at 4, {{y}}, 8. Quest 12 needs Woodcutting Lv 2.',
      jobStations:
        'Jobs at X={{x}}: {{stations}}. PvP needs a second player (skip solo).',
      reset: '/function {{namespace}}:reset between full runs',
    },
    downloaded:
      'Test datapack downloaded. NPCs are placed around 0, {{y}}, 0 on superflat.',
    downloadButton: 'Download test datapack (.zip)',
    exportFailed: 'Test pack export failed',
  },

  validation: {
    title: 'Validation',
    allGood: 'Everything looks good. You are ready to export.',
    questPrefix: '{{name}}: ',
  },

  installGuide: {
    title: 'Install guide',
  },

  exportCard: {
    title: 'Export',
    downloaded:
      "Datapack downloaded. Drop it into your world's datapacks folder and run /reload.",
    downloadButton: 'Download datapack (.zip)',
    copyCommands: 'Copy raw commands',
    projectBackup: 'Download project backup (.json)',
    blockedHint: 'Fix the errors above to download the datapack.',
    exportFailed: 'Export failed',
  },

  files: {
    title: 'Generated files ({{count}})',
    subtitle: 'Preview of datapack contents. Use Download for the full ZIP.',
    truncated: '…',
    moreFiles: '…and {{count}} more files in the ZIP.',
  },
} as const;
