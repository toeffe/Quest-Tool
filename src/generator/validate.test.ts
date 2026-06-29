import { describe, it, expect } from 'vitest';
import { createProject, createQuest, createCustomItem, createCustomMob } from '../types/factory';
import { type Objective } from '../types/quest';
import { validateProject, hasBlockingErrors } from './validate';

const en = 'en' as const;

describe('validation', () => {
  it('passes a well-formed kill quest', () => {
    const project = createProject('Good', en);
    project.quests = [createQuest('Kill', 'kill', en)];
    const issues = validateProject(project, en);
    expect(hasBlockingErrors(issues)).toBe(false);
  });

  it('flags a missing objective target', () => {
    const project = createProject('Bad', en);
    const quest = createQuest('Kill', 'kill', en);
    quest.objectives = [{ amount: 5 }];
    project.quests = [quest];
    const issues = validateProject(project, en);
    expect(issues.some((i) => i.level === 'error' && /target/.test(i.message))).toBe(true);
  });

  it('flags a broken chain prerequisite', () => {
    const project = createProject('Chain', en);
    const quest = createQuest('Second', 'kill', en);
    quest.chain.requires = 'Does Not Exist';
    project.quests = [quest];
    const issues = validateProject(project, en);
    expect(issues.some((i) => /not a quest/.test(i.message))).toBe(true);
  });

  it('flags duplicate quest names', () => {
    const project = createProject('Dup', en);
    project.quests = [createQuest('Same', 'kill', en), createQuest('Same', 'gather', en)];
    const issues = validateProject(project, en);
    expect(issues.some((i) => /Duplicate quest name/.test(i.message))).toBe(true);
  });

  it('warns about permission rewards on vanilla', () => {
    const project = createProject('Vanilla', en);
    project.platform = 'vanilla';
    const quest = createQuest('Perm', 'kill', en);
    quest.rewards = [{ type: 'permission', value: 'group.vip' }];
    project.quests = [quest];
    const issues = validateProject(project, en);
    expect(issues.some((i) => i.level === 'warning' && /permission/i.test(i.message))).toBe(true);
  });

  it('accepts custom item objectives without a vanilla target', () => {
    const project = createProject('Items', en);
    const item = createCustomItem('general', 'Token');
    project.customItems = [item];
    const quest = createQuest('Gather', 'gather', en);
    quest.objectives = [{ customItemId: item.id, amount: 3 }];
    project.quests = [quest];
    const issues = validateProject(project, en);
    expect(hasBlockingErrors(issues)).toBe(false);
  });

  it('flags missing custom item references', () => {
    const project = createProject('Broken', en);
    const quest = createQuest('Gather', 'gather', en);
    quest.objectives = [{ customItemId: 'missing-id', amount: 1 }];
    project.quests = [quest];
    const issues = validateProject(project, en);
    expect(issues.some((i) => /custom item that no longer exists/.test(i.message))).toBe(true);
  });

  it('flags duplicate custom item tags', () => {
    const project = createProject('Dup', en);
    const a = createCustomItem('general', 'A');
    const b = createCustomItem('general', 'B');
    a.tag = 'same_tag';
    b.tag = 'same_tag';
    project.customItems = [a, b];
    project.quests = [createQuest('Q', 'kill', en)];
    project.quests[0].rewards = [{ type: 'item', customItemId: a.id, amount: 1 }];
    const issues = validateProject(project, en);
    expect(issues.some((i) => /Duplicate custom item tag/.test(i.message))).toBe(true);
  });

  it('flags invalid custom item enchantments', () => {
    const project = createProject('Enchants', en);
    const item = createCustomItem('tool', 'Bad Enchants');
    item.enchantments = [
      { enchantmentId: 'minecraft:efficiency', level: 0 },
      { enchantmentId: 'minecraft:efficiency', level: 5 },
    ];
    project.customItems = [item];
    project.quests = [createQuest('Q', 'kill', en)];
    project.quests[0].rewards = [{ type: 'item', customItemId: item.id, amount: 1 }];
    const issues = validateProject(project, en);
    expect(
      issues.some((i) => i.level === 'error' && /level must be at least 1/.test(i.message)),
    ).toBe(true);
    expect(
      issues.some((i) => i.level === 'error' && /duplicate enchantment/i.test(i.message)),
    ).toBe(true);
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
    const project = createProject('Zone', en);
    const quest = createQuest('Farm', 'gather', en);
    quest.objectives = [
      {
        target: 'minecraft:leather',
        amount: 5,
        spawnZone: true,
        location: { x: 0, y: 64, z: 0 },
      },
    ];
    project.quests = [quest];
    const issues = validateProject(project, en);
    expect(issues.some((i) => /no mob\/creature is set/.test(i.message))).toBe(true);
  });

  it('flags custom spawn zone drops with no entries', () => {
    const project = createProject('Zone', en);
    const quest = createQuest('Arena', 'kill', en);
    quest.objectives = [spawnZoneObjective({ zoneDrops: [] })];
    project.quests = [quest];
    const issues = validateProject(project, en);
    expect(issues.some((i) => /no drops are configured/.test(i.message))).toBe(true);
    expect(hasBlockingErrors(issues)).toBe(true);
  });

  it('flags spawn zone drop missing item', () => {
    const project = createProject('Zone', en);
    const quest = createQuest('Arena', 'kill', en);
    quest.objectives = [spawnZoneObjective({ zoneDrops: [{ amount: 1 }] })];
    project.quests = [quest];
    const issues = validateProject(project, en);
    expect(issues.some((i) => /missing an item/.test(i.message))).toBe(true);
  });

  it('flags invalid spawn zone drop chance', () => {
    const project = createProject('Zone', en);
    const quest = createQuest('Arena', 'kill', en);
    quest.objectives = [
      spawnZoneObjective({ zoneDrops: [{ target: 'minecraft:bone', chance: 0 }] }),
    ];
    project.quests = [quest];
    const issues = validateProject(project, en);
    expect(issues.some((i) => /chance must be between 1 and 100/.test(i.message))).toBe(true);
  });

  it('flags spawn zone drop referencing missing custom item', () => {
    const project = createProject('Zone', en);
    const quest = createQuest('Arena', 'kill', en);
    quest.objectives = [
      spawnZoneObjective({ zoneDrops: [{ customItemId: 'missing-id', amount: 1 }] }),
    ];
    project.quests = [quest];
    const issues = validateProject(project, en);
    expect(
      issues.some((i) => /spawn zone drop references a custom item that no longer exists/.test(i.message)),
    ).toBe(true);
  });

  it('accepts valid custom spawn zone drops', () => {
    const project = createProject('Zone', en);
    const item = createCustomItem('collectible', 'Trophy');
    project.customItems = [item];
    const quest = createQuest('Arena', 'kill', en);
    quest.objectives = [
      spawnZoneObjective({
        zoneDrops: [
          { target: 'minecraft:bone', amount: 2, chance: 50 },
          { customItemId: item.id, amount: 1 },
        ],
      }),
    ];
    project.quests = [quest];
    const issues = validateProject(project, en);
    expect(hasBlockingErrors(issues)).toBe(false);
  });

  it('flags job XP reward with missing job', () => {
    const project = createProject('Jobs', en);
    project.jobs = [];
    const quest = createQuest('Q', 'kill', en);
    quest.rewards = [{ type: 'jobXp', jobId: 'missing', amount: 10 }];
    project.quests = [quest];
    const issues = validateProject(project, en);
    expect(issues.some((i) => /job XP reward references a job/.test(i.message))).toBe(true);
  });

  it('flags chain requiresJob with missing job', () => {
    const project = createProject('Jobs', en);
    project.jobs = [];
    const quest = createQuest('Q', 'kill', en);
    quest.chain.requiresJob = { jobId: 'missing', level: 3 };
    project.quests = [quest];
    const issues = validateProject(project, en);
    expect(issues.some((i) => /requires a job that no longer exists/.test(i.message))).toBe(true);
  });

  it('flags mining job without single target', () => {
    const project = createProject('Jobs', en);
    project.jobs = [
      {
        id: 'm1',
        name: 'Mining',
        action: 'mine',
        statPreset: 'single',
        xpPerAction: 5,
        xpPerLevel: 100,
        maxLevel: 50,
        showActionBar: false,
      },
    ];
    const issues = validateProject(project, en);
    expect(issues.some((i) => /single target id/.test(i.message))).toBe(true);
  });

  it('flags milestone with missing custom item', () => {
    const project = createProject('Jobs', en);
    project.jobs = [
      {
        id: 'j1',
        name: 'Fishing',
        action: 'fish',
        xpPerAction: 10,
        xpPerLevel: 100,
        maxLevel: 50,
        showActionBar: false,
        milestones: [{ level: 5, rewards: [{ type: 'item', customItemId: 'gone', amount: 1 }] }],
      },
    ];
    const issues = validateProject(project, en);
    expect(issues.some((i) => /milestone references a custom item/.test(i.message))).toBe(true);
  });

  it('flags missing custom mob references on kill objectives', () => {
    const project = createProject('BrokenMob', en);
    const quest = createQuest('Kill', 'kill', en);
    quest.objectives = [{ eliteMobId: 'missing-id', amount: 1 }];
    project.quests = [quest];
    const issues = validateProject(project, en);
    expect(issues.some((i) => /custom mob that was deleted/.test(i.message))).toBe(true);
  });

  it('flags duplicate custom mob tags', () => {
    const project = createProject('DupMobs', en);
    const a = createCustomMob('Captain A', en);
    const b = createCustomMob('Captain B', en);
    a.tag = 'same_mob_tag';
    b.tag = 'same_mob_tag';
    project.customMobs = [a, b];
    project.quests = [createQuest('Q', 'kill', en)];
    project.quests[0].objectives = [{ eliteMobId: a.id, amount: 1 }];
    const issues = validateProject(project, en);
    expect(issues.some((i) => /Duplicate custom mob tag/.test(i.message))).toBe(true);
  });

  it('accepts kill quest with custom mob reference', () => {
    const project = createProject('GoodMob', en);
    const mob = createCustomMob('Elite Zombie', en);
    project.customMobs = [mob];
    const quest = createQuest('Kill', 'kill', en);
    quest.objectives = [{ eliteMobId: mob.id, amount: 3 }];
    project.quests = [quest];
    const issues = validateProject(project, en);
    expect(hasBlockingErrors(issues)).toBe(false);
  });
});
