export const advancementsDa = {
  title: 'Advancements',
  subtitle: 'Forhåndsvis job-færdighedstræ til din datapack.',
  subtitleHint:
    'In-game: Esc → Advancements → {{namespace}}. Hvert job får en rod-node og niveaukæde. Rediger ikoner og tekst på Jobs-fanen.',
  namespaceFallback: 'dit namespace',

  empty: 'Ingen jobs defineret. Tilføj et job på fanen Jobs for at generere et færdighedstræ.',

  list: {
    title: 'Jobtræer ({{count}})',
    levels: '{{count}} niveauer',
  },

  preview: {
    inGameTitle: 'Forhåndsvisning in-game',
    rootIconTitle: 'Rod',
    levelIconTitle: 'Niveau {{level}}',
    moreLevels: '+{{count}} mere',
    background: 'Baggrund: {{background}}',
  },

  root: {
    title: 'Rod — {{name}}',
    icon: 'Ikon:',
    description: 'Beskrivelse:',
  },

  levelChain: {
    title: 'Niveaukæde',
    level: 'Lv.{{level}}',
    reward: 'belønning',
    showingMilestones: 'Viser milestones; alle {{maxLevel}} niveauer genereres i datapacken.',
  },

  footer:
    'Quest kill-zone advancements er kun interne tællere og vises ikke her. Rediger ikoner, baggrund og beskrivelser på fanen Jobs. Efter geneksport, kør /function {{namespace}}:jobs/sync_all hvis faner ser forkerte ud.',

  levelTitleDefault: '{{name}} — Niveau {{level}}',
} as const;
