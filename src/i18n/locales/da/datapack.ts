export const datapackDa = {
  packLoaded: '[Quest Tool] {{projectName}} er indlæst.',
  resetSelf: '[Quest Tool] Din quest-fremgang er nulstillet.',
  resetAll: '[Quest Tool] Al quest-fremgang er nulstillet.',

  acceptQuestButton: '[ Acceptér quest ]',
  acceptQuestHover: 'Klik for at acceptére denne quest',
  turnInQuestButton: '[ Aflever quest ]',
  turnInQuestHover: 'Klik for at hente din belønning',

  questAccepted: 'Quest acceptéret: ',
  objectiveSingle: 'Mål: {{desc}}',
  objectivesMultiple: 'Mål: {{count}} at fuldføre',
  objectiveComplete: 'Mål fuldført! ',
  returnToNpc: 'Vend tilbage til {{name}}.',
  readyForReward: 'Du klarede det! Lad mig belønne dig.',

  newQuestStarted: 'Ny quest startet: ',
  newQuestAvailable: 'Ny quest tilgængelig: ',
  seeNpc: ' (se {{name}})',

  questsAnnouncePrefix: '[Quests] ',
  questsAnnounceCompleted: ' fuldførte ',

  objectivesProgress: 'Mål: ',
  deliveryStillNeed: 'Du mangler stadig {{amount}}x {{label}}.',

  coinsEarned: 'Du tjente {{amount}} mønter!',
  permissionGranted: 'Tilladelse givet: {{node}}',
  permissionUnlocked:
    'Du har låst op for: {{node}} (bed personalet om at aktivere det)',

  npcSpawned: '[Quest Tool] NPC(er) spawnet for "{{questName}}".',

  setupGuideTitle: '=== Quest Tool: NPC-opsætning ===',
  setupFixedAt: 'fast position {{x}} {{y}} {{z}}',
  setupManual: 'manuel placering (kør kommandoen hvor du vil have den)',
  setupAtPlayer: 'ved din position (stå hvor du vil have den, og kør)',
  setupSpawnZone: '  spawn-zone {{index}}: ',
  setupTip: 'kør /function {{namespace}}:spawn_all for at placere alle NPC\'er på én gang.',
  setupTipLabel: 'Tip: ',
  setupCommandHover: 'Klik for at sætte denne kommando i chatten',

  debugTitle: '=== Quest Tool: Debug ===',
  debugGiverOk: '{{questName}} questgiver fundet',
  debugGiverMissing: '{{questName}} questgiver MANGLER - kør spawn-funktionen',
  debugYourState: '  din status: ',
  debugStateLegend: ' (0 ledig, 1 aktiv, 2 klar, 3 færdig, 4 cooldown, -1 låst)',
  debugJobsTitle: '=== Jobs ===',

  jobXpGained: '{{jobName}}',
  jobLevelUpPrefix: '[Jobs] ',
  jobLevelUpSuffix: ' niveau ',
  jobQuestUnlocked: 'Ny quest låst op: {{questName}}',
  jobMilestonePrefix: '[Jobs] Milestone: ',
  jobMilestoneSuffix: ' {{level}} — belønning givet!',
  resetJobsNote: 'Job-fremgang (XP og niveau) nulstilles også.',
} as const;
