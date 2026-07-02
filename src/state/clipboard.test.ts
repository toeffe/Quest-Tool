import { describe, expect, it } from 'vitest';
import { createDungeon, createDungeonRoom } from '../types/dungeon';
import {
  createCustomItem,
  createCustomMob,
  createProject,
  createQuest,
} from '../types/factory';
import { uid } from '../types/ids';
import {
  ClipboardError,
  collectDependencies,
  pasteClipboard,
  serializeClipboard,
} from './clipboard';
import { exportProjectJson } from './projectStore';

function projectWithExtras() {
  const project = createProject('Test', 'en');
  project.quests = [];
  project.customItems = [];
  project.customMobs = [];
  project.dungeons = [];
  return project;
}

describe('clipboard', () => {
  it('round-trips a custom item with new id and tag dedup on collision', () => {
    const source = projectWithExtras();
    const item = createCustomItem('general', 'Ruby', 'en');
    item.tag = 'ruby';
    source.customItems = [item];

    const json = serializeClipboard(source, 'customItem', item.id);
    const target = projectWithExtras();
    target.customItems = [{ ...createCustomItem('general', 'Ruby', 'en'), tag: 'ruby' }];

    const { project, rootId, rootKind } = pasteClipboard(target, json);
    expect(rootKind).toBe('customItem');
    const pasted = project.customItems!.find((i) => i.id === rootId);
    expect(pasted).toBeDefined();
    expect(pasted!.id).not.toBe(item.id);
    expect(pasted!.tag).toBe('ruby_copy');
    expect(pasted!.name).toContain('Ruby');
    expect(pasted!.name).toContain('(copy)');
  });

  it('round-trips a custom mob with new id', () => {
    const source = projectWithExtras();
    const mob = createCustomMob('Captain', 'en');
    mob.tag = 'captain';
    source.customMobs = [mob];

    const json = serializeClipboard(source, 'customMob', mob.id);
    const target = projectWithExtras();

    const { project, rootId } = pasteClipboard(target, json);
    const pasted = project.customMobs!.find((m) => m.id === rootId);
    expect(pasted).toBeDefined();
    expect(pasted!.id).not.toBe(mob.id);
    expect(pasted!.tag).toBe('captain');
  });

  it('bundles custom item reward when copying a quest', () => {
    const source = projectWithExtras();
    const item = createCustomItem('general', 'Reward Sword', 'en');
    item.tag = 'reward_sword';
    const quest = createQuest('Main Quest', 'gather', 'en');
    quest.rewards = [{ type: 'item', customItemId: item.id, amount: 1 }];
    source.customItems = [item];
    source.quests = [quest];

    const bundle = collectDependencies('quest', quest.id, source);
    expect(bundle.customItems).toHaveLength(1);
    expect(bundle.customItems![0].id).toBe(item.id);

    const json = serializeClipboard(source, 'quest', quest.id);
    const target = projectWithExtras();
    const { project, rootId } = pasteClipboard(target, json);

    const pastedQuest = project.quests.find((q) => q.id === rootId);
    expect(pastedQuest).toBeDefined();
    expect(project.customItems).toHaveLength(1);
    const pastedItem = project.customItems![0];
    expect(pastedQuest!.rewards[0].customItemId).toBe(pastedItem.id);
  });

  it('bundles chain prerequisite quests when copying a quest', () => {
    const source = projectWithExtras();
    const prereq = createQuest('Prereq', 'talk', 'en');
    const quest = createQuest('Follow-up', 'kill', 'en');
    quest.chain.requires = prereq.name;
    source.quests = [prereq, quest];

    const bundle = collectDependencies('quest', quest.id, source);
    expect(bundle.quests).toHaveLength(2);
    expect(bundle.quests!.map((q) => q.name).sort()).toEqual(['Follow-up', 'Prereq']);

    const json = serializeClipboard(source, 'quest', quest.id);
    const target = projectWithExtras();
    const { project } = pasteClipboard(target, json);
    expect(project.quests).toHaveLength(2);
    const pastedFollowUp = project.quests.find((q) => q.name.includes('Follow-up'));
    expect(pastedFollowUp?.chain.requires).toBe('Prereq');
  });

  it('bundles custom mob when copying a dungeon', () => {
    const source = projectWithExtras();
    const mob = createCustomMob('Guard', 'en');
    mob.tag = 'guard';
    const dungeon = createDungeon('Crypt', 'en');
    dungeon.rooms = [
      {
        ...createDungeonRoom('Entry'),
        spawns: [
          {
            id: uid(),
            sourceType: 'customMob',
            customMobId: mob.id,
            count: 2,
            spawnOnEntry: true,
            respawn: false,
          },
        ],
      },
    ];
    source.customMobs = [mob];
    source.dungeons = [dungeon];

    const bundle = collectDependencies('dungeon', dungeon.id, source);
    expect(bundle.customMobs).toHaveLength(1);

    const json = serializeClipboard(source, 'dungeon', dungeon.id);
    const target = projectWithExtras();
    const { project, rootId } = pasteClipboard(target, json);

    const pastedDungeon = project.dungeons!.find((d) => d.id === rootId);
    expect(pastedDungeon).toBeDefined();
    expect(project.customMobs).toHaveLength(1);
    expect(pastedDungeon!.rooms[0].spawns[0].customMobId).toBe(project.customMobs![0].id);
  });

  it('rejects invalid JSON', () => {
    const project = projectWithExtras();
    expect(() => pasteClipboard(project, 'not json')).toThrow(ClipboardError);
  });

  it('rejects full project JSON', () => {
    const project = projectWithExtras();
    const projectJson = exportProjectJson(project);
    expect(() => pasteClipboard(project, projectJson)).toThrow(ClipboardError);
  });

  it('rejects wrong qtmc marker', () => {
    const project = projectWithExtras();
    expect(() => pasteClipboard(project, JSON.stringify({ qtmc: 99 }))).toThrow(ClipboardError);
  });
});
