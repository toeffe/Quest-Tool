---
name: quest-tool
description: Use when creating, editing, or generating Minecraft quests/datapacks with Quest Tool MC — i.e. building a Quest/Project object and compiling it via buildContext/compileQuest/buildDatapackFiles, or validating one via validateProject. Triggers on requests like "add a quest", "create a kill/gather/delivery/exploration/talk/daily quest", "build a quest chain", "generate the datapack", or "why didn't my quest compile/validate".
---

# Quest Tool MC — Quest Generator Skill

## Overview

**Quest Tool MC** is a browser-based TypeScript app that turns a `Project` JSON object into a Minecraft Java **1.21.11** datapack (scoreboards, mcfunctions, advancements, loot tables). There is **no in-game "Quest Tool" item** — the name refers to this generator. In-game, players interact via NPC proximity and `/trigger` chat prompts; entities/items are tagged with `questtool` / `questtool_id` for identification.

Use this skill when you need to **programmatically construct quests** (not just use the UI): build a `Project`, validate it, compile per-quest mcfunctions, and export a ZIP. Target version: datapack format **94.1** (`src/generator/packFormat.ts`).

**Pipeline:** `createProject` → edit `quests[]` → `validateProject` → `buildContext` → `compileQuest` (per quest) or `buildDatapackFiles` (full pack) → `buildDatapackZip`.

---

## Interface reference

### Core functions

```typescript
// src/types/factory.ts
export const PROJECT_SCHEMA_VERSION = 10;

createProject(name?: string, locale: AppLocale = 'da'): Project
createQuest(name?: string, type: QuestType = 'kill', locale: AppLocale = 'da'): Quest
createNpc(locale: AppLocale = 'da'): Npc
newObjectiveFor(type: QuestType, locale?: AppLocale): Objective
defaultObjectiveFor(type: QuestType, locale?: AppLocale): Objective[]  // [newObjectiveFor(...)]

// src/generator/context.ts
buildContext(project: Project): CompileContext
questObjectives(quest: Quest): Objective[]  // min 1; returns [{}] if empty

// src/generator/questFunctions.ts
compileQuest(ctx: CompileContext, qc: QuestContext): Record<string, string>
buildKillZoneAdvancementFiles(ctx, qc): Record<string, string>
buildZoneLootTableFiles(ctx, qc): Record<string, string>

// src/generator/datapack.ts
buildDatapackFiles(project: Project): FileMap
buildDatapackZip(project: Project): Promise<Blob>
buildRawCommands(project: Project): string

// src/generator/validate.ts
validateProject(project: Project, locale?: AppLocale): ValidationIssue[]
hasBlockingErrors(issues: ValidationIssue[]): boolean

// src/chain/chainGraph.ts
wouldCreateCycle(quests: Quest[], sourceId: string, targetId: string): boolean
findQuestIdsInChainCycles(quests: Quest[]): Set<string>
```

**Errors:** None of the generator functions throw on bad quest data. `compileQuest` always returns files (even for empty objectives). `validateProject` returns issues; export is blocked only when `hasBlockingErrors(issues)` is true (UI convention in `useExport.ts` — the generator itself does **not** auto-validate).

### Types

```typescript
type QuestType = 'talk' | 'kill' | 'gather' | 'delivery' | 'exploration' | 'daily'
type Platform = 'paper' | 'vanilla' | 'lan'
type SpawnMode = 'player' | 'fixed' | 'manual'
type ZoneDropMode = 'none' | 'vanilla' | 'custom'
type RewardType = 'item' | 'xp' | 'money' | 'permission' | 'command' | 'jobXp'
type AppLocale = 'en' | 'da'
```

### `Quest` (required fields)

| Field | Type | Notes |
|-------|------|-------|
| `id` | `string` | Internal UUID from `uid()` |
| `name` | `string` | **Unique** display name; also used by `chain.requires` / `chain.unlocks` |
| `type` | `QuestType` | Drives tick/turn-in logic |
| `category` | `string` | Display only |
| `description` | `string` | Display only |
| `npc` | `Npc` | Quest giver |
| `objectives` | `Objective[]` | Min 1 (validated); compiler falls back to `[{}]` if empty |
| `rewards` | `Reward[]` | Can be empty (warning) |
| `chain` | `QuestChain` | Prereqs / unlocks |
| `cooldownSeconds` | `number` | Daily only; default `86400` for `daily`, `0` otherwise |

Optional: `targetNpc?: TargetNpc` — required for talk quests that need a separate visit target.

