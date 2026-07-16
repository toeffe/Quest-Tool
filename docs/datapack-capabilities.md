# Vanilla datapack capabilities (1.21.11)

Inventory of Minecraft Java **datapack** surfaces relevant to Quest Tool MC.
Status values:

| Status | Meaning |
|--------|---------|
| **Used** | Generated or relied on by the tool |
| **Partial** | Used in a limited form |
| **Unused** | Not emitted or consumed by the generator today |

Generator modules live under [`src/generator/`](../src/generator/). Target pack format: **94.1** ([`packFormat.ts`](../src/generator/packFormat.ts)).

For programmatic authoring of what *is* implemented, see [`quest-tool/SKILL.md`](../quest-tool/SKILL.md).

---

## A. Pack infrastructure

| Capability | Status | Module / UI | Notes |
|------------|--------|-------------|-------|
| `pack.mcmeta` (`min_format` / `max_format`) | Used | `packFormat.ts`, `datapack.ts` | Format 94.1 for 1.21.11 |
| `minecraft:load` / `minecraft:tick` function tags | Used | `datapack.ts`, `load.ts` | Root lifecycle hooks |
| Custom function tags | Unused | — | Only vanilla load/tick tags |
| Function macros (`$(var)`) | Partial | `questBook.ts` | Quest log page/give assembly |
| Item modifiers | Unused | — | — |
| Global loot modifiers | Unused | — | Forge/NeoForge concept; not vanilla |

## B. Functions (runtime)

| Capability | Status | Module / UI | Notes |
|------------|--------|-------------|-------|
| `.mcfunction` files | Used | Most of `src/generator/` | Primary runtime |
| `execute` (as/at/in/store/…) | Used | Quests, jobs, pads, dungeons, containers | — |
| `schedule` / `schedule clear` | Unused | — | Timers use scoreboards instead |
| `return` / `return run` | Unused | — | — |

## C. Scoreboards

| Capability | Status | Module / UI | Notes |
|------------|--------|-------------|-------|
| Dummy objectives | Used | Quests, jobs, dungeons, pads, containers | `qt_sys` and per-feature objectives |
| Trigger objectives | Used | `questFunctions.ts` | Accept / turn-in without op |
| Stat criteria | Used | `jobStats.ts`, kill tracking | Jobs + some kill progress |
| Fake-player holders | Used | Spawn zones, pads, containers | Timers and counts |

## D. Advancements

| Capability | Status | Module / UI | Notes |
|------------|--------|-------------|-------|
| Criteria + reward functions | Partial | `questFunctions.ts`, `jobAdvancements.ts` | Kill-zone credit; job trees |
| Advancement tabs / display | Partial | Jobs UI / Advancements view | Job skill trees only |
| Quest-as-advancement UI | Unused | — | Quests use scoreboards + chat |
| Recipe unlock advancements | Unused | — | — |

## E. Loot tables

| Capability | Status | Module / UI | Notes |
|------------|--------|-------------|-------|
| `loot_table/` (`minecraft:generic`) | Used | `lootTables.ts` | Zone drops, custom mobs, containers |
| Entity `DeathLootTable` | Used | `npc.ts`, `customMobs.ts` | Spawn zones and custom mobs |
| `/loot spawn` / `replace` / `insert` | Partial | Containers use replace; tests use spawn | Entity drops via DeathLootTable |
| Chest / block loot on place (`LootTable` NBT) | Unused | — | Containers refill via commands |
| Fishing / archaeology / block-break tables | Unused | — | — |

## F. Text and in-world UI

| Capability | Status | Module / UI | Notes |
|------------|--------|-------------|-------|
| `tellraw` + click/hover events | Used | `text.ts`, quest dialogue | 1.21.5+ field names |
| Action bar (`title actionbar`) | Used | Quest progress | — |
| Boss bars | Used | `jobBossBar.ts`, `customMobBossBar.ts` | Jobs + custom mobs |
| Dialog system (1.21+) | Unused | — | — |
| Written books as quest UI | Partial | `questBook.ts`, Settings | Optional quest log book; rebuild on request via macros |

