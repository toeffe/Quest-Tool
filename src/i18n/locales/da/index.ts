import { mobsDa } from '../mobs.generated';
import { advancementsDa } from './advancements';
import { commandsDa } from './commands';
import { commonDa } from './common';
import { containersDa } from './containers';
import { customMobsDa } from './customMobs';
import { datapackDa } from './datapack';
import { defaultsDa } from './defaults';
import { dimensionsDa } from './dimensions';
import { dungeonsDa } from './dungeons';
import { editorDa } from './editor';
import { exportDa } from './export';
import { flowDa } from './flow';
import { helpDa } from './help';
import { itemsDa } from './items';
import { jobsDa } from './jobs';
import { platformDa } from './platform';
import { questDa } from './quest';
import { validationDa } from './validation';

export const daResources = {
  common: commonDa,
  editor: editorDa,
  flow: flowDa,
  export: exportDa,
  help: helpDa,
  jobs: jobsDa,
  items: itemsDa,
  customMobs: customMobsDa,
  dungeons: dungeonsDa,
  dimensions: dimensionsDa,
  containers: containersDa,
  quest: questDa,
  datapack: datapackDa,
  platform: platformDa,
  commands: commandsDa,
  defaults: defaultsDa,
  advancements: advancementsDa,
  validation: validationDa,
  mobs: mobsDa,
} as const;
