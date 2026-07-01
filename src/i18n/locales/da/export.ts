export const exportDa = {
  title: 'Generér & eksportér',
  subtitle: 'Validér og download din datapack-ZIP.',
  subtitleHint:
    'Minecraft Java 1.21.11. ZIP indeholder quest-tool-project.json til genimport via Indstillinger.',

  testPack: {
    title: 'Testdatapack (flad verden)',
    description:
      'Komplet in-game testsuite: 18 quests, 11 jobstationer, alle belønningstyper og starterjobs med hurtige milestones. Brug en kreativ superflat-verden (1.21.11).',
    guideCommand: 'Fuld tjekliste in-game: /function {{namespace}}:test_guide',
    setupSummary: 'Opsætning & hurtig reference',
    steps: {
      flatWorld: 'Opret en flad verden, kopiér ZIP til datapacks/, /reload',
      spawnAll: "/function {{namespace}}:spawn_all — NPC'er + jobstationer",
      giveKit: '/function {{namespace}}:give_test_kit — værktøj & genstande',
      syncJobs: '/function {{namespace}}:jobs/sync_all — opdater advancements',
      debug: '/function {{namespace}}:debug — queststatus + job Lv/XP',
      questLayout:
        'Quests 1–18 (rækker ved Z=0, 12, 24). Quest 5: guldblok ved 4, {{y}}, 8. Quest 12 kræver Woodcutting Lv 2.',
      jobStations:
        'Jobs ved X={{x}}: {{stations}}. PvP kræver en anden spiller (spring over solo).',
      reset: '/function {{namespace}}:reset mellem fulde gennemløb',
    },
    downloaded: "Testdatapack downloadet. NPC'er placeres omkring 0, {{y}}, 0 på superflat.",
    downloadButton: 'Download testdatapack (.zip)',
    exportFailed: 'Testpakke-eksport mislykkedes',
  },

  validation: {
    title: 'Validering',
    allGood: 'Alt ser godt ud. Du er klar til at eksportere.',
    questPrefix: '{{name}}: ',
    detailsSummary: 'Valideringsproblemer ({{count}})',
  },

  installGuide: {
    title: 'Installationsguide',
  },

  exportCard: {
    title: 'Eksport',
    downloaded: 'Datapack downloadet. Læg den i din verdens datapacks-mappe og kør /reload.',
    resourcePackDownloaded:
      'Resource pack downloadet. Installer den separat (påkrævet server-pack eller single-player resource packs).',
    downloadButton: 'Download datapack (.zip)',
    downloadResourcePackButton: 'Download resource pack (.zip)',
    copyCommands: 'Kopiér rå kommandoer',
    projectBackup: 'Download projektsikkerhedskopi (.json)',
    blockedHint: 'Ret fejlene nedenfor for at downloade datapacken.',
    warningsHint: 'Du kan eksportere, men gennemgå advarslerne nedenfor.',
    exportFailed: 'Eksport mislykkedes',
    resourcePackExportFailed: 'Resource pack-eksport mislykkedes',
  },

  files: {
    title: 'Genererede filer ({{count}})',
    commandPreview: 'Kommandoforhåndsvisning',
    subtitle: 'Forhåndsvisning af datapack-indhold. Brug Download for den fulde ZIP.',
    truncated: '…',
    moreFiles: '…og {{count}} filer mere i ZIP-filen.',
  },
} as const;
