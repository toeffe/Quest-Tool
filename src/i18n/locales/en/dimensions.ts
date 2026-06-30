export const dimensionsEn = {
  title: 'Dimensions',
  subtitle: 'Void custom dimensions and teleport pads between worlds.',

  overworld: 'Overworld',

  list: {
    dimensionsTitle: 'Dimensions ({{count}})',
    padsTitle: 'Teleport pads ({{count}})',
    emptyDimensions: 'No custom dimensions yet. Create one for void dungeon worlds.',
    emptyPads: 'No teleport pads yet.',
    addDimension: 'Add dimension',
    addPad: 'Add pad',
    deleteDimensionConfirm: 'Delete this dimension and clear references?',
    deletePadConfirm: 'Delete this teleport pad?',
    selectEmpty: 'Select a dimension or teleport pad from the list.',
    untitled: 'Untitled',
    padMeta: '{{from}} → {{to}}',
  },

  editor: {
    dimensionName: 'Dimension name',
    dimensionTag: 'Dimension tag',
    description: 'Description (optional)',
    dimension: 'Dimension',
    padName: 'Pad name',
    cooldownSeconds: 'Cooldown (seconds)',
    cooldownHint: 'Minimum wait before the pad can be used again. Use 1s+ for round trips.',
    atEndpoint: 'At (source)',
    toEndpoint: 'To (destination)',
    radius: 'Detection radius',
    radiusHint: 'Half-size of the cubic detection region.',
    coordsHint: 'Center coordinates of the detection region.',
    dimensionIdHint: 'In-game ID: {{id}} — test with /execute in {{id}} run tp @s 0 64 0',
  },
} as const;
