import { type JobMilestoneReward } from '../types/job';
import { type CompileContext } from './context';
import { buildGiveCommand } from './items';
import { namespaced } from './context';
import { tellraw, escapeSnbtString } from './text';
import { STR } from './strings';

/** mcfunction command lines for one milestone reward list. */
export function jobMilestoneRewardCommands(
  ctx: CompileContext,
  rewards: JobMilestoneReward[],
): string[] {
  const lines: string[] = [];
  for (const reward of rewards) {
    switch (reward.type) {
      case 'item': {
        if (reward.customItemId) {
          const item = ctx.customItemsById.get(reward.customItemId);
          if (item) {
            lines.push(buildGiveCommand(item, '@s', reward.amount ?? 1));
            break;
          }
        }
        const item = namespaced((reward.value ?? '').trim() || 'minecraft:stone');
        lines.push(`give @s ${item} ${reward.amount ?? 1}`);
        break;
      }
      case 'xp':
        lines.push(`xp add @s ${reward.amount ?? 0} points`);
        break;
      case 'money': {
        const amount = reward.amount ?? 0;
        lines.push(`scoreboard players add @s money ${amount}`);
        if (ctx.project.platform === 'paper') {
          lines.push(`execute as @s run eco give @s ${amount}`);
        }
        lines.push(tellraw('@s', [{ text: STR.coinsEarned(amount), color: 'gold' }]));
        break;
      }
      case 'command':
        if (reward.value) {
          lines.push(reward.value.replace(/\{player\}/g, '@s').replace(/^\//, ''));
        }
        break;
    }
  }
  return lines;
}

export function milestoneAnnouncement(jobName: string, level: number): string {
  return (
    `tellraw @s ["",` +
    `{"text":"${escapeSnbtString(STR.jobMilestonePrefix)}","color":"gold"},` +
    `{"text":"${escapeSnbtString(jobName)}","color":"aqua","bold":true},` +
    `{"text":"${escapeSnbtString(STR.jobMilestoneSuffix(level))}","color":"gold"}]`
  );
}
