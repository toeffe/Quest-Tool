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

## Reporting issues

Include Minecraft version, platform, exported ZIP, `/function <ns>:debug` output, and which quest/job step failed.

Generator unit tests: `src/generator/*.test.ts`. Fixture tests: `src/fixtures/testDatapackProject.test.ts`.
