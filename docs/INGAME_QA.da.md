# Manuel in-game QA-checkliste

> **Sprog:** [Dansk](INGAME_QA.da.md) · [English](INGAME_QA.md)

Quest Tool MC har ingen automatiserede Minecraft runtime tests. Brug denne matrix før releases eller efter generator-ændringer. Erstat `<ns>` med `qtqa` for **test datapack**, eller dit projekts namespace.

## Forudsætninger

- Minecraft Java Edition **1.21.11**
- Creative **superflat** testverden (overflade ved Y=-60)
- Test pack fra **Export → Download test datapack**, eller `npm run ingame:fixture`

## Opsætning af test pack

1. Kopiér ZIP'en til `<world>/datapacks/` og kør `/reload`.
2. `/function <ns>:spawn_all` — NPCs (Z=0/12/24 rækker) + job stations (X=50).
3. `/function <ns>:give_test_kit` — stænger, værktøj, emeralder, hvede osv.
4. `/function <ns>:jobs/sync_all` — opdater job advancement tabs.
5. `/function <ns>:test_guide` — fuld in-game checklist.
6. `/function <ns>:debug` — quest state + alle job Lv/XP.

## Quest state reference

| Værdi | Betydning |
|-------|-----------|
| 0 | Available |
| 1 | Active |
| 2 | Ready to turn in |
| 3 | Completed |
| 4 | Cooldown (daily) |
| -1 | Locked (chain/job gate) |

## Test pack quests (1–18)

| # | Navn | Hvad skal verificeres |
|---|------|------------------------|
| 1 | Talk Intro | Instant complete ved accept |
| 2 | Kill Zombies | Dræb 3, aflever; kræver #1 |
| 3 | Gather Wheat | 5 hvede, forbruges ved turn-in |
| 4 | Deliver Bread | 3 brød → custom coin reward |
| 5 | Explore Gold Block | Gå til gold block ved 4, -60, 8 |
| 6 | Daily Log | 1 log, 60s cooldown, XP reward |
| 7 | Zone Chickens | Zone ved 20,-60,20, ingen drops |
| 8 | Multi Kill | 2 zombies + 1 skeleton |
| 9 | Gather Keep | 3 hvede, forbruges ikke før turn-in |
| 10 | Zone Vanilla | Lime pad 28,-60,28, vanilla pig drops |
| 11 | Zone Custom | Magenta pad 36,-60,36, custom coin drops |
| 12 | Job Gate | Låst indtil Woodcutting Lv 2 |
| 13 | Job XP Reward | Giver Fishing job XP; unlocks #14 |
| 14 | Auto Start | Starter automatisk efter #13 |
| 15 | Money Reward | LAN money message + scoreboard |
| 16 | Permission Reward | Permission unlock message |
| 17 | Command Reward | Custom `say` command kører |
| 18 | Item Plus XP | Brød + XP combo |

## Test pack jobs (alle 11 — stations ved X=50)

| Job | Z | Handling | Milestone Lv 2 |
|-----|---|----------|----------------|
| Fishing | -20 | Fang fisk i pool | XP |
| Mining | -8 | Mine coal ore | Coal item |
| Woodcutting | 4 | Bryd log pillar | Custom coin |
| Farming | 16 | Bryd moden hvede | XP |
| Combat | 28 | Dræb indhegnet zombie | Command |
| Hunting | 40 | Dræb indhegnet spider | String item |
| Breeding | 52 | Avl køer med hvede | XP |
| Enchanting | 64 | Enchant ved bord | Money (LAN) |
| Trading | 76 | Handel med librarian | Book item |
| Crafting | 88 | Craft planks | Custom coin |
| PvP | 100 | Dræb en anden spiller | XP — **spring over solo** |

Efter hvert job leveler: boss bar flash, `/function <ns>:debug` viser nyt Lv, Esc → Advancements → `<ns>` opdateres.

## Reset

- `/function <ns>:reset` — din quest + job progress
- `/function <ns>:spawn_all` — genplacer NPCs og stations

## Rapportering af issues

Inkluder Minecraft version, platform, eksporteret ZIP, `/function <ns>:debug` output, og hvilket quest/job trin der fejlede.

Generator unit tests: `src/generator/*.test.ts`. Fixture tests: `src/fixtures/testDatapackProject.test.ts`.
