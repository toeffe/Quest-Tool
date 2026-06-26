/**
 * Danish player-facing strings emitted into generated datapacks.
 * User-authored quest/NPC text in the editor is unchanged.
 */

export const STR = {
  packLoaded: (projectName: string) => `[Quest Tool] ${projectName} er indlæst.`,
  resetSelf: '[Quest Tool] Din quest-fremgang er nulstillet.',
  resetAll: '[Quest Tool] Al quest-fremgang er nulstillet.',

  acceptQuestButton: '[ Acceptér quest ]',
  acceptQuestHover: 'Klik for at acceptére denne quest',
  turnInQuestButton: '[ Aflever quest ]',
  turnInQuestHover: 'Klik for at hente din belønning',

  questAccepted: 'Quest acceptéret: ',
  objectiveSingle: (desc: string) => `Mål: ${desc}`,
  objectivesMultiple: (count: number) => `Mål: ${count} at fuldføre`,
  objectiveComplete: 'Mål fuldført! ',
  returnToNpc: (name: string) => `Vend tilbage til ${name}.`,
  readyForReward: 'Du klarede det! Lad mig belønne dig.',

  newQuestStarted: 'Ny quest startet: ',
  newQuestAvailable: 'Ny quest tilgængelig: ',
  seeNpc: (name: string) => ` (se ${name})`,

  questsAnnouncePrefix: '[Quests] ',
  questsAnnounceCompleted: ' fuldførte ',

  objectivesProgress: 'Mål: ',
  deliveryStillNeed: (amount: number, label: string) => `Du mangler stadig ${amount}x ${label}.`,

  coinsEarned: (amount: number) => `Du tjente ${amount} mønter!`,
  permissionGranted: (node: string) => `Tilladelse givet: ${node}`,
  permissionUnlocked: (node: string) =>
    `Du har låst op for: ${node} (bed personalet om at aktivere det)`,

  npcSpawned: (questName: string) => `[Quest Tool] NPC(er) spawnet for "${questName}".`,

  setupGuideTitle: '=== Quest Tool: NPC-opsætning ===',
  setupFixedAt: (x: number, y: number, z: number) => `fast position ${x} ${y} ${z}`,
  setupManual: 'manuel placering (kør kommandoen hvor du vil have den)',
  setupAtPlayer: 'ved din position (stå hvor du vil have den, og kør)',
  setupSpawnZone: (index: number) => `  spawn-zone ${index + 1}: `,
  setupTip: (namespace: string) =>
    `kør /function ${namespace}:spawn_all for at placere alle NPC'er på én gang.`,
  setupTipLabel: 'Tip: ',
  setupCommandHover: 'Klik for at sætte denne kommando i chatten',

  debugTitle: '=== Quest Tool: Debug ===',
  debugGiverOk: (questName: string) => `${questName} questgiver fundet`,
  debugGiverMissing: (questName: string) =>
    `${questName} questgiver MANGLER - kør spawn-funktionen`,
  debugYourState: '  din status: ',
  debugStateLegend: ' (0 ledig, 1 aktiv, 2 klar, 3 færdig, 4 cooldown, -1 låst)',
  debugJobsTitle: '=== Jobs ===',

  jobXpGained: (jobName: string) => `${jobName}`,
  jobLevelUpPrefix: '[Jobs] ',
  jobLevelUpSuffix: ' niveau ',
  jobQuestUnlocked: (questName: string) => `Ny quest låst op: ${questName}`,
  jobMilestonePrefix: '[Jobs] Milestone: ',
  jobMilestoneSuffix: (level: number) => ` ${level} — reward granted!`,
  resetJobsNote: 'Job-fremgang (XP og niveau) nulstilles også.',
} as const;