### `Objective` — required fields by quest type

| Type | Required | Optional (common) |
|------|----------|-------------------|
| `kill` | `target` **or** `eliteMobId`, `amount` | `spawnZone`, `location`, `radius`, `zoneCap`, `zoneDropMode`, `zoneDrops` |
| `gather` | `target` **or** `customItemId`, `amount` | `consumeOnTurnIn` (default `true`), spawn zone fields, `zoneMob` |
| `delivery` | `target` **or** `customItemId`, `amount` | Always consumes on turn-in |
| `exploration` | `location` | `radius` (default 5), `markerBlock`, `dimensionId` |
| `daily` | Same as gather | `cooldownSeconds` on quest |
| `talk` | `description` only | — |

**Spawn zone fields** (kill/gather only): `spawnZone: true`, `location`, `radius`, `zoneCap` (default `min(amount, 5)`), `zoneDropMode` (`none`|`vanilla`|`custom`), `zoneDrops[]`, `zoneMob` (gather only).

**ID lookups:** `customItemId`, `eliteMobId`, `jobId` reference internal **`id`** fields, **not** `tag` slugs.

### `Reward`

| Field | When |
|-------|------|
| `type` | Always |
| `value` | Vanilla item id, permission node, or raw command |
| `customItemId` | Item reward using project custom item |
| `jobId` | `jobXp` reward |
| `amount` | Quantity (item/xp/money/jobXp) |

### `QuestChain`

| Field | Type | Default | Notes |
|-------|------|---------|-------|
| `requires` | `string?` | — | Prerequisite quest **name** (not id!) |
| `requiresJob` | `{ jobId, level }?` | — | Job level gate |
| `unlocks` | `string?` | — | Next quest **name** on completion |
| `autoStart` | `boolean` | `false` | Skip offer; start next quest immediately |
| `announce` | `boolean` | `false` | Server-wide completion broadcast |

### `Npc` / `TargetNpc`

| Field | Notes |
|-------|-------|
| `name`, `tag` | Display name + unique entity tag (sanitized to `[a-z0-9_]`) |
| `entityType` | e.g. `minecraft:villager` |
| `spawnMode` | `player` (at feet), `fixed` (needs `coordinates`), `manual` |
| `coordinates` | `{ x, y, z, dimensionId? }` |
| `dialogue` | `greeting`, `offer`, `inProgress`, `completion` (Npc only) |

### Quest state machine (scoreboard `q{index}`)

| Value | Meaning |
|-------|---------|
| `-1` | Locked (chain/job gate) |
| `0` | Available (offer shown) |
| `1` | Active (tracking progress) |
| `2` | Ready to turn in |
| `3` | Done |
| `4` | Daily cooldown (`q{index}cd` holds unlock tick) |

Per-quest identifiers (from `buildContext`): `q0` state, `q0t` trigger, `q0p0` progress, `q0k0` kills, `q0d` done count, `qk_0_0` mob tag, `qg_0` giver tag.

### `compileQuest` output (under `data/{namespace}/function/`)

| File | Purpose |
|------|---------|
| `quests/{i}_{slug}/tick.mcfunction` | Per-tick dispatcher |
| `offer.mcfunction` | Greeting + clickable Accept |
| `accept.mcfunction` | Start quest (instant-complete for talk w/o target) |
| `complete.mcfunction` | Objectives done → state 2 |
| `active.mcfunction` | In-progress dialogue |
| `ready.mcfunction` | Turn-in prompt |
| `turnin.mcfunction` | Consume items, grant rewards, chain unlock |
| `try_unlock.mcfunction` | Prereq/job gate (if locked) |
| `spawn_mob_{j}.mcfunction` | Spawn one mob in zone |
| `kill_credit_{j}.mcfunction` | Advancement kill handler (spawn zone / elite mob) |

Also emitted by `buildDatapackFiles`: `load.mcfunction`, `tick.mcfunction`, `spawn/{i}_{slug}.mcfunction`, advancements, zone loot tables, `setup_guide`, `debug`, `reset`.

---

## Usage examples

All examples mirror `src/generator/questFunctions.test.ts`.

### 1. Simplest — compile a kill quest

