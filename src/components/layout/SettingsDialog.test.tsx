/**
 * @vitest-environment jsdom
 */
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { exportProjectJson } from '../../state/projectStore';
import { useUIStore } from '../../store/uiStore';
import { useProjectStore } from '../../store/useProjectStore';
import { createProject } from '../../types/factory';
import { SettingsDialog } from './SettingsDialog';

vi.mock('../../state/projectStore', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../state/projectStore')>();
  return {
    ...actual,
    readProjectJsonFromFile: vi.fn(),
  };
});

import { readProjectJsonFromFile } from '../../state/projectStore';

describe('SettingsDialog import', () => {
  beforeEach(() => {
    useProjectStore.setState({ project: createProject('Before') });
    useUIStore.setState({ settingsOpen: true, selectedQuestId: null });
    vi.mocked(readProjectJsonFromFile).mockReset();
  });

  it('loads project JSON from a selected file', async () => {
    const imported = createProject('Imported');
    imported.namespace = 'importedpack';
    vi.mocked(readProjectJsonFromFile).mockResolvedValue(exportProjectJson(imported));

    render(<SettingsDialog />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['{}'], 'project.json', { type: 'application/json' });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(useProjectStore.getState().project.namespace).toBe('importedpack');
    });
  });
});
