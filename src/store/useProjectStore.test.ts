import { beforeEach, describe, expect, it } from 'vitest';
import { createProject } from '../types/factory';
import { useProjectStore } from './useProjectStore';

describe('useProjectStore deleteQuest', () => {
  beforeEach(() => {
    useProjectStore.setState({ project: createProject('Test') });
  });

  it('refuses to delete the last remaining quest', () => {
    const id = useProjectStore.getState().project.quests[0].id;
    const ok = useProjectStore.getState().deleteQuest(id);
    expect(ok).toBe(false);
    expect(useProjectStore.getState().project.quests).toHaveLength(1);
  });

  it('deletes a quest when more than one exists', () => {
    useProjectStore.getState().addQuest();
    const quests = useProjectStore.getState().project.quests;
    expect(quests.length).toBeGreaterThan(1);
    const ok = useProjectStore.getState().deleteQuest(quests[1].id);
    expect(ok).toBe(true);
    expect(useProjectStore.getState().project.quests).toHaveLength(1);
  });
});
