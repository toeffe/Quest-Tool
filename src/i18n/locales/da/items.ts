export const itemsDa = {
  title: 'Brugerdefinerede genstande',
  subtitle:
    'Definér genbrugelige genstande med brugerdefinerede navne, lore og adfærd. Brug dem som questbelønninger eller saml-/leveringsmål. Genstande bruger Minecraft-genstandskomponenter (ingen brugerdefinerede teksturer i v1).',

  kinds: {
    general: 'Generel',
    collectible: 'Samlere',
    food: 'Mad',
    tool: 'Værktøj',
  },

  rarity: {
    common: 'Almindelig',
    uncommon: 'Ualmindelig',
    rare: 'Sjælden',
    epic: 'Episk',
  },

  list: {
    title: 'Genstande ({{count}})',
    addTitle: 'Tilføj generel genstand',
    empty: 'Ingen brugerdefinerede genstande endnu. Opret en for at bruge i quests.',
    untitled: 'Genstand uden titel',
    copy: 'Kopiér',
    delete: 'Slet',
    addCollectible: '+ Samlere',
    addFood: '+ Mad',
    addTool: '+ Værktøj',
    selectEmpty: 'Vælg en genstand fra listen, eller opret en ny.',
  },

  editor: {
    itemKind: 'Genstandstype',
    itemKindHint:
      'Samlere er trofæ-lignende belønninger med fornuftige standarder.',
    editorName: 'Editornavn',
    editorNameHint: 'Internt label i dette værktøj kun.',
    identityTag: 'Identitetstag',
    identityTagHint: 'Gemt i custom_data; bruges til at matche genstande i quests.',
    baseItem: 'Basisgenstand',
    baseItemHint:
      'Vanilla-genstand dette er baseret på (udseende matcher dette, medmindre du tilføjer en resource pack).',
    baseItemPlaceholder: 'minecraft:paper',
    displayName: 'Visningsnavn',
    displayNameHint: 'Vises for spilleren in-game.',
    lore: 'Lore',
    loreHint: 'Én linje pr. række.',
    loreCollectibleHint:
      'Én linje pr. række. f.eks. "Tildelt for at fuldføre dragequesten."',
    lorePlaceholder: 'Linje et\nLinje to',
  },

  food: {
    title: 'Mad & forbrug',
    nutrition: 'Næring',
    saturation: 'Mæthed',
    canAlwaysEat: 'Kan altid spises',
    consumeTime: 'Spisetid (sekunder)',
    consumeTimeHint: 'Hvor lang tid det tager at spise.',
    effectId: 'Effekt-id',
    effectPlaceholder: 'minecraft:regeneration',
    amplifier: 'Forstærker',
    duration: 'Varighed (ticks)',
    addEffect: '+ Tilføj effekt',
  },

  tool: {
    title: 'Værktøj',
    defaultMiningSpeed: 'Standard minedriftshastighed',
    damagePerBlock: 'Skade pr. blok',
    blocks: 'Blokke',
    blocksHint: 'Blok-id eller tag',
    blocksPlaceholder: 'minecraft:sand',
    speed: 'Hastighed',
    addBlockRule: '+ Tilføj blokregel',
  },

  advanced: {
    title: 'Avanceret',
    glint: 'Fortryllelsesglans',
    enchantments: 'Fortryllelser',
    enchantmentId: 'Fortryllelse',
    enchantmentIdHint: 'Vanilla-fortryllelses-id.',
    enchantmentPlaceholder: 'minecraft:unbreaking',
    enchantmentLevel: 'Niveau',
    enchantmentLevelHint: 'Vanilla maks.: {{max}}',
    addEnchantment: '+ Tilføj fortryllelse',
    rarity: 'Sjældenhed',
    maxStackSize: 'Maks. stakstørrelse',
    maxStackSizeHint: 'Lad stå på 64 for standard, eller sæt 1 for unikke genstande.',
    unbreakable: 'Uødelægelig',
  },

  preview: {
    title: 'Forhåndsvisning af genereret kommando',
    hint:
      'Efter eksport, kør /function {{namespace}}:give_custom_items for at modtage én af hver brugerdefineret genstand til test.',
  },
} as const;
