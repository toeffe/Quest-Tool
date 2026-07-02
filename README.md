# Quest Tool MC

> **Language:** English · [Dansk](README.da.md)

A web-based quest creator for **Minecraft Java Edition 1.21.11**. Design RPG-style
quests, passive job skills, and quest chains in your browser, then export a
ready-to-install **datapack** — no commands, datapacks, or coding knowledge required.

**Live demo:** [https://quest.toeffe.uk](https://quest.toeffe.uk)

Everything runs client-side in your browser. Your project auto-saves to local
storage; nothing is sent to a server.

## Features

### Quest authoring

- **Tabbed editor** per quest: Objectives, NPC, Rewards, Chain — jump to any section without a forced sequence
- **Quest types:** talk, kill, gather, delivery, exploration, daily/repeatable
- Multiple quests per project — create, duplicate, delete; validation badges on each quest in the sidebar
- **Quest chains** with requires/unlocks, auto-start, and job-level gates
- Villager-based quest givers with proximity dialogue and clickable accept/turn-in
- Rewards: items, XP, money, permissions, custom commands, job XP
- **Kill quest spawn zones:** control whether datapack-spawned mobs drop items (none, vanilla loot, or a custom drop list)

### Visual tools

- **Story Flow:** visual quest graph — drag to connect chains, auto-layout, minimap, inline inspector
- **Custom Items:** define reusable items (general, collectible, food, tool) using Minecraft 1.21 item components; use them in rewards, gather/delivery objectives, and spawn-zone drops
- **Advancements:** preview the job skill trees exported with your datapack

### Jobs (passive skills)

- New projects ship with **11 starter jobs:** fishing, mining, woodcutting, farming, combat, hunting, breeding, enchanting, trading, crafting, and PvP
- Configure XP curves, stat presets, milestone rewards, and boss bar progress
- Grant **job XP** as a quest reward; gate quest chains on required job levels

### Export and platforms

- **Continuous validation** — issues appear in the sidebar, editor, and export view; errors block export only, not editing
- One-click **datapack ZIP** download with embedded `quest-tool-project.json` for re-import
- Targets **PaperMC**, **Vanilla** servers, and **Open-to-LAN** single-player (economy and permissions handled per platform)
- **Commands** reference view, raw command preview, and platform install guide in the export panel

### App UX

- **Danish and English UI** — switch app language in Settings; choose a separate **datapack language** for in-game strings and new-quest defaults
- Auto-save to browser localStorage
- Import from JSON or a previously downloaded datapack ZIP (**Settings** gear icon)
- Light/dark theme
- Command palette (`Ctrl/Cmd+K`); jump to Export (`Ctrl/Cmd+E`); `Esc` closes the palette

## Using the app

The app has seven views in the top bar: **Editor**, **Story flow**, **Custom items**, **Jobs**, **Advancements**, **Commands**, and **Export**.

1. Open **Settings** (gear icon) to set your project name, datapack namespace, target platform, **app language**, and **datapack language**.
2. Use the **Editor** to create and edit quests. Select a quest in the sidebar; switch tabs for Objectives, NPC, Rewards, and Chain. A validation bar at the bottom shows issues for the current quest.
3. Optionally define **Custom items** and tune **Jobs** (new projects already include 11 starter jobs).
4. Use **Story flow** to see all quests as a graph and connect chain links visually.
5. Open **Export** to review validation, read the install guide, preview generated files, and download the datapack ZIP.

Import a saved project via **Settings → Import** (accepts standalone JSON or a datapack ZIP containing `quest-tool-project.json`).

## How the generated datapack works

Quests are tracked with scoreboards and run automatically from a per-tick function.
NPCs are summoned villagers (`NoAI`, no trades) tagged for identification. Players
accept and turn in quests by clicking chat prompts that use `/trigger`, so no
operator cheats are needed. Progress is shown on the action bar; dialogue fires
once per approach to avoid chat spam.

After installing the pack and running `/reload`, use
`/function <namespace>:setup_guide` to spawn NPCs and `/function <namespace>:debug`
to verify everything. If you defined custom items, run
`/function <namespace>:give_custom_items` to receive one of each for testing.
Full install steps for your chosen platform are bundled in
`install.txt` inside the datapack.

### Jobs

When your project includes jobs, the datapack tracks player actions on each tick,
shows progress on boss bars, and grants milestone rewards at configured levels.
Players can track levels under **Esc → Advancements → your namespace tab**.
If job advancements look out of date after editing, run
`/function <namespace>:jobs/sync_all` to refresh tabs for everyone online.

### Custom items

Custom items are vanilla base items with **item components** (custom name, lore, food, tool rules, etc.). Each item gets a stable internal tag in `custom_data` so gather/delivery quests can count the right stacks. They look like their base item unless you add a separate resource pack.

### Spawn zone mob drops

Kill objectives with **spawn zones** default to **no item drops** when enabled. You can switch to vanilla mob loot or configure a custom drop list (vanilla items or project custom items, with amount and chance). The datapack attaches a `DeathLootTable` on summon and emits loot table JSON as needed.

### Custom mob drops

On the **Custom mobs** page you can attach a drop list to any mob. Export emits `data/<namespace>/loot_table/mobs/<tag>.json` and sets `DeathLootTable:"<namespace>:mobs/<tag>"` on summon (`/function <namespace>:spawn_mob/<tag>`, quest spawn zones, dungeons). Custom drops **replace** vanilla loot for that mob.

**Test after export:** `/loot spawn ~ ~1 ~ loot <namespace>:mobs/<tag>` then `/function <namespace>:spawn_mob/<tag>` and kill the mob. Rejoin the world after reinstalling the datapack (not only `/reload`). See [docs/custom-mob-drops.md](docs/custom-mob-drops.md) for loot-table format and troubleshooting.

## Minecraft 1.21.11 notes

- `pack.mcmeta` uses `min_format`/`max_format` `[94, 1]` (datapack format 94.1 for 1.21.11).
- Functions use the singular `function/` and `tags/function/` folders.
- Text components use the 1.21.5+ field names (`click_event`, `hover_event`).

## Development

**Prerequisites:** Node.js 20+

```bash
npm install
npm run dev          # dev server at http://localhost:5173
npm run build        # typecheck + production build → dist/
npm run preview      # serve dist/ locally
npm test             # run unit tests once
npm run test:watch   # vitest watch mode
```

### Architecture

```
components/ + hooks/     UI and React logic
store/                   Zustand stores (project + UI state)
state/projectStore.ts    Pure CRUD, migration, localStorage I/O
types/                   Quest, item, job domain types
generator/               Pure functions: Project → datapack files / ZIP
```

The **generator** (`src/generator/`) is pure and heavily unit-tested — prefer adding game logic there rather than in UI components. Schema migrations live in `src/state/projectStore.ts` (`PROJECT_SCHEMA_VERSION`). Validation rules are in `src/generator/validate.ts`; the UI runs them continuously via `src/hooks/useValidation.ts` (300 ms debounce).

**Tick dispatch scaling:** The datapack registers one `tick` function per quest on `minecraft:tick`. Each runs proximity and progress checks every game tick (20×/second). This is simple and correct for personal/small-server packs (tens of quests). Per-quest tick functions skip work when every online player has completed that quest; at very large quest counts (hundreds), MSPT can still rise linearly — see [docs/INGAME_QA.md](docs/INGAME_QA.md) for a manual perf checklist.

**Import safety:** Project JSON imported via Settings is sanitized (control characters stripped from user-authored strings) before it enters the editor or generator.

### Testing

| Layer | Command / doc |
|-------|----------------|
| Unit tests (generator, store, flow) | `npm test` — also runs in [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) before build |
| Lint | `npm run lint` — Biome, also in CI |
| Manual in-game QA | [docs/INGAME_QA.md](docs/INGAME_QA.md) ([dansk](docs/INGAME_QA.da.md)) — checklist using `/function <ns>:setup_guide` and `/function <ns>:debug` |
| QA datapack fixture | Export → **Download test datapack**, or `npm run ingame:fixture` |
| Future runtime automation | Design in [scripts/ingame/README.md](scripts/ingame/README.md) ([dansk](scripts/ingame/README.da.md)) |

There is no automated Minecraft runtime test in CI yet; generator unit tests plus the manual checklist are the safety net.

## Deploying to GitHub Pages

The live site at [https://quest.toeffe.uk](https://quest.toeffe.uk) is deployed from this repo.
This is a fully static, client-side app (no server, no database), so it hosts on GitHub Pages as-is.

1. Push this repository to GitHub.
2. In the repo, open **Settings → Pages** and set **Source** to **Deploy from a branch**,
   branch **`main`**, folder **`/docs`**. Do not use **GitHub Actions** as the source (that
   uses the broken `deploy-pages` API). Do not use **`/ (root)`** on `main` — that folder
   holds the Vite source `index.html`, not the built app.
3. Push to `main` (or run the workflow manually). The included
   [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) builds the app and
   commits the output to the **`docs/`** folder on **`main`** (same branch as your source code).

The workflow builds with `VITE_BASE=/` so asset paths work at a custom domain root.
The custom domain is set via [`public/CNAME`](public/CNAME), which Vite copies into every deploy. Locally,
`npm run dev`/`build` also use `/` as the base.

### Deploy troubleshooting

If the site does not update after a green workflow run:

1. Confirm **Settings → Pages → Source** is **Branch: `main` / `/docs`**, not GitHub Actions or `/ (root)`.
2. After a successful run, check **`docs/index.html`** exists on `main` — without it GitHub Pages returns 404 even when the workflow is green. The `pages build and deployment` action only publishes what is already in `docs/`.
3. Re-run the workflow from **Actions** if a push was cancelled by a newer commit (`cancel-in-progress`).

The workflow commits built files into `docs/` on `main` with `[skip ci]` so deploy commits do not re-trigger the workflow. The `peaceiris/actions-gh-pages` action cannot publish to the same branch that triggered the run (`main` → `main`), so deploy uses `rsync` + `git push` instead.

## Tech stack

React 18, TypeScript, Vite 6, Zustand, `@xyflow/react`, JSZip, Vitest 3, Biome.
