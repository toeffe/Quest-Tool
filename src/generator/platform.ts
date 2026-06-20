import { type Platform, type Reward } from '../types/quest';
import { type CustomItem } from '../types/item';
import { actionbar, tellraw, type TextPart } from './text';
import { namespaced } from './context';
import { buildGiveCommand } from './items';

/**
 * Per-platform handling of rewards that depend on external systems
 * (economy money, permission nodes). Generation picks the right strategy from
 * the project platform so the user never has to think about command variants.
 *
 * Money always updates an internal `money` scoreboard so it works everywhere.
 * On Paper we additionally emit a plugin economy command. Permissions are
 * plugin-only on Paper, with a clear chat fallback message elsewhere.
 *
 * Note: plugin commands (eco / lp) are run from a function (permission level 2)
 * and use the @s selector. This requires an economy/permissions plugin that
 * accepts target selectors; the bundled README documents this.
 */

export function rewardCommands(
  platform: Platform,
  reward: Reward,
  customItemsById?: Map<string, CustomItem>,
): string[] {
  const out: string[] = [];
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
      out.push(reward_message(`You earned ${amount} coins!`, 'gold'));
      break;
    }
    case 'permission': {
      const node = reward.value ?? 'quest.reward';
      if (platform === 'paper') {
        out.push(`execute as @s run lp user @s permission set ${node} true`);
        out.push(reward_message(`Permission granted: ${node}`, 'light_purple'));
      } else {
        out.push(
          reward_message(
            `You unlocked: ${node} (ask staff to enable it)`,
            'light_purple',
          ),
        );
      }
      break;
    }
    case 'command':
      if (reward.value) {
        // Replace {player} placeholder with the @s selector for the rewarded player.
        out.push(reward.value.replace(/\{player\}/g, '@s').replace(/^\//, ''));
      }
      break;
  }
  return out;
}

function reward_message(text: string, color: TextPart['color']): string {
  return tellraw('@s', [{ text, color }]);
}

/** Whether a reward type is fully supported on a platform (else a warning). */
export function isRewardSupported(platform: Platform, reward: Reward): {
  ok: boolean;
  note?: string;
} {
  if (reward.type === 'money' && platform !== 'paper') {
    return {
      ok: true,
      note: 'Money uses an internal scoreboard on Vanilla/LAN (no real economy plugin).',
    };
  }
  if (reward.type === 'permission' && platform !== 'paper') {
    return {
      ok: false,
      note: 'Permission rewards require a permissions plugin (Paper). A chat message is shown instead.',
    };
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

export function installGuide(platform: Platform, namespace: string): InstallGuide {
  const common = [
    `Spawn your NPCs: run "/function ${namespace}:setup_guide" to see the spawn commands, or run "/function ${namespace}:spawn_all" while standing where you want player-located NPCs.`,
    `Verify everything with "/function ${namespace}:debug".`,
  ];
  switch (platform) {
    case 'paper':
      return {
        title: 'Install on a PaperMC server',
        steps: [
          'Stop the server (or be ready to run /reload).',
          'Copy the datapack ZIP into <world>/datapacks/ on the server.',
          'Start the server, or run /reload in the console/in-game.',
          'Optional: install Vault + an economy plugin and LuckPerms for money/permission rewards.',
          ...common,
        ],
      };
    case 'vanilla':
      return {
        title: 'Install on a Vanilla server',
        steps: [
          'Stop the server (or be ready to run /reload).',
          'Copy the datapack ZIP into <world>/datapacks/.',
          'Start the server, or run /reload.',
          'Money is tracked with an internal scoreboard; permission rewards show a chat message only.',
          ...common,
        ],
      };
    case 'lan':
      return {
        title: 'Install for a single-player world (Open to LAN)',
        steps: [
          'Find your world save folder (Singleplayer > Edit > Open World Folder).',
          'Copy the datapack ZIP into the saves/<world>/datapacks/ folder.',
          'Load the world and run /reload (enable cheats once to reload; players do not need cheats to play quests).',
          'Use Open to LAN to play with friends.',
          ...common,
        ],
      };
  }
}
