import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { hasBlockingErrors, validateProject } from '../generator/validate';
import { importProjectJson } from '../state/projectStore';

describe('quest-tool/project.example.json', () => {
  it('imports and has no blocking validation errors', () => {
    const raw = readFileSync(resolve(__dirname, '../../quest-tool/project.example.json'), 'utf8');
    const project = importProjectJson(raw);
    expect(project.version).toBe(10);
    expect(project.quests).toHaveLength(2);
    expect(project.customItems?.[0]?.id).toBe('itemcoin01a2');
    const issues = validateProject(project, 'en');
    expect(hasBlockingErrors(issues)).toBe(false);
  });
});
