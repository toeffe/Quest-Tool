import { describe, expect, it } from 'vitest';
import { hasBlockingErrors, validateProject } from '../../generator/validate';
import { createProject, createQuest } from '../../types/factory';

describe('export gating', () => {
  it('blocks export when validation reports errors', () => {
    const project = createProject('Bad', 'en');
    const quest = createQuest('Kill', 'kill', 'en');
    quest.objectives = [{ amount: 5 }];
    project.quests = [quest];
    const issues = validateProject(project, 'en');
    expect(hasBlockingErrors(issues)).toBe(true);
  });

  it('allows export for a valid minimal project', () => {
    const project = createProject('Good', 'en');
    project.quests = [createQuest('Kill', 'kill', 'en')];
    const issues = validateProject(project, 'en');
    expect(hasBlockingErrors(issues)).toBe(false);
  });
});
