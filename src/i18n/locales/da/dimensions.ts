export const dimensionsDa = {
  title: 'Dimensioner',
  subtitle: 'Void-brugerdefinerede dimensioner og teleportpuder mellem verdener.',

  overworld: 'Overworld',

  list: {
    dimensionsTitle: 'Dimensioner ({{count}})',
    padsTitle: 'Teleportpuder ({{count}})',
    emptyDimensions: 'Ingen brugerdefinerede dimensioner endnu. Opret en til void-dungeon-verdener.',
    emptyPads: 'Ingen teleportpuder endnu.',
    addDimension: 'Tilføj dimension',
    addPad: 'Tilføj pude',
    deleteDimensionConfirm: 'Slet denne dimension og ryd referencer?',
    deletePadConfirm: 'Slet denne teleportpude?',
    selectEmpty: 'Vælg en dimension eller teleportpude på listen.',
    untitled: 'Uden titel',
    padMeta: '{{from}} → {{to}}',
  },

  editor: {
    dimensionName: 'Dimensionsnavn',
    dimensionTag: 'Dimensionstag',
    description: 'Beskrivelse (valgfri)',
    dimension: 'Dimension',
    padName: 'Pudenavn',
    cooldownSeconds: 'Cooldown (sekunder)',
    cooldownHint: 'Minimum ventetid før puden kan bruges igen. Brug 1s+ til rundture.',
    atEndpoint: 'Ved (kilde)',
    toEndpoint: 'Til (destination)',
    radius: 'Detektionsradius',
    radiusHint: 'Halv størrelse af den kubiske detektionsregion.',
    coordsHint: 'Midterkoordinater for detektionsregionen.',
    dimensionIdHint: 'In-game ID: {{id}} — test med /execute in {{id}} run tp @s 0 64 0',
  },
} as const;
