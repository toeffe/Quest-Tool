export const commandsDa = {
  page: {
    title: 'In-game kommandoer',
    subtitle:
      'Alle kommandoer denne datapack tilføjer, klar til kopiering. De bruger dit projekts namespace, så geneksportér og reload pakken hvis du omdøber det. Spillere behøver aldrig disse for at spille quests — de er til opsætning og administration.',
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
        'Jobs kører automatisk hvert tick. Følg niveauer under Esc → Advancements → dit packs namespace-faneblad.',
    },
  },

  entries: {
    reload: 'Indlæs datapacken efter at have lagt ZIP\'en i datapacks-mappen.',
    setupGuide: 'Vis klikbare spawn-kommandoer for alle NPC\'er i chat.',
    spawnAll: 'Spawn alle NPC\'er ved din nuværende placering på én gang.',
    spawnQuest:
      'Spawn NPC(er) for "{{questName}}" ({{where}})',
    spawnFixed:
      'spawner ved faste koordinater {{x}} {{y}} {{z}}',
    spawnManual: 'spawner hvor du kører den',
    spawnPlayer: 'spawner ved din placering',
    resetSelf:
      'Nulstil din egen questfremgang, job-XP og jobniveauer.',
    resetPlayer:
      'Nulstil en specifik spillers quest- og jobfremgang (erstat <player>).',
    resetAll:
      'Nulstil quest- og jobfremgang for alle der er online lige nu.',
    debug:
      'Verificér at NPC\'er findes, se queststatusværdier og dine jobniveauer og XP.',
    syncAll:
      'Giv job-advancement-noder igen til alle online spillere (retter manglende faner efter eksport).',
    syncJob: 'Synkronisér "{{jobName}}" advancement-træ til nuværende niveauer.',
    passiveJob:
      '{{xpPerAction}} XP pr. fisk fanget, maks. niveau {{maxLevel}}',
  },
} as const;