```typescript
import { createProject, createQuest } from '../types/factory';
import { buildContext } from '../generator/context';
import { compileQuest } from '../generator/questFunctions';

const project = createProject('P', 'en');
project.namespace = 'p';
project.quests = [createQuest('Q', 'kill')];

const ctx = buildContext(project);
const files = compileQuest(ctx, ctx.quests[0]);
// files['quests/0_q/tick.mcfunction'] contains:
//   scores={q0=1,q0k0=5..}   — kill progress
//   scores={q0=1,q0d=1..}    — done aggregate
//   scoreboard players enable @a q0t
```

### 2. Multi-objective kill

```typescript
const q = createQuest('Q', 'kill');
q.objectives = [
  { target: 'minecraft:zombie', amount: 5, description: 'Slay zombies' },
  { target: 'minecraft:skeleton', amount: 3, description: 'Slay skeletons' },
];
project.quests = [q];
const ctx = buildContext(project);
const tick = compileQuest(ctx, ctx.quests[0])['quests/0_q/tick.mcfunction'];
// Completes when: scores={q0=1,q0d=2..}
```

### 3. Gather with custom item (`questtool_id`)

```typescript
import { createCustomItem } from '../types/factory';

const item = createCustomItem('general', 'Ancient Coin');
item.baseItem = 'minecraft:gold_nugget';
item.tag = 'ancient_coin';
project.customItems = [item];

const q = createQuest('Gather', 'gather');
q.objectives = [{ customItemId: item.id, amount: 5, description: 'Find coins' }];
project.quests = [q];

const ctx = buildContext(project);
const tick = compileQuest(ctx, ctx.quests[0])['quests/0_gather/tick.mcfunction'];
// clear @s minecraft:gold_nugget[custom_data={questtool_id:"ancient_coin"}] 0
```

### 4. Delivery (always consumes on turn-in)

```typescript
const project = createProject('P', 'en');
project.namespace = 'p';
project.quests = [createQuest('Q', 'delivery')];

const ctx = buildContext(project);
const turnin = compileQuest(ctx, ctx.quests[0])['quests/0_q/turnin.mcfunction'];
// clear @s minecraft:bread 3
// run return 0  (if player lacks items)
```

### 5. Kill spawn zone with custom drops and cap

```typescript
const q = createQuest('Chickens', 'kill');
q.objectives = [{
  target: 'minecraft:chicken', amount: 10, zoneCap: 3,
  spawnZone: true, zoneDropMode: 'custom',
  zoneDrops: [
    { target: 'minecraft:feather', amount: 2 },
    { target: 'minecraft:chicken', amount: 1, chance: 50 },
  ],
  location: { x: 10, y: 64, z: 20 }, radius: 5,
}];
// tick: matches 0 run function  (NOT matches ..0)
// tick: max 3 live, matches ..2
// spawn: DeathLootTable:"p:quests/quests/0_chickens/mob_drops_0"
```

### 6. Quest chain + job gate + job XP reward

```typescript
const a = createQuest('First', 'kill');
const b = createQuest('Second', 'kill');
b.chain.requires = 'First';       // by NAME, not id
a.chain.unlocks = 'Second';

// Job gate
const job = project.jobs![0];
const gated = createQuest('Pro Fisher', 'talk');
gated.chain.requiresJob = { jobId: job.id, level: 5 };
// tick initializes: scoreboard players set @s q0 -1
// try_unlock checks: j0lvl matches 5..

// Job XP reward
const bonus = createQuest('Bonus', 'kill');
bonus.rewards = [{ type: 'jobXp', jobId: job.id, amount: 25 }];
// turnin: scoreboard players set #j0grant qt_sys 25
//         function jr:jobs/0_fishing/add_xp
```

### 7. Exploration in custom dimension

```typescript
import { createDimension } from '../types/dimension';

const dim = createDimension('Void Arena');
dim.tag = 'void_arena';
project.dimensions = [dim];

const q = createQuest('Explore', 'exploration');
q.objectives = [{
  location: { x: 0, y: 64, z: 0, dimensionId: dim.id },
  radius: 8, description: 'Find the center',
}];
// tick: execute in p:void_arena run execute positioned 0 64 0 ...
```

### 8. Full export pipeline

```typescript
import { buildDatapackZip } from '../generator/datapack';
import { validateProject, hasBlockingErrors } from '../generator/validate';

const issues = validateProject(project, 'en');
if (hasBlockingErrors(issues)) throw new Error(issues.map(i => i.message).join('\n'));

const blob = await buildDatapackZip(project);
// ZIP contains datapack + quest-tool-project.json backup
```

### 9. Talk quest — instant complete vs target NPC

