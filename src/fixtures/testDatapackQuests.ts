import { createQuest } from '../types/factory';
import type { CustomItem } from '../types/item';
import type { Project, Quest } from '../types/quest';
import { TEST_DATAPACK_SURFACE_Y } from './testDatapackConstants';
import { getJobByKey } from './testDatapackJobs';

const Y = TEST_DATAPACK_SURFACE_Y;
const DX = 8;

export function placeNpc(quest: Quest, x: number, z: number, name: string) {
  quest.npc.name = name;
  quest.npc.spawnMode = 'fixed';
  quest.npc.coordinates = { x, y: Y, z };
}

export function buildTestQuests(project: Project, coin: CustomItem): Quest[] {
  const woodcutting = getJobByKey(project, 'starter_woodcutting');
  const fishing = getJobByKey(project, 'starter_fishing');

  const q1 = createQuest('1. Talk Intro', 'talk');
  q1.description = 'Accept and complete instantly — no turn-in needed.';
  q1.npc.dialogue.offer = 'Click Accept in chat to finish this talk quest.';
  placeNpc(q1, 0, 0, 'Guide');

  const q2 = createQuest('2. Kill Zombies', 'kill');
  q2.description = 'Kill 3 zombies, return to turn in. Requires quest 1.';
  q2.objectives = [{ target: 'minecraft:zombie', amount: 3, description: 'Slay 3 zombies' }];
  q2.chain.requires = '1. Talk Intro';
  placeNpc(q2, DX, 0, 'Hunter');

  const q3 = createQuest('3. Gather Wheat', 'gather');
  q3.description = 'Gather 5 wheat (consumed on turn-in). Use test kit or /give.';
  q3.objectives = [
    { target: 'minecraft:wheat', amount: 5, description: 'Collect 5 wheat', consumeOnTurnIn: true },
  ];
  placeNpc(q3, DX * 2, 0, 'Farmer');

  const q4 = createQuest('4. Deliver Bread', 'delivery');
  q4.description = 'Deliver 3 bread — earn a custom coin.';
  q4.objectives = [
    {
      target: 'minecraft:bread',
      amount: 3,
      description: 'Deliver 3 bread',
      consumeOnTurnIn: true,
    },
  ];
  q4.rewards = [{ type: 'item', customItemId: coin.id, amount: 1 }];
  placeNpc(q4, DX * 3, 0, 'Baker');

  const q5 = createQuest('5. Explore Gold Block', 'exploration');
  q5.description = 'Walk to the gold block at 4, -60, 8.';
  q5.npc.dialogue.inProgress = 'Look for the gold block northeast of the NPC line.';
  q5.objectives = [
    {
      location: { x: 4, y: Y, z: 8 },
      radius: 5,
      description: 'Reach the gold block',
      markerBlock: 'minecraft:gold_block',
    },
  ];
  placeNpc(q5, 0, 12, 'Scout');

  const q6 = createQuest('6. Daily Log', 'daily');
  q6.description = 'Chop 1 oak log; 60s cooldown. Also grants Woodcutting job XP.';
  q6.cooldownSeconds = 60;
  q6.objectives = [{ target: 'minecraft:oak_log', amount: 1, description: 'Chop 1 oak log' }];
  q6.rewards = [{ type: 'xp', amount: 50 }];
  placeNpc(q6, DX, 12, 'Woodcutter');

  const q7 = createQuest('7. Zone Chickens', 'kill');
  q7.description = 'At 20, -60, 20 — zone chickens, no drops.';
  q7.objectives = [
    {
      target: 'minecraft:chicken',
      amount: 2,
      description: 'Slay 2 zone chickens',
      spawnZone: true,
      location: { x: 20, y: Y, z: 20 },
      radius: 8,
      zoneCap: 4,
      zoneDropMode: 'none',
    },
  ];
  placeNpc(q7, DX * 2, 12, 'Ranger');

  const q8 = createQuest('8. Multi Kill', 'kill');
  q8.description = 'Kill 2 zombies and 1 skeleton.';
  q8.objectives = [
    { target: 'minecraft:zombie', amount: 2, description: 'Slay zombies' },
    { target: 'minecraft:skeleton', amount: 1, description: 'Slay skeletons' },
  ];
  placeNpc(q8, DX * 4, 0, 'Slayer');

  const q9 = createQuest('9. Gather Keep', 'gather');
  q9.description = 'Gather 3 wheat — items stay in inventory until turn-in.';
  q9.objectives = [
    {
      target: 'minecraft:wheat',
      amount: 3,
      description: 'Collect 3 wheat',
      consumeOnTurnIn: false,
    },
  ];
  placeNpc(q9, DX * 5, 0, 'Collector');

  const q10 = createQuest('10. Zone Vanilla', 'kill');
  q10.description = 'Lime pad at 28, -60, 28 — zone pigs with vanilla drops.';
  q10.objectives = [
    {
      target: 'minecraft:pig',
      amount: 2,
      description: 'Slay 2 zone pigs',
      spawnZone: true,
      location: { x: 28, y: Y, z: 28 },
      radius: 8,
      zoneCap: 4,
      zoneDropMode: 'vanilla',
    },
  ];
  placeNpc(q10, DX * 3, 12, 'Trapper');

  const q11 = createQuest('11. Zone Custom', 'kill');
  q11.description = 'Magenta pad at 36, -60, 36 — custom coin drops from chickens.';
  q11.objectives = [
    {
      target: 'minecraft:chicken',
      amount: 2,
      description: 'Slay 2 zone chickens',
      spawnZone: true,
      location: { x: 36, y: Y, z: 36 },
      radius: 8,
      zoneCap: 4,
      zoneDropMode: 'custom',
      zoneDrops: [{ customItemId: coin.id, amount: 1, chance: 100 }],
    },
  ];
  placeNpc(q11, DX * 4, 12, 'Plunderer');

  const q12 = createQuest('12. Job Gate', 'talk');
  q12.description = `Locked until Woodcutting Lv 2 — chop logs at job station or quest 6.`;
  q12.chain.requiresJob = { jobId: woodcutting.id, level: 2 };
  q12.npc.dialogue.offer = 'You proved your woodcutting skill. Accept?';
  placeNpc(q12, DX * 5, 12, 'Foreman');

  const q13 = createQuest('13. Job XP Reward', 'talk');
  q13.description = 'Completing grants Fishing job XP and auto-starts quest 14.';
  q13.npc.dialogue.offer = 'Accept for Fishing job XP.';
  q13.rewards = [{ type: 'jobXp', jobId: fishing.id, amount: 50 }];
  q13.chain.unlocks = '14. Auto Start';
  placeNpc(q13, 0, 24, 'Angler');

  const q14 = createQuest('14. Auto Start', 'talk');
  q14.description = 'Auto-starts when quest 13 completes — no manual accept.';
  q14.chain.requires = '13. Job XP Reward';
  q14.chain.autoStart = true;
  q14.npc.dialogue.offer = 'This should start automatically after quest 13.';
  placeNpc(q14, DX, 24, 'Herald');

  const q15 = createQuest('15. Money Reward', 'talk');
  q15.description = 'LAN money reward (scoreboard + chat message).';
  q15.npc.dialogue.offer = 'Accept for money reward.';
  q15.rewards = [{ type: 'money', amount: 25 }];
  placeNpc(q15, DX * 2, 24, 'Banker');

  const q16 = createQuest('16. Permission Reward', 'talk');
  q16.description = 'Permission unlock message (LAN / Paper-style).';
  q16.npc.dialogue.offer = 'Accept for permission reward.';
  q16.rewards = [{ type: 'permission', value: 'questtool.test.vip' }];
  placeNpc(q16, DX * 3, 24, 'Clerk');

  const q17 = createQuest('17. Command Reward', 'talk');
  q17.description = 'Runs a custom command on turn-in.';
  q17.npc.dialogue.offer = 'Accept for command reward.';
  q17.rewards = [{ type: 'command', value: 'say [Quest Tool] Command reward fired!' }];
  placeNpc(q17, DX * 4, 24, 'Mage');

  const q18 = createQuest('18. Item Plus XP', 'talk');
  q18.description = 'Vanilla item + XP combo reward.';
  q18.npc.dialogue.offer = 'Accept for bread and XP.';
  q18.rewards = [
    { type: 'item', value: 'minecraft:bread', amount: 5 },
    { type: 'xp', amount: 100 },
  ];
  placeNpc(q18, DX * 5, 24, 'Merchant');

  return [q1, q2, q3, q4, q5, q6, q7, q8, q9, q10, q11, q12, q13, q14, q15, q16, q17, q18];
}
