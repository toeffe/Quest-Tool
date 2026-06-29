export const jobsDa = {
  title: 'Jobs',
  subtitle:
    'Passive færdigheder der stiger i niveau, når spillere udfører handlinger — fiskeri, minedrift, kamp og mere. Jobfremgang sendes i samme datapack som dine quests. Konfigurer milestone-belønninger for at give brugerdefinerede genstande ved nøgleniveauer.',

  list: {
    title: 'Jobs ({{count}})',
    addTitle: 'Tilføj job',
    empty: 'Ingen jobs endnu. Tilføj et for at aktivere passiv færdighedsprogression.',
    untitled: 'Job uden titel',
    meta: '{{action}} · maks. Lv.{{maxLevel}}',
    selectEmpty: 'Vælg et job fra listen, eller klik + Tilføj for at oprette et.',
  },

  actions: {
    fish: 'Fiskeri',
    combat: 'Kamp',
    breeding: 'Avl',
    enchanting: 'Fortryllelse',
    trading: 'Handel',
    pvp: 'PvP',
    mine: 'Minedrift',
    woodcut: 'Skovhugning',
    farm: 'Landbrug',
    hunt: 'Jagt',
    craft: 'Håndværk',
    use: 'Genstandsbrug',
    walk: 'Gang (distance)',
    sprint: 'Sprint (distance)',
    custom: 'Brugerdefineret stat',
  },

  settings: {
    jobSettings: 'Jobindstillinger',
    balancedDefaults: 'Balancerede standarder',
    balancedDefaultsTitle: 'Nulstil XP-kurve til balancerede standarder for denne handling',
    jobName: 'Jobnavn',
    jobNameHint: 'Vises i level-up-beskeder og questkrav.',
    actionType: 'Handlingstype',
    actionTypeHint: 'Hvilken spilleraktivitet dette job sporer.',
    targetPreset: 'Mål-preset',
    targetPresetHint: 'Hvilke blokke, mobs eller genstande tæller mod dette job.',
    singleTarget: 'Enkelt mål-id',
    singleTargetHint: 'f.eks. minecraft:coal_ore, minecraft:zombie, minecraft:bread',
    customCriterion: 'Brugerdefineret scoreboard-kriterium',
    customCriterionHint: 'f.eks. minecraft.custom:minecraft.jump',
    cmPerXpUnit: 'Centimeter pr. XP-enhed',
    cmPerXpUnitHint: 'Standard 1000 (10 blokke gået/sprintet pr. XP-tick).',
    xpPerAction: 'XP pr. handling',
    xpPerDistance: 'XP pr. distanceenhed',
    xpPerActionHint: 'Hvor meget job-XP der gives hver gang den sporede handling sker.',
    xpPerDistanceHint:
      'Centimeter pr. enhed sættes nedenfor (standard 1000 cm = 10 blokke).',
    xpPerLevel: 'XP pr. niveau',
    xpPerLevelHint: 'Flad kurve: total XP til niveau L = XP pr. niveau × L.',
    maxLevel: 'Maks. niveau',
    showActionBar: 'Vis XP-gevinst på action bar',
    showActionBarHint: 'Kort action bar-besked når XP optjenes',
    progressDisplay: 'Fremgangsvisning',
    progressDisplayHint:
      'Personlig boss bar øverst (niveau, XP, fremgang — én pr. spiller)',
  },

  statPresets: {
    ores: 'Værdifulde malme',
    logs: 'Alle trætyper',
    crops: 'Landbrugsafgrøder',
    hostile_mobs: 'Fjendtlige mobs',
    animals: 'Passive dyr',
    basic_crafts: 'Betydelige håndværk',
    single: 'Enkelt mål',
  },

  milestones: {
    title: 'Milestone-belønninger',
    add: '+ Tilføj milestone',
    hint:
      'Gives automatisk når en spiller når niveauet in-game. Link brugerdefinerede genstande fra fanen Brugerdefinerede genstande.',
    empty:
      'Ingen milestones endnu. Tilføj niveau 5, 10, 25, 50 for at belønne loyale spillere.',
    atLevel: 'Ved niveau',
    noRewards:
      'Ingen belønninger konfigureret — denne milestone springes over i datapacken.',
    addReward: '+ Tilføj belønning',
    vanillaOption: 'Vanilla: {{item}}',
    type: 'Type',
    item: 'Genstand',
    amount: 'Antal',
    command: 'Kommando',
    commandPlaceholder: 'effect give {player} minecraft:speed 60 1',
  },

  milestoneRewards: {
    item: 'Genstand',
    xp: 'Erfaring',
    money: 'Penge',
    command: 'Brugerdefineret kommando',
  },

  advancements: {
    title: 'Advancements',
    hint:
      'Spillere ser job-faneblade under Esc → Advancements efter at have joinet verdenen (eller /reload).',
    icon: 'Advancement-ikon',
    iconHint: 'Vanilla-genstand-id vist på advancement-træet.',
    background: 'Fanebaggrund',
    backgroundHint:
      'Tekstur bag det in-game advancement-træ (Minecraft 1.21.11-format).',
    rootDescription: 'Rodbeskrivelse',
    rootDescriptionHint: 'Vises på rod-noden for dette job.',
    levelTitle: 'Niveautitel-skabelon',
    levelTitleHint: 'Brug {name} og {n} for jobnavn og niveau. Standard: "{name} — Niveau {n}"',
    levelTitlePlaceholder: '{{name}} — Niveau {n}',
  },

  advancementBackgrounds: {
    husbandry: 'Husbandry (grøn)',
    adventure: 'Eventyr (kort)',
    stone: 'Historie (sten)',
    nether: 'Nether (rød)',
    end: 'End (lilla)',
  },

  preview: {
    title: 'Forhåndsvisning',
    xpPerAction: 'Hver handling giver {{xp}} XP.',
    level2: 'Niveau 2 kræver {{xp}} total XP (~{{actions}} handlinger).',
    level5: 'Niveau 5 kræver {{xp}} total XP (~{{actions}} handlinger).',
    noRetroactive:
      'Handlinger udført før installation af datapacken giver ikke retroaktiv XP.',
  },

  rootDescriptions: {
    fish: 'Fang fisk for at optjene XP og stige i niveau i denne færdighed.',
    default: 'Udfør handlinger for at optjene XP og stige i niveau i denne færdighed.',
  },
} as const;
