export const validationDa = {
  noObjective: 'Questen har intet mål.',
  objective: 'Mål',
  objectiveN: 'Mål {{n}}',
  drop: '{{where}} drop',
  dropN: '{{where}} drop {{n}}',
  missingTargetMob: '{{where}} mangler en mål-mob.',
  missingTargetItem: '{{where}} mangler en mål-genstand.',
  amountMin: '{{where}} antal skal være mindst 1.',
  spawnZoneNoLocation: '{{where}} spawn-zone er aktiveret, men ingen placering er angivet.',
  spawnCapMin: '{{where}} spawn-grænse skal være mindst 1.',
  spawnZoneNoMob: '{{where}} spawn-zone er aktiveret, men ingen mob/væsen er angivet.',
  customDropsEmpty:
    '{{where}} brugerdefinerede drops er aktiveret, men ingen drops er konfigureret.',
  dropMissingItem: '{{where}} mangler en genstand.',
  dropAmountMin: '{{where}} antal skal være mindst 1.',
  dropChanceRange: '{{where}} chance skal være mellem 1 og 100.',
  missingLocation: '{{where}} mangler en målplacering.',
  customItemNoDisplayName: 'Brugerdefineret genstand "{{name}}" har intet visningsnavn.',
  customItemNoBaseItem: 'Brugerdefineret genstand "{{name}}" har ingen basis-genstand.',
  customItemUnused: 'Brugerdefineret genstand "{{name}}" bruges ikke i nogen quest.',
  duplicateItemTag: 'Dubleret genstands-tag "{{tag}}" (brugt {{count}} gange).',
  customMobNoName: 'Brugerdefineret mob "{{name}}" har intet navn.',
  customMobNoTag: 'Brugerdefineret mob "{{name}}" har intet identitetstag.',
  customMobNoBaseEntity: 'Brugerdefineret mob "{{name}}" har ingen basis-entity.',
  customMobUnused: 'Brugerdefineret mob "{{name}}" bruges ikke i nogen dræb-quest.',
  customMobHighHealth:
    'Brugerdefineret mob "{{name}}" har meget højt liv ({{health}}) — kan påvirke overlevelse.',
  customMobDropsNoSpawnZone:
    'Brugerdefineret mob "{{name}}" har drops konfigureret, men bruges ikke i en spawn-zone — spillere skal møde den i hele verdenen.',
  duplicateMobTag: 'Dubleret mob-tag "{{tag}}" (brugt {{count}} gange).',
  customMobPhaseThresholdMissing:
    'Brugerdefineret mob "{{name}}" fase {{phase}} mangler HP-tærskel (påkrævet efter fase 1).',
  customMobPhaseThresholdInvalid:
    'Brugerdefineret mob "{{name}}" fase {{phase}} tærskel skal være mellem 1 og 99.',
  customMobPhaseThresholdOrder:
    'Brugerdefineret mob "{{name}}" fase-tærskler skal falde (fx 66%, derefter 33%).',
  customMobSkinUnsupported:
    'Brugerdefineret mob "{{name}}" har brugerdefineret tekstur, men base entity "{{entity}}" understøtter ikke skins i vanilla.',
  customMobSkinResourcePack:
    'Brugerdefineret mob "{{name}}" har et skin — download og installer den separate resource pack ZIP ud over datapacken.',
  customMobScaleExtreme:
    'Brugerdefineret mob "{{name}}" skala ({{scale}}) er uden for anbefalet interval 0,25–4.',
  customMobWolfSkinInfo:
    'Brugerdefineret mob "{{name}}" ulv-skin bruges på angry, tame og wild varianter (samme PNG).',
  dungeonNoName: 'En dungeon har et tomt navn.',
  dungeonNoTag: 'Dungeon "{{name}}" har intet funktionstag.',
  dungeonNoRooms: 'Dungeon "{{name}}" har ingen rum.',
  dungeonRoomNoName: 'Et rum i dungeon "{{dungeon}}" har et tomt navn.',
  dungeonGateMissingQuest: 'Rum "{{room}}" quest-gate refererer til manglende quest "{{quest}}".',
  dungeonSpawnMissingMob: 'Rum "{{room}}" spawn refererer til en slettet brugerdefineret mob.',
  dungeonTriggerMissingQuest: 'Rum "{{room}}" trigger refererer til manglende quest "{{quest}}".',
  duplicateDungeonTag: 'Dubleret dungeon-tag "{{tag}}" (brugt {{count}} gange).',
  dungeonSpawnsNoOutcome: 'Rum "{{room}}" har spawns uden respawn men ingen on_all_killed-trigger.',
  dungeonBossNoTrigger: 'Boss-rum "{{room}}" har ingen on_all_mobs_killed-trigger.',
  dungeonOverlappingRooms: 'Rum "{{a}}" og "{{b}}" i "{{dungeon}}" har overlappende afgrænsninger.',
  dungeonUnreferenced: 'Dungeon "{{name}}" refereres ikke af nogen quest-gate eller trigger.',
  dungeonDimensionMissing: 'Dungeon "{{name}}" refererer til en slettet dimension.',
  dimensionNoName: 'En dimension har et tomt navn.',
  dimensionNoTag: 'Dimension "{{name}}" har ingen tag.',
  duplicateDimensionTag: 'Dublet dimensionstag "{{tag}}" (brugt {{count}} gange).',
  dimensionRefMissing: '"{{entity}}" refererer til en slettet dimension.',
  padNoName: 'En teleportpad har et tomt navn.',
  padCooldownTooShort: 'Pad "{{name}}" cooldown bør være mindst 1 sekund.',
  padDestinationOverlapsAt:
    'Pad "{{from}}" teleporterer ind i detektionszonen for "{{to}}". Pakken tilføjer anti-bounce grace, men overvej at forskyd destinationer.',
  objectiveMissingCustomMob: 'Dræb-mål refererer til en brugerdefineret mob der er slettet.',
  customItemEnchantmentLevel:
    'Brugerdefineret genstand "{{name}}" fortryllelse "{{enchant}}" skal have niveau mindst 1.',
  customItemEnchantmentMaxLevel:
    'Brugerdefineret genstand "{{name}}" fortryllelse "{{enchant}}" overstiger vanilla maks. niveau ({{max}}).',
  customItemUnknownEnchantment:
    'Brugerdefineret genstand "{{name}}" bruger ukendt fortryllelse "{{enchant}}".',
  customItemDuplicateEnchantment:
    'Brugerdefineret genstand "{{name}}" har dubleret fortryllelse "{{enchant}}".',
  jobEmptyName: 'Et job har et tomt navn.',
  jobXpPerActionMin: 'Job "{{name}}" XP pr. handling skal være mindst 1.',
  jobXpPerLevelMin: 'Job "{{name}}" XP pr. niveau skal være mindst 1.',
  jobMaxLevelMin: 'Job "{{name}}" maks. niveau skal være mindst 1.',
  jobAdvIconWarning:
    'Job "{{name}}" advancement-ikon bør være et navnerums-id (f.eks. minecraft:fishing_rod).',
  jobAdvBackgroundWarning:
    'Job "{{name}}" advancement-baggrund bør være et ressource-id (f.eks. minecraft:gui/advancements/backgrounds/husbandry).',
  jobCustomCriterion: 'Job "{{name}}" mangler et brugerdefineret scoreboard-kriterium.',
  jobSingleTarget: 'Job "{{name}}" mangler et enkelt mål-id (eller vælg en forudindstilling).',
  jobMilestoneLevelRange:
    'Job "{{name}}" milestone-niveau {{level}} skal være mellem 1 og {{maxLevel}}.',
  jobDuplicateMilestone: 'Job "{{name}}" har dubleret milestone på niveau {{level}}.',
  jobMilestoneEmptyItem: 'Job "{{name}}" milestone Lv.{{level}} har en tom genstandsbelønning.',
  jobMilestoneMissingItem:
    'Job "{{name}}" milestone refererer til en genstand, der ikke findes længere.',
  duplicateJobName: 'Dubleret jobnavn: "{{name}}" (brugt {{count}} gange).',
  chainRequiresMissingJob: 'Kæden kræver et job, der ikke findes længere.',
  jobLevelMin: 'Job-niveaukrav skal være mindst 1.',
  jobXpRewardMissingJob: 'En job-XP-belønning refererer til et job, der ikke findes længere.',
  jobXpRewardMin: 'En job-XP-belønning skal give mindst 1 XP.',
  projectNoQuests: 'Projektet har ingen quests.',
  questEmptyName: 'En quest har et tomt navn.',
  npcNoName: 'Questgiveren har intet navn.',
  objectiveMissingCustomItem: 'Et mål refererer til en genstand, der ikke findes længere.',
  spawnDropMissingCustomItem:
    'Et spawn-zone-drop refererer til en genstand, der ikke findes længere.',
  npcFixedNoCoords: 'NPC-spawn er sat til faste koordinater, men ingen er angivet.',
  targetNpcNoName: "Mål-NPC'en har intet navn.",
  targetNpcFixedNoCoords: 'Mål-NPC bruger faste koordinater, men ingen er angivet.',
  chainRequiresNotFound: 'Kæden kræver "{{name}}", som ikke er en quest i dette projekt.',
  chainSelfRequire: 'En quest kan ikke kræve sig selv.',
  chainUnlocksNotFound: 'Kæden låser op for "{{name}}", som ikke er en quest i dette projekt.',
  chainCycleDetected:
    'Denne quest er en del af en cirkulær kæde — nogle quests låses måske aldrig op.',
  rewardMissingItem: 'En genstandsbelønning mangler sin genstand.',
  rewardMissingCustomItem: 'En belønning refererer til en genstand, der ikke findes længere.',
  rewardMissingCommand: 'En kommando-belønning mangler sin værdi.',
  questNoRewards: 'Questen har ingen belønninger.',
  duplicateQuestName: 'Dubleret questnavn: "{{name}}" (brugt {{count}} gange).',
  duplicateNpcTag: 'NPC-tag "{{tag}}" bruges af {{count}} quests; de deler/duplikerer NPC\'er.',
  moneyVanillaNote:
    'Penge bruger et internt scoreboard på Vanilla/LAN (intet rigtigt økonomi-plugin).',
  permissionNote:
    'Tilladelsesbelønninger kræver et tilladelses-plugin (Paper). En chatbesked vises i stedet.',
} as const;
