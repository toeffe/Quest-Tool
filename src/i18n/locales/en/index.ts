import { commonEn } from './common';
import { editorEn } from './editor';
import { flowEn } from './flow';
import { exportEn } from './export';
import { helpEn } from './help';
import { jobsEn } from './jobs';
import { itemsEn } from './items';
import { questEn } from './quest';
import { datapackEn } from './datapack';
import { platformEn } from './platform';
import { commandsEn } from './commands';
import { defaultsEn } from './defaults';
import { advancementsEn } from './advancements';
import { validationEn } from './validation';
import { mobsEn } from '../mobs.generated';

export const enResources = {
  common: commonEn,
  editor: editorEn,
  flow: flowEn,
  export: exportEn,
  help: helpEn,
  jobs: jobsEn,
  items: itemsEn,
  quest: questEn,
  datapack: datapackEn,
  platform: platformEn,
  commands: commandsEn,
  defaults: defaultsEn,
  advancements: advancementsEn,
  validation: validationEn,
  mobs: mobsEn,
} as const;
