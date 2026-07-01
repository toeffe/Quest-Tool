# In-Game Manual QA Checklist

> **Language:** English · [Dansk](INGAME_QA.da.md)

Quest Tool MC has no automated Minecraft runtime tests. Use this matrix before releases or after generator changes. Replace `<ns>` with `qtqa` for the **test datapack**, or your project namespace.

## Prerequisites

- Minecraft Java Edition **1.21.11**
- Creative **superflat** test world (surface at Y=-60)
- Test pack from **Export → Download test datapack**, or `npm run ingame:fixture`

## Test pack setup

1. Copy the ZIP into `<world>/datapacks/` and run `/reload`.
2. `/function <ns>:spawn_all` — NPCs (Z=0/12/24 rows) + job stations (X=50).
3. `/function <ns>:give_test_kit` — rods, tools, emeralds, wheat, etc.
4. `/function <ns>:jobs/sync_all` — refresh job advancement tabs.
5. `/function <ns>:test_guide` — full in-game checklist.
6. `/function <ns>:debug` — quest state + all job Lv/XP.

## Quest state reference

| Value | Meaning |
|-------|---------|
| 0 | Available |
| 1 | Active |
| 2 | Ready to turn in |
| 3 | Completed |
| 4 | Cooldown (daily) |
| -1 | Locked (chain/job gate) |

## Test pack quests (1–18)

| # | Name | What to verify |
|---|------|----------------|
| 1 | Talk Intro | Instant complete on accept |
| 2 | Kill Zombies | Kill 3, turn in; requires #1 |
| 3 | Gather Wheat | 5 wheat, consumed on turn-in |
| 4 | Deliver Bread | 3 bread → custom coin reward |
| 5 | Explore Gold Block | Walk to gold block at 4, -60, 8 |
| 6 | Daily Log | 1 log, 60s cooldown, XP reward |
| 7 | Zone Chickens | Zone at 20,-60,20, no drops |
| 8 | Multi Kill | 2 zombies + 1 skeleton |
| 9 | Gather Keep | 3 wheat, not consumed until turn-in |
| 10 | Zone Vanilla | Lime pad 28,-60,28, vanilla pig drops |
| 11 | Zone Custom | Magenta pad 36,-60,36, custom coin drops |
| 12 | Job Gate | Locked until Woodcutting Lv 2 |
| 13 | Job XP Reward | Grants Fishing job XP; unlocks #14 |
| 14 | Auto Start | Starts automatically after #13 |
| 15 | Money Reward | LAN money message + scoreboard |
| 16 | Permission Reward | Permission unlock message |
| 17 | Command Reward | Custom `say` command runs |
| 18 | Item Plus XP | Bread + XP combo |

## Test pack jobs (all 11 — stations at X=50)

| Job | Z | Action | Milestone Lv 2 |
|-----|---|--------|----------------|
| Fishing | -20 | Catch fish in pool | XP |
| Mining | -8 | Mine coal ore | Coal item |
| Woodcutting | 4 | Break log pillar | Custom coin |
| Farming | 16 | Break mature wheat | XP |
| Combat | 28 | Kill caged zombie | Command |
| Hunting | 40 | Kill caged spider | String item |
| Breeding | 52 | Breed cows with wheat | XP |
| Enchanting | 64 | Enchant at table | Money (LAN) |
| Trading | 76 | Trade with librarian | Book item |
| Crafting | 88 | Craft planks | Custom coin |
| PvP | 100 | Kill another player | XP — **skip in solo** |

After each job levels: boss bar flash, `/function <ns>:debug` shows new Lv, Esc → Advancements → `<ns>` updates.

## Reset

- `/function <ns>:reset` — your quest + job progress
- `/function <ns>:spawn_all` — re-place NPCs and stations

## Performance (large quest packs)

The datapack calls every quest's `tick` function on each game tick. Designed for **tens** of quests on a small server; **hundreds** may increase MSPT noticeably.

1. Export a project with 50+ quests (duplicate quests in the tool if needed).
2. Install the pack on a test world with `/reload`.
3. Run `/function <ns>:debug` with zero players mid-quest vs. all quests completed.
4. Use F3 debug screen (or server `/mspt` on Paper) to compare idle MSPT before and after loading the pack.
5. Completed quests should show reduced tick work (per-quest early-exit); if MSPT stays high with many incomplete quests, consider splitting into multiple smaller datapacks.

## Custom mob drops (project mobs)

If your project defines **Custom mobs** with a drop list:

1. Re-export and reinstall the datapack; **rejoin the world** (loot tables are cached at load).
2. `/loot spawn ~ ~1 ~ loot <ns>:mobs/<mob_tag>` — should drop the configured item(s).
3. `/function <ns>:spawn_mob/<mob_tag>` → kill mob → same drops.
4. `/gamerule doMobLoot` must be `true`.

Loot tables use `type: minecraft:generic` and split loot functions for custom items (see [custom-mob-drops.md](custom-mob-drops.md)).

## Reporting issues

Include Minecraft version, platform, exported ZIP, `/function <ns>:debug` output, and which quest/job step failed.

Generator unit tests: `src/generator/*.test.ts`. Fixture tests: `src/fixtures/testDatapackProject.test.ts`.
