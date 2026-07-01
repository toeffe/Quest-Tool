export const itemsEn = {
  title: 'Custom Items',
  subtitle: 'Reusable items for rewards and quest objectives.',
  subtitleHint:
    'Custom names, lore, and behavior via item components. No custom textures in v1 — add a resource pack separately if needed.',

  kinds: {
    general: 'General',
    collectible: 'Collectible',
    food: 'Food',
    tool: 'Tool',
  },

  rarity: {
    common: 'Common',
    uncommon: 'Uncommon',
    rare: 'Rare',
    epic: 'Epic',
  },

  list: {
    title: 'Items ({{count}})',
    addTitle: 'Add general item',
    empty: 'No custom items yet. Create one to use in quests.',
    untitled: 'Untitled item',
    copy: 'Copy',
    delete: 'Del',
    addCollectible: '+ Collectible',
    addFood: '+ Food',
    addTool: '+ Tool',
    selectEmpty: 'Select an item from the list or create a new one.',
  },

  editor: {
    itemKind: 'Item kind',
    itemKindHint: 'Collectibles are trophy-style rewards with sensible defaults.',
    editorName: 'Editor name',
    editorNameHint: 'Internal label in this tool only.',
    identityTag: 'Identity tag',
    identityTagHint: 'Stored in custom_data; used to match items in quests.',
    baseItem: 'Base item',
    baseItemHint:
      'Vanilla item this is based on (appearance matches this unless you add a resource pack).',
    baseItemPlaceholder: 'minecraft:paper',
    displayName: 'Display name',
    displayNameHint: 'Shown to the player in-game.',
    lore: 'Lore',
    loreHint: 'One line per row.',
    loreCollectibleHint: 'One line per row. e.g. "Awarded for completing the dragon quest."',
    lorePlaceholder: 'Line one\nLine two',
  },

  food: {
    title: 'Food & consumable',
    nutrition: 'Nutrition',
    saturation: 'Saturation',
    canAlwaysEat: 'Can always eat',
    consumeTime: 'Consume time (seconds)',
    consumeTimeHint: 'How long eating takes.',
    effectId: 'Effect id',
    effectPlaceholder: 'minecraft:regeneration',
    amplifier: 'Amplifier',
    duration: 'Duration (ticks)',
    addEffect: '+ Add effect',
  },

  tool: {
    title: 'Tool',
    defaultMiningSpeed: 'Default mining speed',
    damagePerBlock: 'Damage per block',
    blocks: 'Blocks',
    blocksHint: 'Block id or tag',
    blocksPlaceholder: 'minecraft:sand',
    speed: 'Speed',
    addBlockRule: '+ Add block rule',
  },

  advanced: {
    title: 'Advanced',
    glint: 'Enchantment glint',
    enchantments: 'Enchantments',
    enchantmentId: 'Enchantment',
    enchantmentIdHint: 'Vanilla enchantment id.',
    enchantmentPlaceholder: 'minecraft:unbreaking',
    enchantmentLevel: 'Level',
    enchantmentLevelHint: 'Vanilla max: {{max}}',
    addEnchantment: '+ Add enchantment',
    rarity: 'Rarity',
    maxStackSize: 'Max stack size',
    maxStackSizeHint: 'Leave at 64 for default, or set 1 for unique items.',
    unbreakable: 'Unbreakable',
  },

  preview: {
    title: 'Generated command preview',
    hint: 'After exporting, run /function {{namespace}}:give_custom_items to receive one of each custom item for testing.',
  },
} as const;
