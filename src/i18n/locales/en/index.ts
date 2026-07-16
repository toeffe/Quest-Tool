import { mobsEn } from '../mobs.generated';
import { advancementsEn } from './advancements';
import { commandsEn } from './commands';
import { commonEn } from './common';
import { containersEn } from './containers';
import { customMobsEn } from './customMobs';
import { datapackEn } from './datapack';
import { defaultsEn } from './defaults';
import { dimensionsEn } from './dimensions';
import { dungeonsEn } from './dungeons';
import { editorEn } from './editor';
import { exportEn } from './export';
import { flowEn } from './flow';
import { helpEn } from './help';
import { itemsEn } from './items';
import { jobsEn } from './jobs';
import { platformEn } from './platform';
import { questEn } from './quest';
import { validationEn } from './validation';

export const enResources = {
  common: commonEn,
  editor: editorEn,
  flow: flowEn,
  export: exportEn,
  help: helpEn,
  jobs: jobsEn,
  items: itemsEn,
  customMobs: customMobsEn,
  dungeons: dungeonsEn,
  dimensions: dimensionsEn,
  containers: containersEn,
  quest: questEn,
  datapack: datapackEn,
  platform: platformEn,
  commands: commandsEn,
  defaults: defaultsEn,
  advancements: advancementsEn,
  validation: validationEn,
  mobs: mobsEn,
} as const;
