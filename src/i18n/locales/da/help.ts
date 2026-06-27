export const helpDa = {
  title: 'Kom godt i gang',
  closeTitle: 'Luk hjælp',
  intro:
    'Byg quests til Minecraft Java 1.21.11, og eksportér derefter en klar-til-installation datapack. Dit arbejde gemmes automatisk i denne browser. Historieflow er standardvisningen. Brug Indstillinger (tandhjulsikon) → Import for at gendanne en JSON-fil eller en datapack-ZIP du downloadede tidligere. Genveje: Ctrl/Cmd+K kommandopalette, Ctrl/Cmd+E hop til Eksport, Ctrl/Cmd+Shift+E næste fejl (i Historieflow).',

  views: {
    flow: {
      title: 'Historieflow',
      body:
        'Det primære quest-arbejdsområde — åbner som standard. Hvert kort viser spillerens gennemspilning trin for trin. Træk fra højre port (→) til en anden quests venstre port (←). Klik på et link for at fjerne det eller sætte auto-start. Klik på et trin for at redigere i den justerbare inspector. Fanen Kæde i inspectoren sætter job-gates og opfølgningsadfærd. Sidepanel: træk i grebet for at omarrangere quests. Genveje: Ctrl/Cmd+Shift+A auto-arranger, Ctrl/Cmd+Shift+F tilpas visning, Ctrl/Cmd+Shift+E næste fejl, Esc luk inspector. Værktøjslinje: Tilpas fejl, Næste fejl, Kun fejl-filter.',
    },
    editor: {
      title: 'Editor',
      body:
        'Fuld-bredde tabbed quest-editor — brug når du vil have mere plads end flow-inspectoren. Åbn via fanen Editor eller knappen Fuld editor i flow-inspectoren. Rediger Mål, NPC, Belønninger og Kæde med en valideringslinje nederst.',
    },
    items: {
      title: 'Brugerdefinerede genstande',
      body:
        'Definér trofæ-samlere, mad, værktøj og mere. Brug dem som questbelønninger, saml-/leveringsmål eller spawn-zone mob-drops. Genstande bruger komponentsyntaks — ingen brugerdefinerede teksturer medmindre du tilføjer en resource pack.',
    },
    jobs: {
      title: 'Jobs',
      body:
        'Passive færdigheder (fiskeri, minedrift, kamp og mere) stiger i niveau fra spillerhandlinger. Nye projekter inkluderer 11 starterjobs. Konfigurer XP-kurver, stat-presets og milestone-belønninger der giver brugerdefinerede genstande ved level-up.',
    },
    advancements: {
      title: 'Advancements',
      body:
        'Forhåndsvis de in-game færdighedstræer der eksporteres med din datapack. Spillere åbner Esc → Advancements → dit namespace-faneblad for at følge jobniveauer.',
    },
    commands: {
      title: 'Kommandoer',
      body:
        'En reference over de admin-kommandoer den genererede datapack tilføjer (spawn af NPC\'er, nulstilling, debug, job-sync).',
    },
    export: {
      title: 'Eksport',
      body:
        'Gennemgå validering, læs platformens installationsguide, forhåndsvis genererede filer og download datapack-ZIP\'en. ZIP\'en indeholder quest-tool-project.json så du kan genimportere dit arbejde via Indstillinger.',
    },
  },
} as const;
