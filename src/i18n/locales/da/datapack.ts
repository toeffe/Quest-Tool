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
  permissionUnlocked: 'Du har låst op for: {{node}} (bed personalet om at aktivere det)',

  npcSpawned: '[Quest Tool] NPC(er) spawnet for "{{questName}}".',

  setupGuideTitle: '=== Quest Tool: NPC-opsætning ===',
  setupFixedAt: 'fast position {{x}} {{y}} {{z}}',
  setupManual: 'manuel placering (kør kommandoen hvor du vil have den)',
  setupAtPlayer: 'ved din position (stå hvor du vil have den, og kør)',
  setupSpawnZone: '  spawn-zone {{index}}: ',
  setupTip: "kør /function {{namespace}}:spawn_all for at placere alle NPC'er på én gang.",
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

  questLog: {
    title: 'Questlog',
    author: 'Quest Tool',
    cover: '{{projectName}}',
    coverHint: 'Din quest-journal.\\nDen opdateres automatisk\\nnår du gør fremskridt.',
    statusAvailable: 'Tilgængelig',
    statusActive: 'I gang',
    statusReady: 'Klar til aflevering',
    statusCompleted: 'Fuldført',
    statusLocked: 'Låst',
    giver: 'Giver: {{name}}',
    objectiveLine: '- {{desc}}: {{current}}/{{amount}}',
    objectivePlain: '- {{desc}}',
    seeNpc: 'Se {{name}} for at starte.',
    returnToNpc: 'Vend tilbage til {{name}}.',
    overflow: '... og {{count}} quests mere.\\nTal med en NPC for detaljer.',
    openButton: '[ Hent questlog ]',
    openHover: 'Klik hvis du har mistet din questlog-bog',
    updated: '[Quest Tool] Questlog modtaget.',
  },

  readme: {
    header: 'Quest Tool MC - {{projectName}}',
    generatedFor: 'Genereret til Minecraft Java Edition {{version}}',
    playingTitle: 'Sådan spiller du',
    playingStep1: '- Gå hen til en questgiver-NPC; dialog vises automatisk i chatten.',
    playingStep2: '- Klik på [ Acceptér quest ]-beskeden (bruger /trigger, ingen snyd nødvendigt).',
    playingStep3: '- Fremgang vises på din action bar. Fuldfør målet, og vend tilbage til giveren.',
    playingStep4:
      '- Klik [ Aflever quest ] for at hente belønninger. Kædede quests låses op automatisk.',
    jobsTitle: 'Jobs (passive færdigheder)',
    jobsStep1:
      '- Fiskeri, minedrift, kamp og andre jobs stiger i niveau automatisk fra spillerhandlinger.',
    jobsStep2: '- Åbn Esc → Fremskridt → {{namespace}} for at se skill-træer og niveauer.',
    jobsStep3:
      '- Milestone-belønninger (brugerdefinerede genstande, XP osv.) gives ved level-up, når det er konfigureret under Jobs.',
    jobsStep4:
      '- Mens du tjener job-XP, viser en personlig boss bar kort dit niveau, total XP og fremgang til næste niveau, og skjules derefter efter få sekunder.',
    jobsStep5: '- Job-fremgang vises også i /function {{namespace}}:debug.',
    jobsStep6:
      '- Brug /function {{namespace}}:reset for at nulstille job-XP og -niveauer sammen med quest-fremgang.',
    adminTitle: 'Admin-kommandoer',
    adminSetupGuide: '- /function {{namespace}}:setup_guide   - list NPC-spawn-kommandoer',
    adminSpawnAll: "- /function {{namespace}}:spawn_all     - spawn alle NPC'er ved dine fødder",
    adminDebug: "- /function {{namespace}}:debug         - tjek NPC'er og din quest-status",
    adminGiveItems:
      '- /function {{namespace}}:give_custom_items - giv én af hver brugerdefineret genstand (test)',
    adminGiveMobs:
      '- /function {{namespace}}:give_custom_mobs - spawn én af hver brugerdefineret mob (test)',
    adminGiveQuestlog: '- /function {{namespace}}:give_questlog - giv/opdater questlog-bogen',
    adminJobsSync:
      '- /function {{namespace}}:jobs/sync_all - opdater job-advancement-faner for alle online',
    adminReset: '- /function {{namespace}}:reset         - nulstil DIN quest-fremgang',
    adminResetPlayer:
      '- /execute as <player> run function {{namespace}}:reset   - nulstil én spiller',
    adminResetAll: '- /function {{namespace}}:reset_all     - nulstil alles quest-fremgang',
    backupTitle: 'Editor-projektsikkerhedskopi',
    backupLine1: 'Denne ZIP indeholder også {{filename}} — dit fulde Quest Tool MC-projekt',
    backupLine2:
      '(quests, brugerdefinerede genstande, spawn-zoner osv.). Importér det i appen for at gendanne eller redigere',
    backupLine3: 'dit arbejde senere. Minecraft ignorerer denne fil ved indlæsning af datapacken.',
    feedbackNote1:
      'Bemærk: denne pack kører "gamerule send_command_feedback false" ved indlæsning, så',
    feedbackNote2: '[ Acceptér ]/[ Aflever ]-knapperne ikke spammer "Triggered [..]" i chatten.',
    feedbackNote3: 'For at gendanne kommando-feedback, kør: gamerule send_command_feedback true',
    questsTitle: 'Quests i denne pack',
    questLine: '- {{name}} ({{type}}) - giver: {{giver}}',
    jobsListTitle: 'Jobs i denne pack',
    jobLine: '- {{name}} ({{action}}) - {{xp}} XP pr. handling, max niveau {{maxLevel}}',
    dimensionsTitle: 'Brugerdefinerede dimensioner',
    dimensionsStep1:
      '- Genstart verdenen efter installation eller opdatering af denne pack (ikke kun /reload).',
    dimensionsStep2: '- Dimension-/worldgen-ændringer kræver at du forlader og genåbner verdenen.',
    dimensionsStep3:
      '- Byg en lille platform i void-dimensioner før du tester dungeons eller pads.',
    dimensionLine: '- {{name}} ({{id}}) — test: /execute in {{id}} run tp @s 0 64 0',
    skinsTitle: 'Brugerdefinerede mob-skins (resource pack)',
    skinsStep1: '- Denne datapack-ZIP indeholder IKKE mob-teksturer.',
    skinsStep2: '- Eksport giver også en separat resource pack-ZIP (Download resource pack',
    skinsStep3: '  i Quest Tool). Installer den pack ud over denne datapack.',
    skinsStep4: "- Multiplayer: host resource pack-ZIP'en og sæt server.properties",
    skinsStep5: '  require-resource-pack=true og resource-pack=<url>.',
    skinsStep6: '- Single-player: aktiver resource pack under Indstillinger > Resource packs.',
    skinsStep7: "- Spillere skal måske genjoin'e (ikke kun /reload) efter skin-opdateringer.",
    skinsStep8: '- Brugerdefinerede teksturer gælder kun mobs spawnet af denne datapack med',
    skinsStep9: '  et konfigureret skin (gris, ko, ulv, kat, kylling, frø, zombie nautilus).',
    platformVanillaNote1: 'Bemærk: Penge spores på et internt "money"-scoreboard, og tilladelses-',
    platformVanillaNote2:
      'belønninger viser kun en chatbesked, da der ikke er plugins tilgængelige.',
    platformPaperNote1:
      'Bemærk: Penge/tilladelses-belønninger kører eco/lp-kommandoer som spilleren (@s).',
    platformPaperNote2: 'De kræver et economy-plugin + LuckPerms, der accepterer target selectors.',
    platformPaperNote3: 'Penge opdaterer også altid et internt "money"-scoreboard som fallback.',
  },
} as const;
