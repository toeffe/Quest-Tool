export const dungeonsEn = {
  title: 'Dungeons',
  subtitle: 'Define dungeon rooms with bounding boxes, mob spawns, and triggers.',

  list: {
    title: 'Dungeons ({{count}})',
    empty: 'No dungeons yet. Create one to get started.',
    addTitle: 'Add dungeon',
    addRoom: '+ Room',
    rooms: 'Rooms',
    deleteDungeonConfirm: 'Delete this dungeon and all its rooms?',
    deleteRoomConfirm: 'Delete this room?',
  },

  editor: {
    selectDungeon: 'Select a dungeon from the list, or create a new one.',
    selectRoom: 'Select a room to edit.',
    dungeonName: 'Dungeon name',
    dungeonTag: 'Function tag',
    description: 'Description (optional)',
    dimension: 'Dimension',
    dimensionHint: 'Room bounds are relative to the selected dimension (Overworld or a custom void dimension).',
    roomName: 'Room name',
    roomType: 'Room type',
    customTypeLabel: 'Custom type label',
    bounds: 'Bounding box',
    boundsMin: 'Corner A',
    boundsMax: 'Corner B',
    boundsVolume: '{{count}} blocks',
    questGate: 'Quest gate',
    questGateHint: 'Room is only active when the quest is in the required state.',
    gateQuest: 'Quest',
    gateState: 'Required state',
    respawnCooldown: 'Respawn cooldown (seconds)',
    noGate: 'Always active',
  },

  roomTypes: {
    boss_room: 'Boss room',
    patrol_corridor: 'Patrol corridor',
    treasure_vault: 'Treasure vault',
    entrance: 'Entrance',
    puzzle_room: 'Puzzle room',
    safe_room: 'Safe room',
    custom: 'Custom',
  },

  questStates: {
    '-1': 'Locked',
    '0': 'Available',
    '1': 'Active',
    '2': 'Ready to turn in',
    '3': 'Done',
  },

  tabs: {
    spawns: 'Spawns',
    triggers: 'Triggers',
  },

  spawns: {
    title: 'Spawns',
    empty: 'No spawns defined.',
    add: '+ Add spawn',
    count: 'Count',
    spawnOnEntry: 'Spawn on entry',
    respawn: 'Respawn when killed',
    onInit: 'on init',
    onEntry: 'on entry',
  },

  triggers: {
    title: 'Triggers',
    empty: 'No triggers defined.',
    add: '+ Add trigger',
    event: 'Event',
    action: 'Action',
    fireOnce: 'Fire once only',
    message: 'Message',
    targets: 'Targets',
    targetsAll: 'All players',
    targetsRoom: 'Players in room',
    questName: 'Quest name',
    state: 'State',
    chestCoords: 'Chest coordinates',
    command: 'Command',
  },

  triggerEvents: {
    on_entry: 'On entry',
    on_all_mobs_killed: 'On all mobs killed',
    on_quest_complete: 'On quest complete',
    on_exit: 'On exit',
  },

  triggerActions: {
    set_quest_state: 'Set quest state',
    dialogue: 'Dialogue',
    unlock_chest: 'Unlock chest',
    custom_command: 'Custom command',
  },
} as const;
