import { type Platform, type Reward } from '../types/quest';
import { type CompileContext } from './context';
import { SYS_OBJECTIVE } from './sys';
import { actionbar, tellraw, type TextPart } from './text';
import { namespaced } from './context';
import { buildGiveCommand } from './items';
import i18n from '../i18n';
import { type AppLocale } from '../i18n/types';
import { getAppLocale } from '../i18n';

/**
 * Per-platform handling of rewards that depend on external systems
 * (economy money, permission nodes). Generation picks the right strategy from
 * the project platform so the user never has to think about command variants.
 */

export function rewardCommands(ctx: CompileContext, reward: Reward): string[] {
  const out: string[] = [];
  const platform = ctx.project.platform;
  const customItemsById = ctx.customItemsById;
  const STR = ctx.str;
  switch (reward.type) {
    case 'item': {
      if (reward.customItemId && customItemsById) {
        const item = customItemsById.get(reward.customItemId);
        if (item) {
          out.push(buildGiveCommand(item, '@s', reward.amount ?? 1));
          break;
        }
      }
      const item = namespaced((reward.value ?? '').trim() || 'minecraft:stone');
      out.push(`give @s ${item} ${reward.amount ?? 1}`);
      break;
    }
    case 'xp':
      out.push(`xp add @s ${reward.amount ?? 0} points`);
      break;
    case 'money': {
      const amount = reward.amount ?? 0;
      out.push(`scoreboard players add @s money ${amount}`);
      if (platform === 'paper') {
        out.push(`execute as @s run eco give @s ${amount}`);
      }
      out.push(reward_message(STR.coinsEarned(amount), 'gold'));
      break;
    }
    case 'permission': {
      const node = reward.value ?? 'quest.reward';
      if (platform === 'paper') {
        out.push(`execute as @s run lp user @s permission set ${node} true`);
        out.push(reward_message(STR.permissionGranted(node), 'light_purple'));
      } else {
        out.push(reward_message(STR.permissionUnlocked(node), 'light_purple'));
      }
      break;
    }
    case 'command':
      if (reward.value) {
        out.push(reward.value.replace(/\{player\}/g, '@s').replace(/^\//, ''));
      }
      break;
    case 'jobXp': {
      const amount = reward.amount ?? 0;
      const jc = reward.jobId ? ctx.jobsById.get(reward.jobId) : undefined;
      if (jc && amount > 0) {
        out.push(`scoreboard players set ${jc.grantHolder} ${SYS_OBJECTIVE} ${amount}`);
        out.push(`function ${ctx.namespace}:${jc.fnBase}/add_xp`);
      }
      break;
    }
  }
  return out;
}

function reward_message(text: string, color: TextPart['color']): string {
  return tellraw('@s', [{ text, color }]);
}

/** Whether a reward type is fully supported on a platform (else a warning). */
export function isRewardSupported(
  platform: Platform,
  reward: Reward,
  locale?: AppLocale,
): {
  ok: boolean;
  note?: string;
} {
  const lng = locale ?? getAppLocale();
  const t = (key: string) => i18n.t(key, { ns: 'validation', lng });
  if (reward.type === 'money' && platform !== 'paper') {
    return { ok: true, note: t('moneyVanillaNote') };
  }
  if (reward.type === 'permission' && platform !== 'paper') {
    return { ok: false, note: t('permissionNote') };
  }
  return { ok: true };
}

/** A short action-bar progress ping reused across quest types. */
export function progressPing(text: string): string {
  return actionbar('@s', [{ text, color: 'yellow' }]);
}

export interface InstallGuide {
  title: string;
  steps: string[];
}

export function installGuide(
  platform: Platform,
  namespace: string,
  locale: AppLocale = 'da',
): InstallGuide {
  const t = i18n.getFixedT(locale, 'platform');
  const common = [
    t('installGuide.common.spawnNpcs', { namespace }),
    t('installGuide.common.verify', { namespace }),
  ];
  switch (platform) {
    case 'paper':
      return {
        title: t('installGuide.paper.title'),
        steps: [
          t('installGuide.paper.step1'),
          t('installGuide.paper.step2'),
          t('installGuide.paper.step3'),
          t('installGuide.paper.step4'),
          ...common,
        ],
      };
    case 'vanilla':
      return {
        title: t('installGuide.vanilla.title'),
        steps: [
          t('installGuide.vanilla.step1'),
          t('installGuide.vanilla.step2'),
          t('installGuide.vanilla.step3'),
          t('installGuide.vanilla.step4'),
          ...common,
        ],
      };
    case 'lan':
      return {
        title: t('installGuide.lan.title'),
        steps: [
          t('installGuide.lan.step1'),
          t('installGuide.lan.step2'),
          t('installGuide.lan.step3'),
          t('installGuide.lan.step4'),
          ...common,
        ],
      };
  }
}
