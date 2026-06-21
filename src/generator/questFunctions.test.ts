import { describe, it, expect } from 'vitest';
import { createProject, createQuest, createCustomItem } from '../types/factory';
import { buildContext } from './context';
import { compileQuest } from './questFunctions';

function compileFirst(type: Parameters<typeof createQuest>[1]) {
  const project = createProject('P');
  project.namespace = 'p';
  project.quests = [createQuest('Q', type)];
  const ctx = buildContext(project);
  return compileQuest(ctx, ctx.quests[0]);
}

describe('quest tick generation', () => {
  it('kill quests count the killed criterion toward the done aggregate', () => {
    const files = compileFirst('kill');
    const tick = files['quests/0_q/tick.mcfunction'];
    expect(tick).toContain('scoreboard players enable @a q0t');
    expect(tick).toContain('scores={q0=1,q0k0=5..}');
    expect(tick).toContain('scores={q0=1,q0d=1..}');
  });

  it('gather quests count items without removing them via clear ... 0', () => {
    const files = compileFirst('gather');
    const tick = files['quests/0_q/tick.mcfunction'];
    expect(tick).toContain('store result score @s q0p0 run clear @s minecraft:wheat 0');
  });

  it('multi-objective quests require every objective before completing', () => {
    const project = createProject('P');
    project.namespace = 'p';
    const q = createQuest('Q', 'kill');
    q.objectives = [
      { target: 'minecraft:zombie', amount: 5, description: 'Slay zombies' },
      { target: 'minecraft:skeleton', amount: 3, description: 'Slay skeletons' },
    ];
    project.quests = [q];
    const ctx = buildContext(project);
    const tick = compileQuest(ctx, ctx.quests[0])['quests/0_q/tick.mcfunction'];
    expect(tick).toContain('scores={q0=1,q0k0=5..}');
    expect(tick).toContain('scores={q0=1,q0k1=3..}');
    // Completes only when both objectives are counted into the done aggregate.
    expect(tick).toContain('scores={q0=1,q0d=2..}');
  });

  it('exploration quests use a positioned distance check', () => {
    const files = compileFirst('exploration');
    const tick = files['quests/0_q/tick.mcfunction'];
    expect(tick).toMatch(/execute positioned .* as @a\[scores=\{q0=1\},distance=\.\./);
  });

  it('the offer function shows a clickable accept that uses /trigger', () => {
    const files = compileFirst('kill');
    const offer = files['quests/0_q/offer.mcfunction'];
    expect(offer).toContain('"command":"trigger q0t"');
    expect(offer).toContain('scoreboard players set @s q0n 1');
  });

  it('keeps multiline offer dialogue on a single mcfunction line', () => {
    const project = createProject('P');
    project.namespace = 'p';
    const q = createQuest('Lost Son', 'kill');
    q.npc.dialogue.offer = 'Han er borte i minen.\nKan du hjelpe meg?';
    project.quests = [q];
    const ctx = buildContext(project);
    const offer = compileQuest(ctx, ctx.quests[0])['quests/0_lost_son/offer.mcfunction'];
    const offerLine = offer.split('\n')[2];
    expect(offerLine).toContain('Han er borte i minen.\\nKan du hjelpe meg?');
    expect(offerLine.startsWith('execute if score @s q0n matches 0 run tellraw @s')).toBe(true);
  });

  it('delivery quests verify and remove items on turn-in', () => {
    const files = compileFirst('delivery');
    const turnin = files['quests/0_q/turnin.mcfunction'];
    expect(turnin).toContain('run return 0');
    expect(turnin).toContain('clear @s minecraft:bread 3');
  });

  it('gather quests use component clear for custom item objectives', () => {
    const project = createProject('P');
    project.namespace = 'p';
    const item = createCustomItem('general', 'Ancient Coin');
    item.baseItem = 'minecraft:gold_nugget';
    item.tag = 'ancient_coin';
    project.customItems = [item];
    const q = createQuest('Gather', 'gather');
    q.objectives = [{ customItemId: item.id, amount: 5, description: 'Find coins' }];
    project.quests = [q];
    const ctx = buildContext(project);
    const tick = compileQuest(ctx, ctx.quests[0])['quests/0_gather/tick.mcfunction'];
    expect(tick).toContain(
      'clear @s minecraft:gold_nugget[custom_data={questtool_id:"ancient_coin"}] 0',
    );
  });

  it('gather quests remove items on turn-in when consumeOnTurnIn is set', () => {
    const project = createProject('P');
    project.namespace = 'p';
    const q = createQuest('Gather', 'gather');
    q.objectives = [
      { target: 'minecraft:wheat', amount: 10, description: 'Saml hvede', consumeOnTurnIn: true },
    ];
    project.quests = [q];
    const ctx = buildContext(project);
    const turnin = compileQuest(ctx, ctx.quests[0])['quests/0_gather/turnin.mcfunction'];
    expect(turnin).toContain('clear @s minecraft:wheat 10');
  });

  it('gather quests keep items on turn-in by default', () => {
    const files = compileFirst('gather');
    const turnin = files['quests/0_q/turnin.mcfunction'];
    expect(turnin).not.toContain('clear @s minecraft:wheat 10');
  });

  it('talk quests with no target complete instantly on accept', () => {
    const project = createProject('P');
    project.namespace = 'p';
    const talk = createQuest('Talk', 'talk');
    talk.targetNpc = undefined;
    project.quests = [talk];
    const ctx = buildContext(project);
    const files = compileQuest(ctx, ctx.quests[0]);
    expect(files['quests/0_talk/accept.mcfunction']).toContain('Grant rewards');
    expect(files['quests/0_talk/complete.mcfunction']).toBeUndefined();
  });

  it('zoned kill quests use dummy killed objective and spawn zone tick logic', () => {
    const project = createProject('P');
    project.namespace = 'p';
    const q = createQuest('Chickens', 'kill');
    q.objectives = [
      {
        target: 'minecraft:chicken',
        amount: 5,
        description: 'Slay chickens',
        spawnZone: true,
        location: { x: 10, y: 64, z: 20 },
        radius: 5,
      },
    ];
    project.quests = [q];
    const ctx = buildContext(project);
    const files = compileQuest(ctx, ctx.quests[0]);
    const tick = files['quests/0_chickens/tick.mcfunction'];
    expect(tick).toContain('tag=qk_0_0');
    expect(tick).toContain('spawn_mob_0');
    expect(tick).toContain('distance=6..');
    expect(tick).toContain('matches 0 run function');
    expect(tick).not.toContain('matches ..0 run function');
    expect(files['quests/0_chickens/spawn_mob_0.mcfunction']).toContain('summon minecraft:chicken');
    expect(files['quests/0_chickens/spawn_mob_0.mcfunction']).not.toContain('NoAI:1b');
    expect(files['quests/0_chickens/spawn_mob_0.mcfunction']).toContain('spreadplayers');
    expect(files['quests/0_chickens/spawn_mob_0.mcfunction']).toContain('matches 5.. run return 0');
    expect(files['quests/0_chickens/kill_credit_0.mcfunction']).toContain('scoreboard players add @s q0k0 1');
    const accept = files['quests/0_chickens/accept.mcfunction'];
    expect(accept).toContain('kill @e[tag=qk_0_0]');
    expect(accept).toContain('scoreboard players set #qk_0_0_t qt_sys 0');
  });

  it('zoned kill quests respect a custom live mob cap', () => {
    const project = createProject('P');
    project.namespace = 'p';
    const q = createQuest('Chickens', 'kill');
    q.objectives = [
      {
        target: 'minecraft:chicken',
        amount: 10,
        zoneCap: 3,
        description: 'Slay chickens',
        spawnZone: true,
        location: { x: 10, y: 64, z: 20 },
        radius: 5,
      },
    ];
    project.quests = [q];
    const ctx = buildContext(project);
    const files = compileQuest(ctx, ctx.quests[0]);
    const tick = files['quests/0_chickens/tick.mcfunction'];
    expect(tick).toContain('max 3 live');
    expect(tick).toContain('matches ..2');
    expect(files['quests/0_chickens/spawn_mob_0.mcfunction']).toContain('max 3 live');
    expect(files['quests/0_chickens/spawn_mob_0.mcfunction']).toContain('matches 3.. run return 0');
  });
});

describe('quest chains', () => {
  it('locks a quest that requires another and unlocks it on completion', () => {
    const project = createProject('Chain');
    project.namespace = 'c';
    const a = createQuest('First', 'kill');
    const b = createQuest('Second', 'kill');
    b.chain.requires = 'First';
    a.chain.unlocks = 'Second';
    project.quests = [a, b];
    const ctx = buildContext(project);

    const bFiles = compileQuest(ctx, ctx.quests[1]);
    // Quest B initializes to locked state (-1).
    expect(bFiles['quests/1_second/tick.mcfunction']).toContain('run scoreboard players set @s q1 -1');

    const aFiles = compileQuest(ctx, ctx.quests[0]);
    // Completing A unlocks B (sets B's state to available).
    expect(aFiles['quests/0_first/turnin.mcfunction']).toContain('scoreboard players set @s q1 0');
  });
});
