import i18n from '../i18n';
import { type AppLocale, DEFAULT_LOCALE } from '../i18n/types';

export interface DatapackStrings {
  packLoaded: (projectName: string) => string;
  resetSelf: string;
  resetAll: string;
  acceptQuestButton: string;
  acceptQuestHover: string;
  turnInQuestButton: string;
  turnInQuestHover: string;
  questAccepted: string;
  objectiveSingle: (desc: string) => string;
  objectivesMultiple: (count: number) => string;
  objectiveComplete: string;
  returnToNpc: (name: string) => string;
  readyForReward: string;
  newQuestStarted: string;
  newQuestAvailable: string;
  seeNpc: (name: string) => string;
  questsAnnouncePrefix: string;
  questsAnnounceCompleted: string;
  objectivesProgress: string;
  deliveryStillNeed: (amount: number, label: string) => string;
  coinsEarned: (amount: number) => string;
  permissionGranted: (node: string) => string;
  permissionUnlocked: (node: string) => string;
  npcSpawned: (questName: string) => string;
  setupGuideTitle: string;
  setupFixedAt: (x: number, y: number, z: number) => string;
  setupManual: string;
  setupAtPlayer: string;
  setupSpawnZone: (index: number) => string;
  setupTip: (namespace: string) => string;
  setupTipLabel: string;
  setupCommandHover: string;
  debugTitle: string;
  debugGiverOk: (questName: string) => string;
  debugGiverMissing: (questName: string) => string;
  debugYourState: string;
  debugStateLegend: string;
  debugJobsTitle: string;
  jobXpGained: (jobName: string) => string;
  jobLevelUpPrefix: string;
  jobLevelUpSuffix: string;
  jobQuestUnlocked: (questName: string) => string;
  jobMilestonePrefix: string;
  jobMilestoneSuffix: (level: number) => string;
  resetJobsNote: string;
  questLogTitle: string;
  questLogAuthor: string;
  questLogCover: (projectName: string) => string;
  questLogCoverHint: string;
  questLogStatusAvailable: string;
  questLogStatusActive: string;
  questLogStatusReady: string;
  questLogStatusCompleted: string;
  questLogStatusLocked: string;
  questLogGiver: (name: string) => string;
  questLogObjectiveLine: (desc: string, current: string, amount: number) => string;
  questLogObjectivePlain: (desc: string) => string;
  questLogSeeNpc: (name: string) => string;
  questLogReturnToNpc: (name: string) => string;
  questLogOverflow: (count: number) => string;
  questLogOpenButton: string;
  questLogOpenHover: string;
  questLogUpdated: string;
}

/** Player-facing strings emitted into generated datapacks. */
export function getDatapackStrings(locale: AppLocale = DEFAULT_LOCALE): DatapackStrings {
  const t = i18n.getFixedT(locale, 'datapack');
  return {
    packLoaded: (projectName) => t('packLoaded', { projectName }),
    resetSelf: t('resetSelf'),
    resetAll: t('resetAll'),
    acceptQuestButton: t('acceptQuestButton'),
    acceptQuestHover: t('acceptQuestHover'),
    turnInQuestButton: t('turnInQuestButton'),
    turnInQuestHover: t('turnInQuestHover'),
    questAccepted: t('questAccepted'),
    objectiveSingle: (desc) => t('objectiveSingle', { desc }),
    objectivesMultiple: (count) => t('objectivesMultiple', { count }),
    objectiveComplete: t('objectiveComplete'),
    returnToNpc: (name) => t('returnToNpc', { name }),
    readyForReward: t('readyForReward'),
    newQuestStarted: t('newQuestStarted'),
    newQuestAvailable: t('newQuestAvailable'),
    seeNpc: (name) => t('seeNpc', { name }),
    questsAnnouncePrefix: t('questsAnnouncePrefix'),
    questsAnnounceCompleted: t('questsAnnounceCompleted'),
    objectivesProgress: t('objectivesProgress'),
    deliveryStillNeed: (amount, label) => t('deliveryStillNeed', { amount, label }),
    coinsEarned: (amount) => t('coinsEarned', { amount }),
    permissionGranted: (node) => t('permissionGranted', { node }),
    permissionUnlocked: (node) => t('permissionUnlocked', { node }),
    npcSpawned: (questName) => t('npcSpawned', { questName }),
    setupGuideTitle: t('setupGuideTitle'),
    setupFixedAt: (x, y, z) => t('setupFixedAt', { x, y, z }),
    setupManual: t('setupManual'),
    setupAtPlayer: t('setupAtPlayer'),
    setupSpawnZone: (index) => t('setupSpawnZone', { index: index + 1 }),
    setupTip: (namespace) => t('setupTip', { namespace }),
    setupTipLabel: t('setupTipLabel'),
    setupCommandHover: t('setupCommandHover'),
    debugTitle: t('debugTitle'),
    debugGiverOk: (questName) => t('debugGiverOk', { questName }),
    debugGiverMissing: (questName) => t('debugGiverMissing', { questName }),
    debugYourState: t('debugYourState'),
    debugStateLegend: t('debugStateLegend'),
    debugJobsTitle: t('debugJobsTitle'),
    jobXpGained: (jobName) => t('jobXpGained', { jobName }),
    jobLevelUpPrefix: t('jobLevelUpPrefix'),
    jobLevelUpSuffix: t('jobLevelUpSuffix'),
    jobQuestUnlocked: (questName) => t('jobQuestUnlocked', { questName }),
    jobMilestonePrefix: t('jobMilestonePrefix'),
    jobMilestoneSuffix: (level) => t('jobMilestoneSuffix', { level }),
    resetJobsNote: t('resetJobsNote'),
    questLogTitle: t('questLog.title'),
    questLogAuthor: t('questLog.author'),
    questLogCover: (projectName) => t('questLog.cover', { projectName }),
    questLogCoverHint: t('questLog.coverHint'),
    questLogStatusAvailable: t('questLog.statusAvailable'),
    questLogStatusActive: t('questLog.statusActive'),
    questLogStatusReady: t('questLog.statusReady'),
    questLogStatusCompleted: t('questLog.statusCompleted'),
    questLogStatusLocked: t('questLog.statusLocked'),
    questLogGiver: (name) => t('questLog.giver', { name }),
    questLogObjectiveLine: (desc, current, amount) =>
      t('questLog.objectiveLine', { desc, current, amount }),
    questLogObjectivePlain: (desc) => t('questLog.objectivePlain', { desc }),
    questLogSeeNpc: (name) => t('questLog.seeNpc', { name }),
    questLogReturnToNpc: (name) => t('questLog.returnToNpc', { name }),
    questLogOverflow: (count) => t('questLog.overflow', { count }),
    questLogOpenButton: t('questLog.openButton'),
    questLogOpenHover: t('questLog.openHover'),
    questLogUpdated: t('questLog.updated'),
  };
}

/** @deprecated Use getDatapackStrings(project.locale) via CompileContext.str */
export const STR = getDatapackStrings('da');
