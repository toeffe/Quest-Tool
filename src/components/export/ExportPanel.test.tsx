/**
 * @vitest-environment jsdom
 */
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ExportPanel } from './ExportPanel';

vi.mock('../../hooks/useValidation', () => ({
  useValidation: () => [{ level: 'error', message: 'Quest has no objective.' }],
}));

vi.mock('../../hooks/useExport', () => ({
  useExport: () => ({
    busy: false,
    downloaded: false,
    resourcePackDownloaded: false,
    testDownloaded: false,
    error: null,
    resourcePackError: null,
    testError: null,
    hasSkins: false,
    downloadDatapack: vi.fn(),
    downloadResourcePack: vi.fn(),
    downloadTestDatapack: vi.fn(),
  }),
}));

vi.mock('../../store/useProjectStore', () => ({
  useProject: () => ({
    name: 'Test',
    namespace: 'test',
    platform: 'vanilla',
    locale: 'en',
    quests: [],
    customItems: [],
    version: 10,
    id: 'p1',
  }),
}));

describe('ExportPanel', () => {
  it('disables datapack download when validation has blocking errors', () => {
    render(<ExportPanel />);
    const download = screen.getByRole('button', { name: /download datapack/i });
    expect(download).toBeDisabled();
  });
});
