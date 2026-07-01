import i18n from 'i18next';
import { useTranslation } from 'react-i18next';
import type { CustomItemKind } from '../types/item';
import type { JobAction, JobMilestoneRewardType } from '../types/job';
import type { Platform, QuestType, RewardType } from '../types/quest';
import type { AppLocale } from './types';

export function useQuestTypeLabels(): Record<QuestType, string> {
  const { t } = useTranslation('quest');
  return {
    talk: t('types.talk'),
    kill: t('types.kill'),
    gather: t('types.gather'),
    delivery: t('types.delivery'),
    exploration: t('types.exploration'),
    daily: t('types.daily'),
  };
}

export function usePlatformLabels(): Record<Platform, string> {
  const { t } = useTranslation('quest');
  return {
    paper: t('platform.paper'),
    vanilla: t('platform.vanilla'),
    lan: t('platform.lan'),
  };
}

export function useRewardTypeLabels(): Record<RewardType, string> {
  const { t } = useTranslation('quest');
  return {
    item: t('rewards.item'),
    xp: t('rewards.xp'),
    money: t('rewards.money'),
    permission: t('rewards.permission'),
    command: t('rewards.command'),
    jobXp: t('rewards.jobXp'),
  };
}

export function useJobActionLabels(): Record<JobAction, string> {
  const { t } = useTranslation('jobs');
  return {
    fish: t('actions.fish'),
    combat: t('actions.combat'),
    breeding: t('actions.breeding'),
    enchanting: t('actions.enchanting'),
    trading: t('actions.trading'),
    pvp: t('actions.pvp'),
    mine: t('actions.mine'),
    woodcut: t('actions.woodcut'),
    farm: t('actions.farm'),
    hunt: t('actions.hunt'),
    craft: t('actions.craft'),
    use: t('actions.use'),
    walk: t('actions.walk'),
    sprint: t('actions.sprint'),
    custom: t('actions.custom'),
  };
}

export function useJobMilestoneRewardLabels(): Record<JobMilestoneRewardType, string> {
  const { t } = useTranslation('jobs');
  return {
    item: t('milestoneRewards.item'),
    xp: t('milestoneRewards.xp'),
    money: t('milestoneRewards.money'),
    command: t('milestoneRewards.command'),
  };
}

export function useCustomItemKindLabels(): Record<CustomItemKind, string> {
  const { t } = useTranslation('items');
  return {
    general: t('kinds.general'),
    collectible: t('kinds.collectible'),
    food: t('kinds.food'),
    tool: t('kinds.tool'),
  };
}

export function useJobStatPresetLabels(): Record<string, string> {
  const { t } = useTranslation('jobs');
  return {
    ores: t('statPresets.ores'),
    logs: t('statPresets.logs'),
    crops: t('statPresets.crops'),
    hostile_mobs: t('statPresets.hostile_mobs'),
    animals: t('statPresets.animals'),
    basic_crafts: t('statPresets.basic_crafts'),
    single: t('statPresets.single'),
  };
}

export function defaultsT(locale: AppLocale = 'da') {
  return i18n.getFixedT(locale, 'defaults');
}

export function mobLabelI18n(id: string, locale?: AppLocale): string {
  const key = id.replace(/^minecraft:/, '');
  const lng = locale ?? (i18n.language === 'en' ? 'en' : 'da');
  const translated = i18n.t(key, { ns: 'mobs', lng, defaultValue: '' });
  if (translated) return translated;
  return key
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}
