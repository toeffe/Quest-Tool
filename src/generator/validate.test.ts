import { describe, it, expect } from 'vitest';
import { createProject, createQuest } from '../types/factory';
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
});