```typescript
// No targetNpc → completes on Accept (no complete/turnin files)
const talk = createQuest('Talk', 'talk');
talk.targetNpc = undefined;
// accept.mcfunction contains "Grant rewards"
// complete.mcfunction is undefined

// With targetNpc → player must reach target entity tagged qtg_{index}
talk.targetNpc = { name: 'Hermit', tag: 'hermit', entityType: 'minecraft:villager', ... };
```

---

## Edge cases & constraints

| Topic | Behavior |
|-------|----------|
| **Spawn timer** | Spawns when timer `matches 0`, not `..0` — prevents spawn-every-tick bug |
| **Live mob cap** | Counts **all** tagged mobs globally, not distance-filtered (wanderers still count) |
| **zoneCap default** | `min(max(1, amount), 5)` when unset |
| **consumeOnTurnIn** | Forced for `delivery`; default `true` for `gather`/`daily`; set `false` to keep items |
| **Kill tracking** | Non-zoned kills use vanilla stat criteria; zoned/elite kills use tag-based advancements |
| **Multiline dialogue** | Must be escaped as `\n` in tellraw (one mcfunction line per command) |
| **Empty objectives** | Compiler uses `[{}]` fallback — produces broken output; validation catches with `noObjective` |
| **Chain cycles** | Detected by `validateProject`, **not** by `compileQuest` — cyclic projects compile but lock logic breaks |
| **Missing job gate ref** | If `requiresJob.jobId` not in `project.jobs`, gate is **silently skipped** (quest starts unlocked) |
| **chain.requires/unlocks** | Reference quest **`name` strings**, not `id` — fragile on rename (use `renameQuestReferences`) |
| **autoStart + requiresJob** | `autoStart` disabled when next quest has `requiresJob` (calls `try_unlock` instead) |
| **Daily cooldown** | `cooldownSeconds` on quest (default 86400); converted to ticks internally (`× 20`) |
| **Custom dimensions** | Require world restart, not just `/reload` |
| **Minecraft 1.21.11 syntax** | Attributes: `minecraft:max_health` not `generic.max_health`; equipment via `equipment:{}` not `ArmorItems` |
| **Performance** | One `tick.mcfunction` per quest; large packs scale linearly with quest count |

---

## Common mistakes

1. **Using `tag` instead of `id`** for `customItemId`, `eliteMobId`, `jobId` — lookup fails silently or validation errors.
2. **Calling `compileQuest` without `buildContext`** — missing `byName`, `jobsById`, custom item maps.
3. **Assuming the compiler validates** — always call `validateProject` before export; generator never throws.
4. **Referencing chains by quest id** — must use exact `quest.name` string.
5. **Duplicate quest or NPC tag names** — validation error; breaks scoreboard/entity resolution.
6. **Kill quest without `target` or `eliteMobId`** — validation error.
7. **Spawn zone without `location`** — validation error.
8. **Gather spawn zone without `zoneMob`** — validation error.
9. **Custom drops with empty `zoneDrops`** when `zoneDropMode: 'custom'` — validation error.
10. **Assuming `/reload` refreshes custom mob loot** — players may need to rejoin after reinstall.
11. **Putting raw newlines in NPC dialogue** — breaks mcfunction lines; use `\n` in the string.
12. **Confusing `questtool` entity tag with a player item** — it's a datapack management tag, not a quest UI tool.

---

## Quick checklist

Before calling `buildDatapackFiles` / `buildDatapackZip`:

- [ ] `project.namespace` set (sanitized lowercase identifier)
- [ ] `project.locale` set (`'en'` or `'da'`) for correct in-game strings
- [ ] Every quest has a **unique** `name` and at least one valid objective
- [ ] Every quest has an NPC with unique `tag` and valid `spawnMode` + coordinates if `fixed`
- [ ] `customItemId` / `eliteMobId` / `jobId` references use internal **`id`**, and entities exist in `project.customItems` / `customMobs` / `jobs`
- [ ] `chain.requires` / `chain.unlocks` use exact quest **names**, graph is acyclic (`findQuestIdsInChainCycles` empty)
- [ ] Spawn zones have `location`, gather zones have `zoneMob`, custom drops have entries
- [ ] Dimension refs (`dimensionId`) exist in `project.dimensions`
- [ ] `validateProject(project)` returns no `error`-level issues (`hasBlockingErrors` === false)
- [ ] For custom mob skins: also export resource pack ZIP
- [ ] After install: run `/function {namespace}:setup_guide`, spawn NPCs, test with `/function {namespace}:debug`
