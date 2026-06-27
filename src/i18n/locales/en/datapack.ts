export const datapackEn = {
  packLoaded: '[Quest Tool] {{projectName}} loaded.',
  resetSelf: '[Quest Tool] Your quest progress has been reset.',
  resetAll: '[Quest Tool] All quest progress has been reset.',

  acceptQuestButton: '[ Accept quest ]',
  acceptQuestHover: 'Click to accept this quest',
  turnInQuestButton: '[ Turn in quest ]',
  turnInQuestHover: 'Click to claim your reward',

  questAccepted: 'Quest accepted: ',
  objectiveSingle: 'Objective: {{desc}}',
  objectivesMultiple: 'Objectives: {{count}} to complete',
  objectiveComplete: 'Objective complete! ',
  returnToNpc: 'Return to {{name}}.',
  readyForReward: 'You did it! Let me reward you.',

  newQuestStarted: 'New quest started: ',
  newQuestAvailable: 'New quest available: ',
  seeNpc: ' (see {{name}})',

  questsAnnouncePrefix: '[Quests] ',
  questsAnnounceCompleted: ' completed ',

  objectivesProgress: 'Objectives: ',
  deliveryStillNeed: 'You still need {{amount}}x {{label}}.',

  coinsEarned: 'You earned {{amount}} coins!',
  permissionGranted: 'Permission granted: {{node}}',
  permissionUnlocked:
    'You have unlocked: {{node}} (ask staff to activate it)',

  npcSpawned: '[Quest Tool] NPC(s) spawned for "{{questName}}".',

  setupGuideTitle: '=== Quest Tool: NPC setup ===',
  setupFixedAt: 'fixed position {{x}} {{y}} {{z}}',
  setupManual: 'manual placement (run the command where you want it)',
  setupAtPlayer: 'at your position (stand where you want it, then run)',
  setupSpawnZone: '  spawn zone {{index}}: ',
  setupTip: 'run /function {{namespace}}:spawn_all to place all NPCs at once.',
  setupTipLabel: 'Tip: ',
  setupCommandHover: 'Click to put this command in chat',

  debugTitle: '=== Quest Tool: Debug ===',
  debugGiverOk: '{{questName}} quest giver found',
  debugGiverMissing: '{{questName}} quest giver MISSING - run the spawn function',
  debugYourState: '  your state: ',
  debugStateLegend: ' (0 available, 1 active, 2 ready, 3 done, 4 cooldown, -1 locked)',
  debugJobsTitle: '=== Jobs ===',

  jobXpGained: '{{jobName}}',
  jobLevelUpPrefix: '[Jobs] ',
  jobLevelUpSuffix: ' level ',
  jobQuestUnlocked: 'New quest unlocked: {{questName}}',
  jobMilestonePrefix: '[Jobs] Milestone: ',
  jobMilestoneSuffix: ' {{level}} — reward granted!',
  resetJobsNote: 'Job progress (XP and levels) is also reset.',
} as const;
