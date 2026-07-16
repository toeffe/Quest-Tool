export const commandsDa = {
  page: {
    title: 'In-game kommandoer',
    subtitle: 'Admin-kommandoer fra din datapack.',
    subtitleHint:
      'Klar til kopiering med dit projekt-namespace. Geneksportér efter omdøbning. Spillere behøver dem ikke til normal quest-spil.',
  },

  groups: {
    setup: {
      title: 'Opsætning & spawning',
      description: 'Kør disse efter installation af datapacken og reload af verdenen.',
    },
    progress: {
      title: 'Fremgang & admin',
      description:
        'Nulstil questfremgang og job-XP/niveauer. Kræver operator/snydekoder. {{resetJobsNote}}',
    },
    diagnostics: {
      title: 'Diagnostik',
    },
    jobs: {
      title: 'Jobs',
      description:
        'Jobs kører automatisk hvert tick. Følg niveauer under Esc → Fremskridt → din packs namespace-fane.',
    },
    customMobs: {
      title: 'Brugerdefinerede mobs',
      description: 'Spawn projekt-definerede mobs til test eller placering i verdenen.',
    },
    dungeons: {
      title: 'Dungeons',
      description: 'Initialisér, nulstil og styr dungeon-rum manuelt.',
    },
    containers: {
      title: 'Verdenscontainere',
      description: 'Placér og genopfyld kister/tønder konfigureret under Containere.',
    },
  },

  entries: {
    reload: "Indlæs datapacken efter at have lagt ZIP'en i datapacks-mappen.",
    setupGuide: "Vis klikbare spawn-kommandoer for alle NPC'er i chat.",
    spawnAll: "Spawn alle NPC'er ved din nuværende placering på én gang.",
    spawnQuest: 'Spawn NPC(er) for "{{questName}}" ({{where}})',
    spawnFixed: 'spawner ved faste koordinater {{x}} {{y}} {{z}}',
    spawnManual: 'spawner hvor du kører den',
    spawnPlayer: 'spawner ved din placering',
    resetSelf: 'Nulstil din egen questfremgang, job-XP og jobniveauer.',
    resetPlayer: 'Nulstil en specifik spillers quest- og jobfremgang (erstat <player>).',
    resetAll: 'Nulstil quest- og jobfremgang for alle der er online lige nu.',
    debug: "Verificér at NPC'er findes, se queststatusværdier og dine jobniveauer og XP.",
    syncAll:
      'Giv job-advancement-noder igen til alle online spillere (retter manglende faner efter eksport).',
    syncJob: 'Synkronisér "{{jobName}}" advancement-træ til nuværende niveauer.',
    passiveJob: '{{xpPerAction}} XP pr. fisk fanget, maks. niveau {{maxLevel}}',
    giveCustomMobs: 'Spawn én af hver brugerdefineret mob foran dig (test).',
    spawnCustomMob: 'Spawn brugerdefineret mob "{{mobName}}" ved din placering.',
    debugCustomMobPhases: 'Debug fasetilstand for "{{mobName}}" (HP%, faseindeks, tærskler).',
    dungeonInit: 'Initialisér dungeon "{{name}}" — scoreboards og init-spawns.',
    dungeonReset: 'Nulstil dungeon "{{name}}" — dræb mobs og ryd rumtilstand.',
    containersPlaceAll: 'Placér alle verdenscontainere og fyld dem fra deres loot-tabel.',
    containersRefillAll: 'Tøm og genopfyld alle verdenscontainere uden at erstatte blokken.',
    giveQuestlog: 'Giv dig selv questlog-bogen (fremgang opdateres automatisk mens den holdes).',
  },
} as const;
