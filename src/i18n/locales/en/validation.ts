export const validationEn = {
  noObjective: 'Quest has no objective.',
  objective: 'Objective',
  objectiveN: 'Objective {{n}}',
  drop: '{{where}} drop',
  dropN: '{{where}} drop {{n}}',
  reward: 'reward',
  rewardN: 'reward {{n}}',
  missingTargetMob: '{{where}} is missing a target mob.',
  missingTargetItem: '{{where}} is missing a target item.',
  amountMin: '{{where}} amount must be at least 1.',
  spawnZoneNoLocation: '{{where}} spawn zone is enabled but no location is set.',
  spawnCapMin: '{{where}} spawn cap must be at least 1.',
  spawnZoneNoMob: '{{where}} spawn zone is enabled but no mob/creature is set.',
  customDropsEmpty: '{{where}} custom drops is enabled but no drops are configured.',
  dropMissingItem: '{{where}} is missing an item.',
  dropAmountMin: '{{where}} amount must be at least 1.',
  dropChanceRange: '{{where}} chance must be between 1 and 100.',
  missingLocation: '{{where}} is missing a target location.',
  customItemNoDisplayName: 'Custom item "{{name}}" has no display name.',
  customItemNoBaseItem: 'Custom item "{{name}}" has no base item.',
  customItemUnused: 'Custom item "{{name}}" is not used in any quest.',
  duplicateItemTag: 'Duplicate custom item tag "{{tag}}" (used {{count}} times).',
  customMobNoName: 'Custom mob "{{name}}" has no name.',
  customMobNoTag: 'Custom mob "{{name}}" has no identity tag.',
  customMobNoBaseEntity: 'Custom mob "{{name}}" has no base entity.',
  customMobUnused: 'Custom mob "{{name}}" is not used in any kill objective.',
  customMobHighHealth:
    'Custom mob "{{name}}" has very high health ({{health}}) — may affect survivability.',
  customMobDropsNoSpawnZone:
    'Custom mob "{{name}}" has drops configured but is not used in a spawn zone — players must encounter it world-wide.',
  duplicateMobTag: 'Duplicate custom mob tag "{{tag}}" (used {{count}} times).',
  customMobPhaseThresholdMissing:
    'Custom mob "{{name}}" phase {{phase}} is missing an HP threshold (required after phase 1).',
  customMobPhaseThresholdInvalid:
    'Custom mob "{{name}}" phase {{phase}} threshold must be between 1 and 99.',
  customMobPhaseThresholdOrder:
    'Custom mob "{{name}}" phase thresholds must decrease (e.g. 66%, then 33%).',
  customMobSkinUnsupported:
    'Custom mob "{{name}}" has a custom texture but base entity "{{entity}}" does not support skins in vanilla.',
  customMobSkinResourcePack:
    'Custom mob "{{name}}" has a skin — download and install the separate resource pack ZIP in addition to the datapack.',
  customMobScaleExtreme:
    'Custom mob "{{name}}" scale ({{scale}}) is outside the recommended 0.25–4 range.',
  customMobWolfSkinInfo:
    'Custom mob "{{name}}" wolf skin is applied to angry, tame, and wild variants (same PNG).',
  dungeonNoName: 'A dungeon has an empty name.',
  dungeonNoTag: 'Dungeon "{{name}}" has no function tag.',
  dungeonNoRooms: 'Dungeon "{{name}}" has no rooms.',
  dungeonRoomNoName: 'A room in dungeon "{{dungeon}}" has an empty name.',
  dungeonGateMissingQuest: 'Room "{{room}}" quest gate references missing quest "{{quest}}".',
  dungeonSpawnMissingMob: 'Room "{{room}}" spawn references a deleted custom mob.',
  dungeonTriggerMissingQuest: 'Room "{{room}}" trigger references missing quest "{{quest}}".',
  duplicateDungeonTag: 'Duplicate dungeon tag "{{tag}}" (used {{count}} times).',
  dungeonSpawnsNoOutcome:
    'Room "{{room}}" has spawns that do not respawn but no on_all_killed trigger.',
  dungeonBossNoTrigger: 'Boss room "{{room}}" has no on_all_mobs_killed trigger.',
  dungeonOverlappingRooms: 'Rooms "{{a}}" and "{{b}}" in "{{dungeon}}" have overlapping bounds.',
  dungeonUnreferenced: 'Dungeon "{{name}}" is not referenced by any quest gate or trigger.',
  dungeonDimensionMissing: 'Dungeon "{{name}}" references a deleted dimension.',
  dimensionNoName: 'A dimension has an empty name.',
  dimensionNoTag: 'Dimension "{{name}}" has no tag.',
  duplicateDimensionTag: 'Duplicate dimension tag "{{tag}}" (used {{count}} times).',
  dimensionRefMissing: '"{{entity}}" references a deleted dimension.',
  padNoName: 'A teleport pad has an empty name.',
  padCooldownTooShort: 'Pad "{{name}}" cooldown should be at least 1 second.',
  containerNoName: 'A world container has an empty name.',
  containerIntervalMin: 'Container "{{name}}" refill interval must be at least 1 second.',
  containerStockEmpty: 'Container "{{name}}" has no stock items — refills will be empty.',
  containerStockDrop: 'Container "{{name}}" stock {{n}}',
  containerStockMissingCustomItem:
    'Container "{{name}}" stock references a deleted custom item (id: {{itemId}}).',
  duplicateContainerName: 'Duplicate container name: "{{name}}" (used {{count}} times).',
  padDestinationOverlapsAt:
    'Pad "{{from}}" teleports into the detection zone of "{{to}}". The pack adds anti-bounce grace, but consider offsetting destinations.',
  objectiveMissingCustomMob:
    'Quest "{{quest}}" {{where}} references a deleted custom mob (id: {{mobId}}).',
  customItemEnchantmentLevel:
    'Custom item "{{name}}" enchantment "{{enchant}}" level must be at least 1.',
  customItemEnchantmentMaxLevel:
    'Custom item "{{name}}" enchantment "{{enchant}}" exceeds vanilla max level ({{max}}).',
  customItemUnknownEnchantment: 'Custom item "{{name}}" uses unknown enchantment "{{enchant}}".',
  customItemDuplicateEnchantment: 'Custom item "{{name}}" has duplicate enchantment "{{enchant}}".',
  jobEmptyName: 'A job has an empty name.',
  jobXpPerActionMin: 'Job "{{name}}" XP per action must be at least 1.',
  jobXpPerLevelMin: 'Job "{{name}}" XP per level must be at least 1.',
  jobMaxLevelMin: 'Job "{{name}}" max level must be at least 1.',
  jobAdvIconWarning:
    'Job "{{name}}" advancement icon should be a namespaced id (e.g. minecraft:fishing_rod).',
  jobAdvBackgroundWarning:
    'Job "{{name}}" advancement background should be a resource id (e.g. minecraft:gui/advancements/backgrounds/husbandry).',
  jobCustomCriterion: 'Job "{{name}}" needs a custom scoreboard criterion.',
  jobSingleTarget: 'Job "{{name}}" needs a single target id (or choose a preset).',
  jobMilestoneLevelRange:
    'Job "{{name}}" milestone level {{level}} must be between 1 and {{maxLevel}}.',
  jobDuplicateMilestone: 'Job "{{name}}" has duplicate milestone at level {{level}}.',
  jobMilestoneEmptyItem: 'Job "{{name}}" milestone Lv.{{level}} has an empty item reward.',
  jobMilestoneMissingItem:
    'Job "{{name}}" milestone Lv.{{level}} references a deleted custom item (id: {{itemId}}).',
  duplicateJobName: 'Duplicate job name: "{{name}}" (used {{count}} times).',
  chainRequiresMissingJob: 'Quest "{{quest}}" chain requires a deleted job (id: {{jobId}}).',
  jobLevelMin: 'Quest "{{quest}}" job level requirement must be at least 1.',
  jobXpRewardMissingJob: 'Quest "{{quest}}" {{where}} references a deleted job (id: {{jobId}}).',
  jobXpRewardMin: 'Quest "{{quest}}" {{where}} must grant at least 1 XP.',
  projectNoQuests: 'The project has no quests.',
  questEmptyName: 'A quest has an empty name.',
  npcNoName: 'The quest giver has no name.',
  objectiveMissingCustomItem:
    'Quest "{{quest}}" {{where}} references a deleted custom item (id: {{itemId}}).',
  spawnDropMissingCustomItem:
    'Quest "{{quest}}" {{where}} references a deleted custom item (id: {{itemId}}).',
  customMobDropMissingCustomItem:
    'Custom mob "{{mob}}" {{where}} references a deleted custom item (id: {{itemId}}).',
  npcFixedNoCoords: 'NPC spawn is set to fixed coordinates but none are provided.',
  targetNpcNoName: 'The target NPC has no name.',
  targetNpcFixedNoCoords: 'Target NPC uses fixed coordinates but none are provided.',
  chainRequiresNotFound: 'Chain requires "{{name}}", which is not a quest in this project.',
  chainSelfRequire: 'A quest cannot require itself.',
  chainUnlocksNotFound: 'Chain unlocks "{{name}}", which is not a quest in this project.',
  chainCycleDetected:
    'This quest is part of a circular chain dependency — some quests may never unlock.',
  rewardMissingItem: 'Quest "{{quest}}" {{where}} is missing its item.',
  rewardMissingCustomItem:
    'Quest "{{quest}}" {{where}} references a deleted custom item (id: {{itemId}}).',
  rewardMissingCommand: 'Quest "{{quest}}" {{where}} is missing its command.',
  questNoRewards: 'Quest has no rewards.',
  duplicateQuestName: 'Duplicate quest name: "{{name}}" (used {{count}} times).',
  duplicateNpcTag: 'NPC tag "{{tag}}" is used by {{count}} quests; they will share/duplicate NPCs.',
  moneyVanillaNote: 'Money uses an internal scoreboard on Vanilla/LAN (no real economy plugin).',
  permissionNote:
    'Permission rewards require a permissions plugin (Paper). A chat message is shown instead.',
} as const;
