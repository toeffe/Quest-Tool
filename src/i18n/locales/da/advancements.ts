export const advancementsDa = {
  title: 'Advancements',
  subtitle:
    'Forhåndsvis hvordan jobfærdigheder vises i Minecraft. In-game, åbn Esc → Advancements → {{namespace}} for at følge niveauer. Hvert job genererer en rod-node og en niveaukæde (Lv.1 → Lv.2 → …).',
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
    showingMilestones:
      'Viser milestones; alle {{maxLevel}} niveauer genereres i datapacken.',
  },

  footer:
    'Quest kill-zone advancements er kun interne tællere og vises ikke her. Rediger ikoner, baggrund og beskrivelser på fanen Jobs. Efter geneksport, kør /function {{namespace}}:jobs/sync_all hvis faner ser forkerte ud.',

  levelTitleDefault: '{{name}} — Niveau {{level}}',
} as const;
