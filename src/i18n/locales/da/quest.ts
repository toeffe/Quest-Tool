export const questDa = {
  platform: {
    paper: 'PaperMC-server',
    vanilla: 'Vanilla-server',
    lan: 'Åben for LAN (singleplayer)',
  },

  types: {
    talk: 'Tal med en NPC',
    kill: 'Dræb mobs',
    gather: 'Saml genstande',
    delivery: 'Lever genstande',
    exploration: 'Udforsk en placering',
    daily: 'Daglig / gentagelig',
  },

  rewards: {
    item: 'Genstand',
    xp: 'Erfaring',
    money: 'Penge',
    permission: 'Tilladelse',
    command: 'Brugerdefineret kommando',
    jobXp: 'Job-XP',
  },
} as const;
