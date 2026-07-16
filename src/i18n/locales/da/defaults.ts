export const defaultsDa = {
  project: {
    name: 'Mit questpakke',
    namespace: 'questpack',
  },

  quest: {
    name: 'Ny quest',
    firstQuestName: 'Første quest',
    numberedName: 'Quest {{n}}',
    category: 'Generelt',
    description: 'En quest venter.',
  },

  npc: {
    name: 'Questgiver',
    tag: 'quest_giver',
    dialogue: {
      greeting: 'Goddag, rejsende! Jeg har brug for en med dine evner.',
      offer: 'Vil du hjælpe mig?',
      inProgress: 'Har du fuldført opgaven endnu?',
      completion: 'Fantastisk arbejde! Her er din belønning.',
    },
  },

  targetNpc: {
    name: 'Mål-NPC',
    tag: 'target_npc',
    dialogue: 'Du fandt mig! Vend nu tilbage til questgiveren.',
  },

  objectives: {
    kill: {
      description: 'Dræb zombier',
      target: 'minecraft:zombie',
      amount: 5,
    },
    gather: {
      description: 'Saml hvede',
      target: 'minecraft:wheat',
      amount: 10,
    },
    delivery: {
      description: 'Lever brød',
      target: 'minecraft:bread',
      amount: 3,
    },
    exploration: {
      description: 'Opdag den markerede placering',
      location: { x: 100, y: 64, z: 100 },
      radius: 5,
    },
    talk: {
      description: 'Tal med målet',
    },
    daily: {
      description: 'Saml råddent kød',
      target: 'minecraft:rotten_flesh',
      amount: 8,
    },
  },

  rewards: {
    xpAmount: 50,
    itemValue: 'minecraft:diamond',
    moneyAmount: 100,
    permissionValue: 'quest.reward.example',
    commandValue: 'say {player} fuldførte questen!',
    jobXpAmount: 50,
  },

  customItem: {
    name: 'Ny genstand',
    numberedName: 'Genstand {{n}}',
    tag: 'item',
    baseItem: 'minecraft:paper',
  },

  customMob: {
    name: 'Ny mob',
    numberedName: 'Mob {{n}}',
  },

  dungeon: {
    name: 'Nyt dungeon',
    numberedName: 'Dungeon {{n}}',
    defaultRoom: 'Indgangsrum',
  },

  dimension: {
    name: 'Ny dimension',
    numberedName: 'Dimension {{n}}',
  },

  pad: {
    name: 'Ny pad',
    numberedName: 'Pad {{n}}',
  },

  container: {
    name: 'Ny container',
    numberedName: 'Container {{n}}',
  },

  job: {
    defaultName: 'Fiskeri',
    numberedName: 'Job {{n}}',
    milestoneCommand: 'say {player} nåede en job-milestone!',
  },

  starterJobs: {
    starter_fishing: 'Fiskeri',
    starter_mining: 'Minedrift',
    starter_woodcutting: 'Skovhugning',
    starter_farming: 'Landbrug',
    starter_combat: 'Kamp',
    starter_hunting: 'Jagt',
    starter_breeding: 'Avl',
    starter_enchanting: 'Fortryllelse',
    starter_trading: 'Handel',
    starter_crafting: 'Håndværk',
    starter_pvp: 'PvP',
  },
} as const;
