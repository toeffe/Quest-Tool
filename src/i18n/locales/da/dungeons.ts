export const dungeonsDa = {
  title: 'Dungeons',
  subtitle: 'Rum med afgrænsning, spawns og triggere.',
  subtitleHint: 'Definér dungeon-områder, mob-spawns, quest-gates og rumhændelser til datapacken.',

  list: {
    title: 'Dungeons ({{count}})',
    empty: 'Ingen dungeons endnu. Opret en for at komme i gang.',
    addTitle: 'Tilføj dungeon',
    addRoom: '+ Rum',
    rooms: 'Rum',
    deleteDungeonConfirm: 'Slet denne dungeon og alle dens rum?',
    deleteRoomConfirm: 'Slet dette rum?',
  },

  editor: {
    selectDungeon: 'Vælg en dungeon fra listen, eller opret en ny.',
    selectRoom: 'Vælg et rum at redigere.',
    dungeonName: 'Dungeon-navn',
    dungeonTag: 'Funktionstag',
    description: 'Beskrivelse (valgfri)',
    dimension: 'Dimension',
    dimensionHint:
      'Rummenes afgrænsninger er relative til den valgte dimension (Overworld eller en brugerdefineret void-dimension).',
    roomName: 'Rumnavn',
    roomType: 'Rumtype',
    customTypeLabel: 'Brugerdefineret typelabel',
    bounds: 'Afgrænsningsboks',
    boundsMin: 'Hjørne A',
    boundsMax: 'Hjørne B',
    boundsVolume: '{{count}} blokke',
    questGate: 'Quest-gate',
    questGateHint: 'Rummet er kun aktivt når questen er i den krævede tilstand.',
    gateQuest: 'Quest',
    gateState: 'Krævet tilstand',
    respawnCooldown: 'Respawn-cooldown (sekunder)',
    noGate: 'Altid aktiv',
  },

  roomTypes: {
    boss_room: 'Boss-rum',
    patrol_corridor: 'Patruljekorridor',
    treasure_vault: 'Skatkammer',
    entrance: 'Indgang',
    puzzle_room: 'Puzzle-rum',
    safe_room: 'Sikkert rum',
    custom: 'Brugerdefineret',
  },

  questStates: {
    '-1': 'Låst',
    '0': 'Tilgængelig',
    '1': 'Aktiv',
    '2': 'Klar til aflevering',
    '3': 'Færdig',
  },

  tabs: {
    spawns: 'Spawns',
    triggers: 'Triggere',
  },

  spawns: {
    title: 'Spawns',
    empty: 'Ingen spawns defineret.',
    add: '+ Tilføj spawn',
    count: 'Antal',
    spawnOnEntry: 'Spawn ved indgang',
    respawn: 'Respawn når dræbt',
    onInit: 'ved init',
    onEntry: 'ved indgang',
  },

  triggers: {
    title: 'Triggere',
    empty: 'Ingen triggere defineret.',
    add: '+ Tilføj trigger',
    event: 'Hændelse',
    action: 'Handling',
    fireOnce: 'Kun én gang',
    message: 'Besked',
    targets: 'Mål',
    targetsAll: 'Alle spillere',
    targetsRoom: 'Spillere i rum',
    questName: 'Quest-navn',
    state: 'Tilstand',
    chestCoords: 'Kiste-koordinater',
    command: 'Kommando',
  },

  triggerEvents: {
    on_entry: 'Ved indgang',
    on_all_mobs_killed: 'Når alle mobs er dræbt',
    on_quest_complete: 'Når quest er fuldført',
    on_exit: 'Ved udgang',
  },

  triggerActions: {
    set_quest_state: 'Sæt quest-tilstand',
    dialogue: 'Dialog',
    unlock_chest: 'Lås kiste op',
    custom_command: 'Brugerdefineret kommando',
  },
} as const;
