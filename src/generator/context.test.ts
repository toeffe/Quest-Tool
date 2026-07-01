import { describe, expect, it } from 'vitest';
import { createProject, createQuest } from '../types/factory';
import { buildContext } from './context';

describe('buildContext identifiers', () => {
  it('keeps fnBase and spawnFn unique when quest names truncate to the same slug', () => {
    const project = createProject('Collision', 'en');
    project.namespace = 'collision';
    const longPrefix = 'a'.repeat(40);
    project.quests = Array.from({ length: 50 }, (_, i) =>
      createQuest(`${longPrefix}_quest_number_${i}`, 'kill', 'en'),
    );
    const ctx = buildContext(project);
    const fnBases = ctx.quests.map((q) => q.fnBase);
    const spawnFns = ctx.quests.map((q) => q.spawnFn);
    expect(new Set(fnBases).size).toBe(fnBases.length);
    expect(new Set(spawnFns).size).toBe(spawnFns.length);
  });
});
