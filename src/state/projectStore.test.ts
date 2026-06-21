import { describe, it, expect } from 'vitest';
import JSZip from 'jszip';
import { createProject, createQuest, PROJECT_SCHEMA_VERSION } from '../types/factory';
import {
  importProjectJson,
  exportProjectJson,
  createAndAddCustomItem,
  deleteCustomItem,
  readProjectJsonFromFile,
  PROJECT_BACKUP_FILENAME,
} from './projectStore';
describe('projectStore migration', () => {
  it('backfills customItems when importing schema v1 projects', () => {
    const legacy = {
      id: 'legacy-id',
      name: 'Legacy',
      namespace: 'legacy',
      platform: 'vanilla',
      quests: [createQuest('Q', 'kill')],
      version: 1,
    };
    const project = importProjectJson(JSON.stringify(legacy));
    expect(project.version).toBe(PROJECT_SCHEMA_VERSION);
    expect(project.customItems).toEqual([]);
  });

  it('backfills zoneDropMode vanilla for existing spawn zones when upgrading to v3', () => {
    const legacy = {
      id: 'legacy-id',
      name: 'Legacy',
      namespace: 'legacy',
      platform: 'vanilla',
      quests: [
        {
          ...createQuest('Arena', 'kill'),
          objectives: [
            {
              target: 'minecraft:zombie',
              amount: 5,
              spawnZone: true,
              location: { x: 0, y: 64, z: 0 },
            },
          ],
        },
      ],
      version: 2,
    };
    const project = importProjectJson(JSON.stringify(legacy));
    expect(project.version).toBe(PROJECT_SCHEMA_VERSION);
    expect(project.quests[0].objectives[0].zoneDropMode).toBe('vanilla');
  });
});

describe('custom item CRUD', () => {
  it('createAndAddCustomItem adds to project', () => {
    const project = createProject('Test');
    const { project: next, item } = createAndAddCustomItem(project, 'collectible');
    expect(next.customItems).toHaveLength(1);
    expect(item.kind).toBe('collectible');
  });

  it('deleteCustomItem clears quest references', () => {
    let project = createProject('Test');
    const { project: withItem, item } = createAndAddCustomItem(project, 'general');
    project = withItem;
    project.quests[0].rewards = [{ type: 'item', customItemId: item.id, amount: 1 }];
    project.quests[0].objectives = [{ customItemId: item.id, amount: 1 }];
    project.quests[0].objectives[0].zoneDrops = [{ customItemId: item.id, amount: 1 }];
    const next = deleteCustomItem(project, item.id);
    expect(next.customItems).toHaveLength(0);
    expect(next.quests[0].rewards[0].customItemId).toBeUndefined();
    expect(next.quests[0].objectives[0].customItemId).toBeUndefined();
    expect(next.quests[0].objectives[0].zoneDrops![0].customItemId).toBeUndefined();
  });
});

describe('project import files', () => {
  it('reads project JSON from a datapack ZIP backup', async () => {
    const project = createProject('Zip Pack');
    project.namespace = 'zippack';
    const zip = new JSZip();
    zip.file(PROJECT_BACKUP_FILENAME, exportProjectJson(project));
    const blob = await zip.generateAsync({ type: 'blob' });
    const file = new File([blob], 'pack.zip', { type: 'application/zip' });
    const json = await readProjectJsonFromFile(file);
    const restored = importProjectJson(json);
    expect(restored.name).toBe('Zip Pack');
    expect(restored.namespace).toBe('zippack');
  });
});
