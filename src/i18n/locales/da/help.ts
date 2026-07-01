export const helpDa = {
  title: 'Kom godt i gang',
  closeTitle: 'Luk hjælp',
  intro:
    'Byg quests til Minecraft Java 1.21.11 og eksportér en datapack. Arbejdet gemmes automatisk i browseren.',
  introHint:
    'Historieflow er standard. Indstillinger → Import gendanner JSON eller datapack-ZIP. Genveje: Ctrl/Cmd+K palette, Ctrl/Cmd+E Eksport, Ctrl/Cmd+Shift+E næste fejl.',

  shortcutsTitle: 'Tastaturgenveje',

  views: {
    flow: {
      title: 'Historieflow',
      summary: 'Hovedarbejdsområde — træk-forbind quests, rediger i inspector.',
      body: 'Hvert kort viser spillerens gennemspilning. Træk højre port (→) til venstre port (←). Klik link for at fjerne eller sætte auto-start. Kæde-fanen sætter job-gates. Sidepanel-greb omarrangerer quests. Ctrl/Cmd+Shift+A arranger, +F tilpas, +E næste fejl, Esc luk inspector.',
    },
    editor: {
      title: 'Editor',
      summary: 'Fuld-bredde tabbed quest-editor.',
      body: 'Mere plads end flow-inspectoren. Åbn via Editor-fanen eller Fuld editor. Mål, NPC, Belønninger, Kæde med validering nederst.',
    },
    items: {
      title: 'Brugerdefinerede genstande',
      summary: 'Trofæer, mad, værktøj til belønninger og mål.',
      body: 'Brug i questbelønninger, saml-/leveringsmål eller spawn-zone drops. Komponentsyntaks — ingen teksturer uden resource pack.',
    },
    jobs: {
      title: 'Jobs',
      summary: 'Passive færdigheder fra spillerhandlinger.',
      body: 'Nye projekter har 11 starterjobs. Konfigurer XP-kurver, presets og milepælsbelønninger.',
    },
    advancements: {
      title: 'Advancements',
      summary: 'Forhåndsvis in-game jobtræer.',
      body: 'Spillere åbner Esc → Advancements → dit namespace-faneblad.',
    },
    commands: {
      title: 'Kommandoer',
      summary: 'Reference for datapack admin-kommandoer.',
      body: "Spawn NPC'er, nulstil fremskridt, debug, job-sync — til opsætning og administration.",
    },
    export: {
      title: 'Eksport',
      summary: 'Validér og download datapack-ZIP.',
      body: 'Installationsguide, filforhåndsvisning og download. ZIP indeholder quest-tool-project.json til genimport.',
    },
  },
} as const;
