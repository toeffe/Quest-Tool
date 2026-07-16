export const containersEn = {
  title: 'Containers',
  subtitle: 'World chests and barrels that refill on a timer.',
  subtitleHint:
    'Place containers at fixed coordinates. Stock can include vanilla or custom quest items. Refills clear the inventory first.',

  overworld: 'Overworld',

  list: {
    title: 'Containers ({{count}})',
    empty: 'No world containers yet. Add a chest or barrel to restock loot in the world.',
    add: 'Add container',
    deleteConfirm: 'Delete this world container?',
    selectEmpty: 'Select a container from the list.',
    untitled: 'Untitled',
  },

  editor: {
    name: 'Container name',
    blockType: 'Block type',
    location: 'Location',
    coordsHint: 'Block coordinates where the container is placed.',
    dimension: 'Dimension',
    refillInterval: 'Refill interval (seconds)',
    refillHint: 'How often the container clears and restocks. Minimum 1 second.',
    stock: 'Stock',
    stockHint: 'Items placed into the container on each refill (chance and amount per entry).',
    addStock: 'Add item',
    emptyStock: 'No stock items yet — refills will leave the container empty.',
    blockChest: 'Chest',
    blockTrappedChest: 'Trapped chest',
    blockBarrel: 'Barrel',
  },
} as const;
