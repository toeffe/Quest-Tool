# Quest Tool MC — API & schema reference

Companion to [SKILL.md](SKILL.md). Read this when building full `Project` objects (jobs, mobs, dungeons, pads) or debugging generated paths/scores.

## External AIs (no `src/`)

Default deliverable is **Project JSON** (schema **v10**), not a datapack ZIP.

1. Start from [project.example.json](project.example.json).
2. Follow Mode A rules in [SKILL.md](SKILL.md).
3. User imports on [https://quest.toeffe.uk](https://quest.toeffe.uk) (sidebar **Import project** or Settings) → Export.

`importProjectJson` accepts standalone `.json` or a datapack ZIP containing `quest-tool-project.json`. Empty `"jobs": []` is fine — migration fills starter jobs on import.

**Do not** claim `buildDatapackZip` ran unless you have the local TypeScript generator.

When packaging this skill for Claude/ChatGPT uploads, include at least `SKILL.md`, `reference.md`, and `project.example.json` (re-pack `quest-tool.skill` from the `quest-tool/` folder).

---

## `Project` (`src/types/quest.ts`)

| Field | Type | Notes |
|-------|------|-------|
| `id` | `string` | From `uid()` |
| `name` | `string` | Display / ZIP basename |
| `namespace` | `string` | Datapack namespace; sanitized in `buildContext` |
| `platform` | `'paper' \| 'vanilla' \| 'lan'` | Default `'paper'` from `createProject` |
| `locale?` | `'en' \| 'da'` | Generated strings + factory defaults; validate locale is separate |
| `quests` | `Quest[]` | Must be non-empty to validate |
| `jobs?` | `Job[]` | `createProject` seeds 11 starters |
| `customItems?` | `CustomItem[]` | |
| `customMobs?` | `CustomMob[]` | |
| `dungeons?` | `Dungeon[]` | |
| `dimensions?` | `Dimension[]` | Void flat dimensions |
| `teleportPads?` | `TeleportPad[]` | One-way; pair for round trips |
| `flowPositions?` | `Record<string, {x,y}>` | UI Story Flow only |
| `version` | `number` | `PROJECT_SCHEMA_VERSION` (= **10**) |

---

## `Quest` / `Npc` / `Objective` / `Reward` / `QuestChain`

### Quest

| Field | Type | Notes |
|-------|------|-------|
| `id` | `string` | Internal UUID |
| `name` | `string` | Unique; chain keys |
| `type` | `QuestType` | |
| `category` | `string` | Display |
| `description` | `string` | Display |
| `npc` | `Npc` | Giver |
| `targetNpc?` | `TargetNpc` | Talk visit target |
| `objectives` | `Objective[]` | Min 1 |
| `rewards` | `Reward[]` | Default factory: `[{ type:'xp', amount:50 }]` |
| `chain` | `QuestChain` | Defaults `autoStart:false`, `announce:false` |
| `cooldownSeconds` | `number` | Daily default `86400`, else `0` |

### Npc

| Field | Notes |
|-------|-------|
| `name`, `tag` | Display + unique entity tag (`[a-z0-9_]`) |
| `entityType` | e.g. `minecraft:villager` |
| `profession`, `variant` | Villager appearance |
| `baby?` | Permanent baby age |
| `variants?` | Non-villager NBT variant map |
| `dialogue` | `greeting`, `offer`, `inProgress`, `completion` |
| `spawnMode` | `player` \| `fixed` \| `manual` |
| `coordinates?` | Required when `fixed`; optional `dimensionId` |

### TargetNpc

Same spawn/appearance idea as Npc, but `dialogue` is a **single string** (not `NpcDialogue`). Tags become `qtg_{questIndex}` + `npc_{sanitizedTag}`.

### Objective

| Field | Used by | Notes |
|-------|---------|-------|
| `target` | kill/gather/delivery/daily | Mob or vanilla item id |
| `customItemId` | gather/delivery/daily | Project item **id** |
| `eliteMobId` | kill | Project mob **id** |
| `amount` | kill/item types | ≥1 |
| `description` | all | Player-facing |
| `location` | exploration / spawn zones | Optional `dimensionId` |
| `radius` | exploration / zones | Exploration default 5 |
| `spawnZone` | kill/gather | Needs `location` |
| `zoneMob` | gather zones | Entity type to spawn |
| `zoneCap` | zones | Default `min(max(1,amount),5)` |
| `consumeOnTurnIn` | gather/daily | Delivery always true in compiler |
| `zoneDropMode` | zones | `none` \| `vanilla` \| `custom` |
| `zoneDrops` | custom drops | `target` or `customItemId`; `amount`; `chance` 1–100 |
| `markerBlock` | exploration | Placed when NPCs spawn |

### ZoneDrop

| Field | Notes |
|-------|-------|
| `target?` | Vanilla item id |
| `customItemId?` | Project item id |
| `amount?` | Default 1 |
| `chance?` | 1–100, default 100 |

### Reward

| Field | When |
|-------|------|
| `type` | Always |
| `value` | Vanilla item / permission node / raw command |
| `customItemId` | Custom item reward |
| `jobId` | `jobXp` |
| `amount` | item / xp / money / jobXp |

### QuestChain

| Field | Notes |
|-------|-------|
| `requires?` | Prerequisite quest **name** |
| `requiresJob?` | `{ jobId, level }` — job **id** |
| `unlocks?` | Next quest **name** |
| `autoStart` | Skipped if next has `requiresJob` |
| `announce` | Server-wide completion tellraw |

---

## Jobs (`src/types/job.ts`)

| Field | Notes |
|-------|-------|
| `id` | Lookup key for gates/rewards |
| `starterKey?` | Migration slug (`starter_fishing`, …) |
| `name` | Display; also path slug |
| `action` | `JobAction` |
| `xpPerAction`, `xpPerLevel`, `maxLevel` | Flat curve: XP to level L = `xpPerLevel * L` |
| `showActionBar` | Action-bar XP ping |
| `showProgressBar?` | Boss bar (default on) |
| `statPreset?` | For typed actions; `'single'` + `statTarget` for one id |
| `statTarget?` | When preset is `single` |
| `customCriterion?` | Full criterion when `action === 'custom'` |
| `distanceUnit?` | cm per XP for walk/sprint (default 1000) |
| `milestones?` | `{ level, rewards[] }` — reward types: item/xp/money/command only |
| `advancementIcon?` / `advancementDescription?` / `advancementBackground?` / `levelTitle?` | Advancement tree UI |

**Starter jobs** (`createStarterJobs`): fishing, mining, woodcutting, farming, combat, hunting, breeding, enchanting, trading, crafting, pvp.

**Compiled under** `data/{ns}/function/jobs/{i}_{slug}/`: `init`, `tick`, `credit`, `check_level`, `add_xp`, `sync_advancements`, optional `sum_stat`, progress-bar helpers. Also `jobs/tick.mcfunction`, `jobs/sync_all.mcfunction`, job advancements.

**Scores:** `j{i}stat`, `j{i}s{n}` (multi), `j{i}xp`, `j{i}lvl`, `j{i}last`, `j{i}init`, `#j{i}grant`, `#j{i}sum`.

---

## Custom items (`src/types/item.ts`)

| Field | Notes |
|-------|-------|
| `id` | Lookup key |
| `tag` | Stored in `custom_data.questtool_id` |
| `kind` | `general` \| `collectible` \| `food` \| `tool` |
| `baseItem` | Vanilla item id |
| `displayName`, `lore` | Components |
| `glint?`, `rarity?`, `maxStackSize?`, `unbreakable?` | |
| `food?`, `consumable?`, `tool?`, `enchantments?` | Kind-specific |

Helpers: `buildGiveCommand`, `buildGiveCustomItemsFunction` → `{ns}:give_custom_items`.

---

## Custom mobs (`src/types/customMob.ts`)

| Field | Notes |
|-------|-------|
| `id` | Lookup key (`eliteMobId`) |
| `tag` | Entity tag (+ registry `questtool_mob`) |
| `baseEntity` | Vanilla entity from mob catalog |
| `displayName` | CustomName |
| `health?`, `damage?` | Via `minecraft:max_health` / `attack_damage` |
| `glowing?`, `bossBar?` | |
| `phases?` | First phase = start; later need `atHealthPercent` |
| `variants?`, `scale?`, `skinTexture?` | Skin → resource pack + variant files |
| `equipment?` | `{ slot, item }` — slots: head/chest/legs/feet/mainhand/offhand |
| `drops?` | `ZoneDrop[]` → custom loot table |

**Phase fields:** `atHealthPercent?`, `displayName?`, `health?`, `damage?`, `glowing?`, `bossBarColor?`, `variants?`, `scale?`, `skinTexture?`, `equipment?`, `effects?`, `announceMessage?`.

Helpers: `summonCustomMob`, `buildGiveCustomMobsFunction`, `buildSpawnMobFunctions`, boss-bar + phase support files in datapack.

Attribute constants: `MC_ATTR_MAX_HEALTH`, `MC_ATTR_ATTACK_DAMAGE`, `MC_ATTR_SCALE` in `customMobs.ts`.

---

## Dimensions & pads (`src/types/dimension.ts`)

### Dimension

| Field | Notes |
|-------|-------|
| `id` | Ref from coords / pads / dungeons |
| `name`, `tag` | `tag` → `data/{ns}/dimension/{tag}.json` |
| `description?` | Editor |

All custom dims are void-flat (`compileDimensions`). Resource id: `{namespace}:{tag}`.

### TeleportPad

| Field | Notes |
|-------|-------|
| `at` | `PortalEndpoint`: x,y,z,radius + optional `dimensionId` |
| `to` | `TeleportDestination`: x,y,z + optional `dimensionId` |
| `cooldownSeconds?` | Default 1 from factory |

Compiled to `pads/*`; tick hook two-phase detect/execute. Scores: `pad{i}_cd`, pad grace/request objectives.

---

## Dungeons (`src/types/dungeon.ts`)

### Dungeon

| Field | Notes |
|-------|-------|
| `tag` | Function path slug |
| `dimensionId?` | All room bounds in that dim |
| `rooms` | ≥1 typical |

### DungeonRoom

| Field | Notes |
|-------|-------|
| `type` | `boss_room` \| `patrol_corridor` \| `treasure_vault` \| `entrance` \| `puzzle_room` \| `safe_room` \| `custom` |
| `bounds` | Axis-aligned box (normalized min/max) |
| `spawns` | See below |
| `triggers` | Event → action |
| `questGate?` | `{ questName, requiredState }` where state is `-1\|0\|1\|2\|3` |
| `respawnCooldown?` | Seconds |

### RoomSpawn

| Field | Notes |
|-------|-------|
| `sourceType` | `'customMob' \| 'vanilla'` |
| `customMobId?` / `vanillaEntity?` | |
| `count` | |
| `spawnOnEntry`, `respawn` | booleans |

### Triggers

**Events:** `on_entry` \| `on_all_mobs_killed` \| `on_quest_complete` \| `on_exit`

**Actions:**

| `type` | Payload |
|--------|---------|
| `set_quest_state` | `questName`, `state` |
| `dialogue` | `message`, `targets: 'all'\|'room'` |
| `unlock_chest` | `x,y,z` |
| `custom_command` | `command` |

**Paths:** `dungeons/{tag}/init|reset`, `dungeons/{tag}/rooms/{room}/tick|spawn|despawn|on_entry|on_exit|on_all_killed`, optional fire-once trigger files. Root `dungeons/tick.mcfunction`.

---

## CompileContext identifiers (`src/generator/context.ts`)

### Quest (`index` = slot)

| ID | Meaning |
|----|---------|
| `q{i}` | State |
| `q{i}t` | Trigger |
| `q{i}d` | Objectives done count |
| `q{i}n` | Near-giver latch |
| `q{i}cd` | Daily cooldown unlock tick |
| `q{i}p{j}` | Item progress |
| `q{i}k{j}` | Kill criterion / credit |
| `q{i}r{j}` | Exploration reached |
| `qk_{i}_{j}` | Spawned mob tag |
| `#qk_{i}_{j}_t` | Spawn timer (qt_sys) |
| `#qk_{i}_{j}_live` | Live count (qt_sys) |
| `qg_{i}` | Giver bind tag |
| `qtg_{i}` | Target NPC bind tag |
| `npc_{sanitized}` | Display tags |

`fnBase`: `quests/{i}_{slug}` (max 60 chars). `spawnFn`: `spawn/{i}_{slug}`.

### Job

| ID | Meaning |
|----|---------|
| `j{i}stat` / `j{i}s{n}` | Action counters |
| `j{i}xp`, `j{i}lvl` | XP / level |
| `j{i}last`, `j{i}init` | Delta / first sync |
| `#j{i}grant` | Quest→job XP grant |
| `#j{i}sum` | Multi-stat sum |

`fnBase`: `jobs/{i}_{slug}`.

---

## `compileQuest` files

Under `data/{namespace}/function/`:

| File | When |
|------|------|
| `quests/{i}_{slug}/tick.mcfunction` | Always |
| `offer.mcfunction` | Always |
| `accept.mcfunction` | Always |
| `try_unlock.mcfunction` | Locked (chain/job) |
| `complete.mcfunction` | Not instant-talk |
| `active.mcfunction` | Not instant-talk |
| `ready.mcfunction` | Not instant-talk |
| `turnin.mcfunction` | Not instant-talk |
| `spawn_mob_{j}.mcfunction` | Spawn zone |
| `kill_credit_{j}.mcfunction` | Kill + (zone or elite) |

Instant talk (no `targetNpc`): accept grants rewards; no complete/active/ready/turnin.

---

## `buildDatapackFiles` outputs

Always / common:

- `pack.mcmeta` (min_format/max_format **[94,1]**)
- `data/minecraft/tags/function/{load,tick}.json`
- `{ns}/function/load|tick|setup_guide|debug|reset|reset_all|spawn_all`
- Per-quest: compileQuest + `spawn/{i}_{slug}` + kill-zone advancements + zone loot tables
- `install.txt`
- ZIP also embeds `quest-tool-project.json` (`PROJECT_BACKUP_FILENAME`)

When present:

| Feature | Paths |
|---------|-------|
| Jobs | `jobs/tick`, `jobs/sync_all`, per-job folder, advancements, boss-bar support |
| Custom items | `give_custom_items` |
| Custom mobs | loot tables, `give_custom_mobs`, `spawn_mob` helpers, boss-bar + phase files, mob variants |
| Empty loot | Empty entity loot table if zones need it |
| Dimensions | `data/{ns}/dimension/{tag}.json` |
| Pads | `pads/*` |
| Dungeons | `dungeons/*` |

Resource pack (separate ZIP): format **75**; emitted when skins exist (`buildResourcePackFiles` / `projectHasSkinTextures`).

---

## Validation coverage (`validateProject`)

Errors (block export via `hasBlockingErrors`) include:

- No quests; empty/duplicate quest names; duplicate NPC tags
- Objective rules (target/amount/location/zone/drops)
- Missing custom item/mob refs on objectives, drops, rewards
- Fixed NPC/target without coordinates; bad dimension refs (NPC, objectives, pads, dungeons)
- Chain requires/unlocks missing or self-require; chain cycles
- Reward missing item/command; missing custom item on reward
- Custom item/mob tag uniqueness and completeness
- Job configuration issues (`jobIssues`)
- Dungeon room/spawn/trigger/gate issues
- Pad empty name; pad dimension refs missing

Warnings (non-blocking): no rewards; money on non-paper; permission on non-paper (`ok:false` still stored as **warning**); pad cooldown < 1s; pad destination overlapping another pad’s `at` box.

---

## Minecraft 1.21.11 generator conventions

- Pack format: `min_format`/`max_format` `[94,1]` — not legacy `pack_format` alone
- Loot tables: singular `loot_table/` folder
- Attributes: `minecraft:max_health`, `minecraft:attack_damage`, `minecraft:scale` — never `generic.*`
- Summon attrs: `attributes:[{id:"max_health",base:…}]` + matching `Health:` float
- Equipment: `equipment:{feet:{id:…,count:1}}` — not `ArmorItems`/`HandItems`
- Text: `src/generator/text.ts` — `click_event` / `hover_event`; no `@s` as tellraw score `name`
- Scoreboard entity reads: `execute as @e[…] store result score #tmp qt_sys run scoreboard players get @s …`
