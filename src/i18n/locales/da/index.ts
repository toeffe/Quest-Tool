import { commonDa } from './common';
import { editorDa } from './editor';
import { flowDa } from './flow';
import { exportDa } from './export';
import { helpDa } from './help';
import { jobsDa } from './jobs';
import { itemsDa } from './items';
import { questDa } from './quest';
import { datapackDa } from './datapack';
import { platformDa } from './platform';
import { commandsDa } from './commands';
import { defaultsDa } from './defaults';
import { advancementsDa } from './advancements';
import { validationDa } from './validation';
import { mobsDa } from '../mobs.generated';

export const daResources = {
  common: commonDa,
  editor: editorDa,
  flow: flowDa,
  export: exportDa,
  help: helpDa,
  jobs: jobsDa,
  items: itemsDa,
  quest: questDa,
  datapack: datapackDa,
  platform: platformDa,
  commands: commandsDa,
  defaults: defaultsDa,
  advancements: advancementsDa,
  validation: validationDa,
  mobs: mobsDa,
} as const;
