export const advancementsEn = {
  title: 'Advancements',
  subtitle: 'Preview job skill trees for your datapack.',
  subtitleHint:
    'In-game: Esc → Advancements → {{namespace}}. Each job gets a root node and level chain. Edit icons and text on the Jobs tab.',
  namespaceFallback: 'your namespace',

  empty: 'No jobs defined. Add a job on the Jobs tab to generate a skill tree.',

  list: {
    title: 'Job trees ({{count}})',
    levels: '{{count}} levels',
  },

  preview: {
    inGameTitle: 'In-game preview',
    rootIconTitle: 'Root',
    levelIconTitle: 'Level {{level}}',
    moreLevels: '+{{count}} more',
    background: 'Background: {{background}}',
  },

  root: {
    title: 'Root — {{name}}',
    icon: 'Icon:',
    description: 'Description:',
  },

  levelChain: {
    title: 'Level chain',
    level: 'Lv.{{level}}',
    reward: 'reward',
    showingMilestones: 'Showing milestones; all {{maxLevel}} levels are generated in the datapack.',
  },

  footer:
    'Quest kill-zone advancements are internal counters only and do not appear here. Edit icons, background, and descriptions on the Jobs tab. After re-export, run /function {{namespace}}:jobs/sync_all if tabs look wrong.',

  levelTitleDefault: '{{name}} — Level {{level}}',
} as const;
