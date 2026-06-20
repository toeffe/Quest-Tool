import { describe, it, expect } from 'vitest';
import { createCustomItem } from '../types/factory';
import {
  buildClearStackArg,
  buildGiveCommand,
  buildItemStackArg,
  customDataSnbt,
} from './items';

describe('custom item commands', () => {
  it('embeds questtool_id in custom_data', () => {
    const item = createCustomItem('general', 'Magic Key');
    item.tag = 'magic_key';
    expect(customDataSnbt(item)).toBe('{questtool_id:"magic_key"}');
  });

  it('builds a give command with display name and lore', () => {
    const item = createCustomItem('collectible', 'Royal Seal');
    item.tag = 'royal_seal';
    item.displayName = 'Royal Seal';
    item.lore = ['Awarded for loyalty'];
    const cmd = buildGiveCommand(item, '@s', 1);
    expect(cmd).toContain('give @s minecraft:paper[');
    expect(cmd).toContain('custom_data={questtool_id:"royal_seal"}');
    expect(cmd).toContain('item_name="Royal Seal"');
    expect(cmd).toContain('lore=[\'{"text":"Awarded for loyalty"}\']');
    expect(cmd).toContain('enchantment_glint_override=true');
    expect(cmd).toContain('max_stack_size=1');
    expect(cmd).toContain('unbreakable={}');
  });

  it('builds clear stack arg with only custom_data for matching', () => {
    const item = createCustomItem('general', 'Token');
    item.baseItem = 'minecraft:stick';
    item.tag = 'quest_token';
    expect(buildClearStackArg(item)).toBe(
      'minecraft:stick[custom_data={questtool_id:"quest_token"}]',
    );
  });

  it('includes food, consumable, and tool components when set', () => {
    const item = createCustomItem('food', 'Magic Apple');
    item.tag = 'magic_apple';
    item.food = { nutrition: 6, saturation: 1.2, canAlwaysEat: true };
    item.consumable = {
      consumeSeconds: 2,
      effects: [{ effectId: 'minecraft:regeneration', amplifier: 1, duration: 200 }],
    };
    const stack = buildItemStackArg(item);
    expect(stack).toContain('food={nutrition:6,saturation:1.2,can_always_eat:true}');
    expect(stack).toContain('consumable={consume_seconds:2');
    expect(stack).toContain('minecraft:apply_effects');
    expect(stack).toContain('"minecraft:regeneration"');

    const toolItem = createCustomItem('tool', 'Sand Shovel');
    toolItem.tag = 'sand_shovel';
    toolItem.tool = {
      defaultMiningSpeed: 1,
      damagePerBlock: 0,
      rules: [{ blocks: 'minecraft:sand', speed: 100 }],
    };
    expect(buildItemStackArg(toolItem)).toContain(
      'tool={default_mining_speed:1,damage_per_block:0,rules:[{blocks:"minecraft:sand",speed:100}]}',
    );
  });

  it('escapes special characters in display strings', () => {
    const item = createCustomItem('general', 'Quote Test');
    item.displayName = 'Say "hello"';
    item.lore = ['Line\nbreak'];
    const stack = buildItemStackArg(item);
    expect(stack).toContain('item_name="Say \\"hello\\""');
    expect(stack).toContain('\\n');
  });
});