## G. Entities and combat

| Capability | Status | Module / UI | Notes |
|------------|--------|-------------|-------|
| `summon` + NBT / attributes / equipment | Used | `npc.ts`, `customMobs.ts`, dungeons | 1.21.5+ `attributes` / `equipment` |
| Entity tags | Used | Quests, mobs, dungeons | `questtool`, mob tags, room tags |
| Entity variants + resource-pack skins | Used | `mobSkins.ts`, `resourcePack.ts` | Custom Mobs page |
| Health phases / equipment swap | Used | `customMobPhases.ts` | — |
| Custom AI goals / biome spawn rules | Unused | — | — |

## H. Blocks and world interaction

| Capability | Status | Module / UI | Notes |
|------------|--------|-------------|-------|
| `setblock` markers | Partial | `npc.ts` (exploration) | Optional marker blocks |
| World containers (place + periodic refill) | Used | `containers.ts`, Containers UI | Chests / trapped chests / barrels |
| `data merge block` (chest Lock) | Partial | `dungeons.ts` (`unlock_chest`) | Unlock only; no stock |
| Structures / jigsaw / processors | Unused | — | — |
| `fill` / `clone` | Unused | — | — |

## I. Items

| Capability | Status | Module / UI | Notes |
|------------|--------|-------------|-------|
| `give` / `clear` + 1.21 item components | Used | `items.ts`, rewards, objectives | `custom_data.questtool_id` |
| Custom items in loot | Used | `lootTables.ts` | Zones, mobs, containers |
| Recipes (crafting / smelting / …) | Unused | — | — |
| Item model overrides (beyond mob PNGs) | Unused | — | — |

## J. Dimensions and worldgen

| Capability | Status | Module / UI | Notes |
|------------|--------|-------------|-------|
| Custom `dimension/*.json` | Partial | `dimensions.ts` | Void flat; reuses overworld type |
| Teleport pads | Used | `pads.ts`, Dimensions UI | Cooldown / grace |
| Custom `dimension_type` | Unused | — | — |
| Noise / biomes / structures / features | Unused | — | — |

## K. Predicates

| Capability | Status | Module / UI | Notes |
|------------|--------|-------------|-------|
| Advancement entity conditions | Partial | Kill-zone advancements | Inline in advancements |
| Standalone `predicate/*.json` | Unused | — | — |

## L. Tags

| Capability | Status | Module / UI | Notes |
|------------|--------|-------------|-------|
| Function tags (`load` / `tick`) | Used | `datapack.ts` | — |
| Block / item / entity / biome tags | Unused | — | — |
| Damage type tags | Unused | — | — |

## M. Recipes and progression

| Capability | Status | Module / UI | Notes |
|------------|--------|-------------|-------|
| Crafting / smelting / stonecutting recipes | Unused | — | — |

## N. Resource packs (adjacent)

| Capability | Status | Module / UI | Notes |
|------------|--------|-------------|-------|
| Mob skin PNGs | Used | `resourcePack.ts` | Separate ZIP |
| Item textures / models / sounds / lang | Unused | — | — |

## O. Gamerules and time

| Capability | Status | Module / UI | Notes |
|------------|--------|-------------|-------|
| `time query gametime` | Used | `load.ts`, timers | — |
| `random value` | Used | Spawn-zone timers | — |
| `gamerule send_command_feedback` | Used | Quest triggers | — |
| Weather / day-night quest gates | Unused | — | — |

## P. Platform integrations (not vanilla folders)

| Capability | Status | Module / UI | Notes |
|------------|--------|-------------|-------|
| Paper economy (`eco`) | Used | `platform.ts` | When platform = paper |
| LuckPerms permissions | Used | `platform.ts` | When platform = paper |

---

## Folder map (what Quest Tool emits)

```
data/<namespace>/
  function/              # primary runtime
  advancement/           # kill zones + job trees
  loot_table/            # empty, quest drops, mob drops, containers
  dimension/             # custom void dims
  <entity>_variant/      # mob skins
data/minecraft/tags/function/
  load.json
  tick.json
```

Plus optional **resource pack** ZIP for mob textures.
