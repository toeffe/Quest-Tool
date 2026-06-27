import { describe, it, expect } from 'vitest';
import { createProject, createQuest } from '../types/factory';
import { buildCommandReference } from './commands';

describe('command reference', () => {
  it('uses the project namespace and lists core admin commands', () => {
    const project = createProject('Ref', 'en');
    project.namespace = 'mypack';
    project.quests = [createQuest('Hunt', 'kill')];
    const groups = buildCommandReference(project);
    const all = groups.flatMap((g) => g.commands.map((c) => c.command));

    expect(all).toContain('/function mypack:setup_guide');
    expect(all).toContain('/function mypack:spawn_all');
    expect(all).toContain('/function mypack:reset');
    expect(all).toContain('/function mypack:reset_all');
    expect(all).toContain('/function mypack:debug');
  });

  it('includes a per-quest spawn command for each quest', () => {
    const project = createProject('Ref', 'en');
    project.namespace = 'p';
    project.quests = [createQuest('Alpha', 'kill'), createQuest('Beta', 'gather')];
    const groups = buildCommandReference(project);
    const spawnGroup = groups.find((g) => g.title === 'Setup & Spawning')!;
    const spawnCmds = spawnGroup.commands.filter((c) => /:spawn\//.test(c.command));
    expect(spawnCmds).toHaveLength(2);
    expect(spawnCmds[0].command).toMatch(/^\/function p:spawn\/0_alpha$/);
  });
});
