/**
 * Appearance sub-variants for mobs used as NPCs, accurate for Minecraft 1.21.11.
 *
 * Two families of NBT exist:
 *  - Newer data-driven variants use a lowercase `variant` with a registry id
 *    (cat, wolf, frog, pig, cow, chicken), e.g. variant:"minecraft:tabby".
 *  - Long-standing fields keep their legacy names/types (horse/llama/parrot/
 *    axolotl `Variant` int, `RabbitType` int, sheep `Color` byte, fox `Type`
 *    string, creeper `powered`, goat `IsScreamingGoat`).
 *
 * Villagers are handled separately (profession + biome type) in the NPC step.
 */

export type VariantKind = 'idString' | 'plainString' | 'int' | 'byte' | 'bool';

export interface VariantOption {
  label: string;
  /** Stored selection value (formatted into NBT according to the field kind). */
  value: string;
}

export interface VariantField {
  nbtKey: string;
  label: string;
  kind: VariantKind;
  options: VariantOption[];
}

const opt = (label: string, value: string): VariantOption => ({ label, value });

const TEMP_VARIANTS: VariantOption[] = [
  opt('Temperate', 'temperate'),
  opt('Warm', 'warm'),
  opt('Cold', 'cold'),
];

export const MOB_VARIANTS: Record<string, VariantField[]> = {
  'minecraft:cat': [
    {
      nbtKey: 'variant',
      label: 'Cat pattern',
      kind: 'idString',
      options: [
        opt('Tabby', 'tabby'),
        opt('Tuxedo', 'black'),
        opt('Red', 'red'),
        opt('Siamese', 'siamese'),
        opt('British Shorthair', 'british_shorthair'),
        opt('Calico', 'calico'),
        opt('Persian', 'persian'),
        opt('Ragdoll', 'ragdoll'),
        opt('White', 'white'),
        opt('Jellie', 'jellie'),
        opt('Black', 'all_black'),
      ],
    },
  ],
  'minecraft:wolf': [
    {
      nbtKey: 'variant',
      label: 'Wolf variant',
      kind: 'idString',
      options: [
        opt('Pale', 'pale'),
        opt('Ashen', 'ashen'),
        opt('Black', 'black'),
        opt('Chestnut', 'chestnut'),
        opt('Rusty', 'rusty'),
        opt('Snowy', 'snowy'),
        opt('Spotted', 'spotted'),
        opt('Striped', 'striped'),
        opt('Woods', 'woods'),
      ],
    },
  ],
  'minecraft:frog': [
    { nbtKey: 'variant', label: 'Frog variant', kind: 'idString', options: TEMP_VARIANTS },
  ],
  'minecraft:pig': [
    { nbtKey: 'variant', label: 'Pig variant', kind: 'idString', options: TEMP_VARIANTS },
  ],
  'minecraft:cow': [
    { nbtKey: 'variant', label: 'Cow variant', kind: 'idString', options: TEMP_VARIANTS },
  ],
  'minecraft:chicken': [
    { nbtKey: 'variant', label: 'Chicken variant', kind: 'idString', options: TEMP_VARIANTS },
  ],
  'minecraft:fox': [
    {
      nbtKey: 'Type',
      label: 'Fox type',
      kind: 'plainString',
      options: [opt('Red', 'red'), opt('Snow', 'snow')],
    },
  ],
  'minecraft:rabbit': [
    {
      nbtKey: 'RabbitType',
      label: 'Rabbit type',
      kind: 'int',
      options: [
        opt('Brown', '0'),
        opt('White', '1'),
        opt('Black', '2'),
        opt('Black & White', '3'),
        opt('Gold', '4'),
        opt('Salt & Pepper', '5'),
        opt('The Killer Bunny', '99'),
      ],
    },
  ],
  'minecraft:parrot': [
    {
      nbtKey: 'Variant',
      label: 'Parrot color',
      kind: 'int',
      options: [
        opt('Red', '0'),
        opt('Blue', '1'),
        opt('Green', '2'),
        opt('Cyan', '3'),
        opt('Gray', '4'),
      ],
    },
  ],
  'minecraft:llama': [
    {
      nbtKey: 'Variant',
      label: 'Llama color',
      kind: 'int',
      options: [opt('Creamy', '0'), opt('White', '1'), opt('Brown', '2'), opt('Gray', '3')],
    },
  ],
  'minecraft:trader_llama': [
    {
      nbtKey: 'Variant',
      label: 'Llama color',
      kind: 'int',
      options: [opt('Creamy', '0'), opt('White', '1'), opt('Brown', '2'), opt('Gray', '3')],
    },
  ],
  'minecraft:horse': [
    {
      nbtKey: 'Variant',
      label: 'Horse color',
      kind: 'int',
      options: [
        opt('White', '0'),
        opt('Creamy', '1'),
        opt('Chestnut', '2'),
        opt('Brown', '3'),
        opt('Black', '4'),
        opt('Gray', '5'),
        opt('Dark Brown', '6'),
      ],
    },
  ],
  'minecraft:axolotl': [
    {
      nbtKey: 'Variant',
      label: 'Axolotl color',
      kind: 'int',
      options: [
        opt('Lucy (Pink)', '0'),
        opt('Wild (Brown)', '1'),
        opt('Gold', '2'),
        opt('Cyan', '3'),
        opt('Blue', '4'),
      ],
    },
  ],
  'minecraft:sheep': [
    {
      nbtKey: 'Color',
      label: 'Wool color',
      kind: 'byte',
      options: [
        opt('White', '0'),
        opt('Orange', '1'),
        opt('Magenta', '2'),
        opt('Light Blue', '3'),
        opt('Yellow', '4'),
        opt('Lime', '5'),
        opt('Pink', '6'),
        opt('Gray', '7'),
        opt('Light Gray', '8'),
        opt('Cyan', '9'),
        opt('Purple', '10'),
        opt('Blue', '11'),
        opt('Brown', '12'),
        opt('Green', '13'),
        opt('Red', '14'),
        opt('Black', '15'),
      ],
    },
  ],
  'minecraft:creeper': [
    {
      nbtKey: 'powered',
      label: 'Charged',
      kind: 'bool',
      options: [opt('Normal', '0b'), opt('Charged', '1b')],
    },
  ],
  'minecraft:goat': [
    {
      nbtKey: 'IsScreamingGoat',
      label: 'Screaming goat',
      kind: 'bool',
      options: [opt('Normal', '0b'), opt('Screaming', '1b')],
    },
  ],
};

export function variantFieldsFor(entityType: string): VariantField[] {
  return MOB_VARIANTS[entityType] ?? [];
}

function formatValue(kind: VariantKind, value: string): string {
  switch (kind) {
    case 'idString':
      return `"minecraft:${value}"`;
    case 'plainString':
      return `"${value}"`;
    case 'byte':
      return `${value}b`;
    case 'int':
    case 'bool':
      return value;
  }
}

/**
 * Produce the NBT field assignments (e.g. `variant:"minecraft:tabby"`) for the
 * selected variants of an entity, falling back to each field's first option so
 * the NPC always has a deterministic appearance.
 */
export function buildVariantNbt(entityType: string, variants?: Record<string, string>): string[] {
  return variantFieldsFor(entityType).map((field) => {
    const value = variants?.[field.nbtKey] ?? field.options[0].value;
    return `${field.nbtKey}:${formatValue(field.kind, value)}`;
  });
}
