export const defaultsEn = {
  project: {
    name: 'My Quest Pack',
    namespace: 'questpack',
  },

  quest: {
    name: 'New Quest',
    firstQuestName: 'First Quest',
    category: 'General',
    description: 'A quest awaits.',
  },

  npc: {
    name: 'Quest Giver',
    tag: 'quest_giver',
    dialogue: {
      greeting: 'Greetings, traveler! I have need of someone with your talents.',
      offer: 'Will you help me?',
      inProgress: 'Have you finished the task yet?',
      completion: 'Wonderful work! Here is your reward.',
    },
  },

  targetNpc: {
    name: 'Target NPC',
    tag: 'target_npc',
    dialogue: 'You found me! Now return to the quest giver.',
  },

  objectives: {
    kill: {
      description: 'Slay zombies',
      target: 'minecraft:zombie',
      amount: 5,
    },
    gather: {
      description: 'Collect wheat',
      target: 'minecraft:wheat',
      amount: 10,
    },
    delivery: {
      description: 'Deliver bread',
      target: 'minecraft:bread',
      amount: 3,
    },
    exploration: {
      description: 'Discover the marked location',
      location: { x: 100, y: 64, z: 100 },
      radius: 5,
    },
    talk: {
      description: 'Speak with the target',
    },
    daily: {
      description: 'Gather rotten flesh',
      target: 'minecraft:rotten_flesh',
      amount: 8,
    },
  },

  rewards: {
    xpAmount: 50,
    itemValue: 'minecraft:diamond',
    moneyAmount: 100,
    permissionValue: 'quest.reward.example',
    commandValue: 'say {player} finished the quest!',
    jobXpAmount: 50,
  },

  customItem: {
    name: 'New Item',
    tag: 'item',
    baseItem: 'minecraft:paper',
  },

  job: {
    defaultName: 'Fishing',
    milestoneCommand: 'say {player} reached a job milestone!',
  },

  starterJobs: {
    starter_fishing: 'Fishing',
    starter_mining: 'Mining',
    starter_woodcutting: 'Woodcutting',
    starter_farming: 'Farming',
    starter_combat: 'Combat',
    starter_hunting: 'Hunting',
    starter_breeding: 'Breeding',
    starter_enchanting: 'Enchanting',
    starter_trading: 'Trading',
    starter_crafting: 'Crafting',
    starter_pvp: 'PvP',
  },
} as const;
