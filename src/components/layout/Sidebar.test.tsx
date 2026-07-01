/**
 * @vitest-environment jsdom
 */
import '@testing-library/jest-dom/vitest';
import { render, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useUIStore } from '../../store/uiStore';
import { useProjectStore } from '../../store/useProjectStore';
import { createProject } from '../../types/factory';
import { Sidebar } from './Sidebar';

vi.mock('../../hooks/useValidation', () => ({
  useValidation: () => [],
}));

describe('Sidebar', () => {
  beforeEach(() => {
    const project = createProject('Test');
    useProjectStore.setState({ project });
    useUIStore.setState({ selectedQuestId: project.quests[0].id });
  });

  it('disables delete when only one quest remains', () => {
    const { container } = render(<Sidebar />);
    const actions = container.querySelector('.quest-sidebar-item-actions');
    expect(actions).not.toBeNull();
    const del = within(actions as HTMLElement).getByRole('button', { name: /delete/i });
    expect(del).toBeDisabled();
  });
});
