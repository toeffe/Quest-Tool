import { TEST_DATAPACK_SURFACE_Y } from './testDatapackConstants';

export const JOB_STATION_X = 50;
export const JOB_STATION_Z_START = -20;
export const JOB_STATION_Z_SPACING = 12;

const Y = TEST_DATAPACK_SURFACE_Y;

export function jobStationZ(index: number): number {
  return JOB_STATION_Z_START + index * JOB_STATION_Z_SPACING;
}

/** Job station centers for UI / guide (nameKey, x, z). */
export const JOB_STATION_LABELS: { nameKey: string; z: number; action: string }[] = [
  {
    nameKey: 'starter_fishing',
    z: jobStationZ(0),
    action: 'Catch a fish in the pool (rod in test kit)',
  },
  { nameKey: 'starter_mining', z: jobStationZ(1), action: 'Mine the coal ore' },
  { nameKey: 'starter_woodcutting', z: jobStationZ(2), action: 'Break the oak log pillar' },
  { nameKey: 'starter_farming', z: jobStationZ(3), action: 'Break mature wheat' },
  { nameKey: 'starter_combat', z: jobStationZ(4), action: 'Kill the caged zombie' },
  { nameKey: 'starter_hunting', z: jobStationZ(5), action: 'Kill the caged spider' },
  { nameKey: 'starter_breeding', z: jobStationZ(6), action: 'Breed cows with wheat from kit' },
  { nameKey: 'starter_enchanting', z: jobStationZ(7), action: 'Enchant a book at the table' },
  {
    nameKey: 'starter_trading',
    z: jobStationZ(8),
    action: 'Trade with the librarian (emeralds in kit)',
  },
  { nameKey: 'starter_crafting', z: jobStationZ(9), action: 'Craft oak planks at the table' },
  {
    nameKey: 'starter_pvp',
    z: jobStationZ(10),
    action: 'Kill another player (solo: skip — read sign at station)',
  },
];

function pad(x: number, z: number, color: string): string[] {
  return [`fill ${x - 1} ${Y} ${z - 1} ${x + 1} ${Y} ${z + 1} minecraft:${color}_concrete`];
}

/** mcfunction lines for job stations and zone markers. */
export function generateStationCommands(): string[] {
  const lines = ['# Quest Tool test yard — job stations and zone markers'];
  const x = JOB_STATION_X;

  // Fishing — water pool
  const z0 = jobStationZ(0);
  lines.push(
    ...pad(x, z0, 'blue'),
    `fill ${x - 1} ${Y - 1} ${z0 - 1} ${x + 1} ${Y - 1} ${z0 + 1} minecraft:water`,
  );

  // Mining — coal ore
  const z1 = jobStationZ(1);
  lines.push(...pad(x, z1, 'gray'), `setblock ${x} ${Y} ${z1} minecraft:coal_ore`);

  // Woodcutting — log
  const z2 = jobStationZ(2);
  lines.push(...pad(x, z2, 'brown'), `setblock ${x} ${Y} ${z2} minecraft:oak_log`);

  // Farming — mature wheat
  const z3 = jobStationZ(3);
  lines.push(...pad(x, z3, 'yellow'), `setblock ${x} ${Y} ${z3} minecraft:wheat[age=7]`);

  // Combat — caged zombie
  const z4 = jobStationZ(4);
  lines.push(
    ...pad(x, z4, 'red'),
    `fill ${x - 1} ${Y} ${z4 - 1} ${x + 1} ${Y + 2} ${z4 + 1} minecraft:glass`,
    `summon minecraft:zombie ${x} ${Y} ${z4} {NoAI:1b,PersistenceRequired:1b,Silent:1b}`,
  );

  // Hunting — caged spider
  const z5 = jobStationZ(5);
  lines.push(
    ...pad(x, z5, 'black'),
    `fill ${x - 1} ${Y} ${z5 - 1} ${x + 1} ${Y + 2} ${z5 + 1} minecraft:glass`,
    `summon minecraft:spider ${x} ${Y} ${z5} {NoAI:1b,PersistenceRequired:1b,Silent:1b}`,
  );

  // Breeding — two cows
  const z6 = jobStationZ(6);
  lines.push(
    ...pad(x, z6, 'pink'),
    `summon minecraft:cow ${x - 1} ${Y} ${z6} {NoAI:0b,PersistenceRequired:1b,Age:0}`,
    `summon minecraft:cow ${x + 1} ${Y} ${z6} {NoAI:0b,PersistenceRequired:1b,Age:0}`,
  );

  // Enchanting
  const z7 = jobStationZ(7);
  lines.push(...pad(x, z7, 'purple'), `setblock ${x} ${Y} ${z7} minecraft:enchanting_table`);

  // Trading — librarian + lectern
  const z8 = jobStationZ(8);
  lines.push(
    ...pad(x, z8, 'green'),
    `setblock ${x} ${Y} ${z8} minecraft:lectern`,
    `summon minecraft:villager ${x} ${Y} ${z8} {NoAI:1b,PersistenceRequired:1b,VillagerData:{profession:"librarian",level:1,type:"plains"}}`,
  );

  // Crafting table
  const z9 = jobStationZ(9);
  lines.push(...pad(x, z9, 'white'), `setblock ${x} ${Y} ${z9} minecraft:crafting_table`);

  // PvP pad + visual marker
  const z10 = jobStationZ(10);
  lines.push(...pad(x, z10, 'orange'), `setblock ${x} ${Y + 1} ${z10} minecraft:gold_block`);

  // Quest zone markers (vanilla / custom drop zones referenced by quests 10–11)
  lines.push(
    `setblock 28 ${Y} 28 minecraft:lime_concrete`,
    `setblock 36 ${Y} 36 minecraft:magenta_concrete`,
  );

  return lines;
}

export function generateTestKitCommands(): string[] {
  return [
    '# Tools and items for one-session test pack QA',
    'give @s minecraft:fishing_rod 1',
    'give @s minecraft:iron_pickaxe 1',
    'give @s minecraft:iron_axe 1',
    'give @s minecraft:iron_sword 1',
    'give @s minecraft:wheat 16',
    'give @s minecraft:bread 16',
    'give @s minecraft:oak_log 16',
    'give @s minecraft:lapis_lazuli 32',
    'give @s minecraft:book 4',
    'give @s minecraft:emerald 24',
    'give @s minecraft:egg 1',
    'function qtqa:give_custom_items',
  ];
}
