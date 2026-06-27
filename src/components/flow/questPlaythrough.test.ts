import { describe, it, expect } from 'vitest';
import { createProject, createQuest } from '../../types/factory';
import {
  buildQuestPlaythrough,
  isStoryLocked,
  isStoryStart,
  prerequisiteResolved,
} from './questPlaythrough';
import { questsToEdges } from './chainEdges';

function enProject(name: string) {
  const project = createProject(name);
  project.locale = 'en';
  return project;
}

describe('buildQuestPlaythrough', () => {
  it('builds kill quest playthrough with return step', () => {
    const project = enProject('Test');
    const quest = createQuest('Slay zombies', 'kill');
    quest.npc.name = 'Elder Marcus';
    quest.objectives[0].description = 'Slay zombies';
    project.quests = [quest];

    const steps = buildQuestPlaythrough(quest, project);
    const labels = steps.map((s) => s.label);

    expect(labels.some((l) => l.includes('Meet Elder Marcus'))).toBe(true);
    expect(labels.some((l) => l.includes('Accept quest'))).toBe(true);
    expect(labels.some((l) => l.includes('Slay zombies'))).toBe(true);
    expect(labels.some((l) => l.includes('Return to Elder Marcus'))).toBe(true);
    expect(labels.some((l) => l.startsWith('Receive:'))).toBe(true);
  });

  it('includes prerequisite step when chained', () => {
    const project = enProject('Chain');
    const first = createQuest('First', 'talk');
    const second = createQuest('Second', 'kill');
    second.chain.requires = 'First';
    project.quests = [first, second];

    const steps = buildQuestPlaythrough(second, project);
    expect(steps[0].kind).toBe('prerequisite');
    expect(steps[0].label).toContain('First');
    expect(isStoryLocked(second)).toBe(true);
    const edges = questsToEdges(project.quests);
    expect(isStoryStart(first, project, edges)).toBe(true);
    expect(isStoryStart(second, project, edges)).toBe(false);
    expect(prerequisiteResolved(second, project)).toBe(true);
  });

  it('includes job requirement step', () => {
    const project = enProject('Jobs');
    const job = project.jobs![0];
    const quest = createQuest('Fishing quest', 'gather');
    quest.chain.requiresJob = { jobId: job.id, level: 5 };
    project.quests = [quest];

    const steps = buildQuestPlaythrough(quest, project);
    expect(steps.some((s) => s.label.includes(job.name) && s.label.includes('5'))).toBe(true);
  });

  it('builds instant talk quest without return step', () => {
    const project = enProject('Talk');
    const quest = createQuest('Quick chat', 'talk');
    project.quests = [quest];

    const steps = buildQuestPlaythrough(quest, project);
    expect(steps.some((s) => s.label.includes('Instant completion'))).toBe(true);
    expect(steps.some((s) => s.kind === 'return')).toBe(false);
  });

  it('includes travel step for exploration', () => {
    const project = enProject('Explore');
    const quest = createQuest('Find ruins', 'exploration');
    quest.objectives = [{ location: { x: 100, y: 64, z: -200 }, radius: 15 }];
    project.quests = [quest];

    const steps = buildQuestPlaythrough(quest, project);
    expect(steps.some((s) => s.kind === 'travel')).toBe(true);
    expect(steps.some((s) => s.kind === 'return')).toBe(false);
  });

  it('includes next quest and cooldown for daily', () => {
    const project = enProject('Daily');
    const a = createQuest('Daily A', 'daily');
    a.cooldownSeconds = 3600;
    const b = createQuest('Daily B', 'daily');
    a.chain.unlocks = 'Daily B';
    b.chain.requires = 'Daily A';
    project.quests = [a, b];

    const steps = buildQuestPlaythrough(a, project);
    expect(steps.some((s) => s.kind === 'next' && s.label.includes('Daily B'))).toBe(true);
    expect(steps.some((s) => s.kind === 'cooldown')).toBe(true);
  });
});
