import { describe, it, expect } from 'vitest';
import { createProject, createQuest, createCustomItem } from '../types/factory';
import { type Objective } from '../types/quest';
import { validateProject, hasBlockingErrors } from './validate';

describe('validation', () => {
  it('passes a well-formed kill quest', () => {
    const project = createProject('Good');
    project.quests = [createQuest('Kill', 'kill')];
    const issues = validateProject(project);
    expect(hasBlockingErrors(issues)).toBe(false);
  });

  it('flags a missing objective target', () => {
    const project = createProject('Bad');
    const quest = createQuest('Kill', 'kill');
    quest.objectives = [{ amount: 5 }];
    project.quests = [quest];
    const issues = validateProject(project);
    expect(issues.some((i) => i.level === 'error' && /target/.test(i.message))).toBe(true);
  });

  it('flags a broken chain prerequisite', () => {
    const project = createProject('Chain');
    const quest = createQuest('Second', 'kill');
    quest.chain.requires = 'Does Not Exist';
    project.quests = [quest];
    const issues = validateProject(project);
    expect(issues.some((i) => /not a quest/.test(i.message))).toBe(true);
  });

  it('flags duplicate quest names', () => {
    const project = createProject('Dup');
    project.quests = [createQuest('Same', 'kill'), createQuest('Same', 'gather')];
    const issues = validateProject(project);
    expect(issues.some((i) => /Duplicate quest name/.test(i.message))).toBe(true);
  });

  it('warns about permission rewards on vanilla', () => {
    const project = createProject('Vanilla');
    project.platform = 'vanilla';
    const quest = createQuest('Perm', 'kill');
    quest.rewards = [{ type: 'permission', value: 'group.vip' }];
    project.quests = [quest];
    const issues = validateProject(project);
    expect(issues.some((i) => i.level === 'warning' && /permission/i.test(i.message))).toBe(true);
  });

  it('accepts custom item objectives without a vanilla target', () => {
    const project = createProject('Items');
    const item = createCustomItem('general', 'Token');
    project.customItems = [item];
    const quest = createQuest('Gather', 'gather');
    quest.objectives = [{ customItemId: item.id, amount: 3 }];
    project.quests = [quest];
    const issues = validateProject(project);
    expect(hasBlockingErrors(issues)).toBe(false);
  });

  it('flags missing custom item references', () => {
    const project = createProject('Broken');
    const quest = createQuest('Gather', 'gather');
    quest.objectives = [{ customItemId: 'missing-id', amount: 1 }];
    project.quests = [quest];
    const issues = validateProject(project);
    expect(issues.some((i) => /custom item that no longer exists/.test(i.message))).toBe(true);
  });

  it('flags duplicate custom item tags', () => {
    const project = createProject('Dup');
    const a = createCustomItem('general', 'A');
    const b = createCustomItem('general', 'B');
    a.tag = 'same_tag';
    b.tag = 'same_tag';
    project.customItems = [a, b];
    project.quests = [createQuest('Q', 'kill')];
    project.quests[0].rewards = [{ type: 'item', customItemId: a.id, amount: 1 }];
    const issues = validateProject(project);
    expect(issues.some((i) => /Duplicate custom item tag/.test(i.message))).toBe(true);
  });

  function spawnZoneObjective(patch: Partial<Objective> = {}): Objective {
    return {
      target: 'minecraft:zombie',
      amount: 5,
      spawnZone: true,
      location: { x: 0, y: 64, z: 0 },
      zoneDropMode: 'custom',
      ...patch,
    };
  }

  it('flags gather spawn zone missing mob', () => {
    const project = createProject('Zone');
    const quest = createQuest('Farm', 'gather');
    quest.objectives = [
      {
        target: 'minecraft:leather',
        amount: 5,
        spawnZone: true,
        location: { x: 0, y: 64, z: 0 },
      },
    ];
    project.quests = [quest];
    const issues = validateProject(project);
    expect(issues.some((i) => /no mob\/creature is set/.test(i.message))).toBe(true);
  });

  it('flags custom spawn zone drops with no entries', () => {
    const project = createProject('Zone');
    const quest = createQuest('Arena', 'kill');
    quest.objectives = [spawnZoneObjective({ zoneDrops: [] })];
    project.quests = [quest];
    const issues = validateProject(project);
    expect(issues.some((i) => /no drops are configured/.test(i.message))).toBe(true);
    expect(hasBlockingErrors(issues)).toBe(true);
  });

  it('flags spawn zone drop missing item', () => {
    const project = createProject('Zone');
    const quest = createQuest('Arena', 'kill');
    quest.objectives = [spawnZoneObjective({ zoneDrops: [{ amount: 1 }] })];
    project.quests = [quest];
    const issues = validateProject(project);
    expect(issues.some((i) => /missing an item/.test(i.message))).toBe(true);
  });

  it('flags invalid spawn zone drop chance', () => {
    const project = createProject('Zone');
    const quest = createQuest('Arena', 'kill');
    quest.objectives = [
      spawnZoneObjective({ zoneDrops: [{ target: 'minecraft:bone', chance: 0 }] }),
    ];
    project.quests = [quest];
    const issues = validateProject(project);
    expect(issues.some((i) => /chance must be between 1 and 100/.test(i.message))).toBe(true);
  });

  it('flags spawn zone drop referencing missing custom item', () => {
    const project = createProject('Zone');
    const quest = createQuest('Arena', 'kill');
    quest.objectives = [
      spawnZoneObjective({ zoneDrops: [{ customItemId: 'missing-id', amount: 1 }] }),
    ];
    project.quests = [quest];
    const issues = validateProject(project);
    expect(
      issues.some((i) => /spawn zone drop references a custom item that no longer exists/.test(i.message)),
    ).toBe(true);
  });

  it('accepts valid custom spawn zone drops', () => {
    const project = createProject('Zone');
    const item = createCustomItem('collectible', 'Trophy');
    project.customItems = [item];
    const quest = createQuest('Arena', 'kill');
    quest.objectives = [
      spawnZoneObjective({
        zoneDrops: [
          { target: 'minecraft:bone', amount: 2, chance: 50 },
          { customItemId: item.id, amount: 1 },
        ],
      }),
    ];
    project.quests = [quest];
    const issues = validateProject(project);
    expect(hasBlockingErrors(issues)).toBe(false);
  });
});
