export const jobsEn = {
  title: 'Jobs',
  subtitle:
    'Passive skills that level up as players perform actions — fishing, mining, combat, and more. Job progress ships in the same datapack as your quests. Configure milestone rewards to grant custom items at key levels.',

  list: {
    title: 'Jobs ({{count}})',
    addTitle: 'Add job',
    empty: 'No jobs yet. Add one to enable passive skill progression.',
    untitled: 'Untitled job',
    meta: '{{action}} · max Lv.{{maxLevel}}',
    selectEmpty: 'Select a job from the list or click + Add to create one.',
  },

  actions: {
    fish: 'Fishing',
    combat: 'Combat',
    breeding: 'Breeding',
    enchanting: 'Enchanting',
    trading: 'Trading',
    pvp: 'PvP',
    mine: 'Mining',
    woodcut: 'Woodcutting',
    farm: 'Farming',
    hunt: 'Hunting',
    craft: 'Crafting',
    use: 'Item use',
    walk: 'Walking (distance)',
    sprint: 'Sprinting (distance)',
    custom: 'Custom stat',
  },

  settings: {
    jobSettings: 'Job settings',
    balancedDefaults: 'Balanced defaults',
    balancedDefaultsTitle: 'Reset XP curve to balanced defaults for this action',
    jobName: 'Job name',
    jobNameHint: 'Shown in level-up messages and quest requirements.',
    actionType: 'Action type',
    actionTypeHint: 'What player activity this job tracks.',
    targetPreset: 'Target preset',
    targetPresetHint: 'Which blocks, mobs, or items count toward this job.',
    singleTarget: 'Single target id',
    singleTargetHint: 'e.g. minecraft:coal_ore, minecraft:zombie, minecraft:bread',
    customCriterion: 'Custom scoreboard criterion',
    customCriterionHint: 'e.g. minecraft.custom:minecraft.jump',
    cmPerXpUnit: 'Centimeters per XP unit',
    cmPerXpUnitHint: 'Default 1000 (10 blocks walked/sprinted per XP tick).',
    xpPerAction: 'XP per action',
    xpPerDistance: 'XP per distance unit',
    xpPerActionHint: 'How much job XP is granted each time the tracked action occurs.',
    xpPerDistanceHint:
      'Centimeters per unit is set below (default 1000 cm = 10 blocks).',
    xpPerLevel: 'XP per level',
    xpPerLevelHint: 'Flat curve: total XP to reach level L = XP per level × L.',
    maxLevel: 'Max level',
    showActionBar: 'Show XP gain on action bar',
    showActionBarHint: 'Brief action bar message when XP is earned',
    progressDisplay: 'Progress display',
    progressDisplayHint:
      'Personal boss bar at top (level, XP, progress — one per player)',
  },

  statPresets: {
    ores: 'Common ores',
    logs: 'All log types',
    crops: 'Common crops',
    hostile_mobs: 'Hostile mobs',
    animals: 'Passive animals',
    basic_crafts: 'Basic crafts',
    single: 'Single target',
  },

  milestones: {
    title: 'Milestone rewards',
    add: '+ Add milestone',
    hint:
      'Granted automatically when a player reaches the level in-game. Link custom items from the Custom Items tab.',
    empty:
      'No milestones yet. Add levels 5, 10, 25, 50 to reward loyal players.',
    atLevel: 'At level',
    noRewards:
      'No rewards configured — this milestone will be skipped in the datapack.',
    addReward: '+ Add reward',
    vanillaOption: 'Vanilla: {{item}}',
    type: 'Type',
    item: 'Item',
    amount: 'Amount',
    command: 'Command',
    commandPlaceholder: 'effect give {player} minecraft:speed 60 1',
  },

  milestoneRewards: {
    item: 'Item',
    xp: 'Experience',
    money: 'Money',
    command: 'Custom command',
  },

  advancements: {
    title: 'Advancements',
    hint:
      'Players see job tabs under Esc → Advancements after joining the world (or /reload).',
    icon: 'Advancement icon',
    iconHint: 'Vanilla item id shown on the advancement tree.',
    background: 'Tab background',
    backgroundHint:
      'Texture behind the in-game advancement tree (Minecraft 1.21.11 format).',
    rootDescription: 'Root description',
    rootDescriptionHint: 'Shown on the root advancement node for this job.',
    levelTitle: 'Level title template',
    levelTitleHint: 'Use {name} and {n} for job name and level. Default: "{name} — Level {n}"',
    levelTitlePlaceholder: '{{name}} — Level {n}',
  },

  advancementBackgrounds: {
    husbandry: 'Husbandry (green)',
    adventure: 'Adventure (map)',
    stone: 'Story (stone)',
    nether: 'Nether (red)',
    end: 'End (purple)',
  },

  preview: {
    title: 'Preview',
    xpPerAction: 'Each action grants {{xp}} XP.',
    level2: 'Level 2 requires {{xp}} total XP (~{{actions}} actions).',
    level5: 'Level 5 requires {{xp}} total XP (~{{actions}} actions).',
    noRetroactive:
      'Actions performed before installing the datapack do not grant retroactive XP.',
  },

  rootDescriptions: {
    fish: 'Catch fish to earn XP and level up this skill.',
    default: 'Perform actions to earn XP and level up this skill.',
  },
} as const;
