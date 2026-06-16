# Quest Tool MC

A web-based quest creator for **Minecraft Java Edition 1.21.11**. Design RPG-style
quests in a guided wizard and export a ready-to-install **datapack** — no commands,
datapacks, or coding knowledge required.

## Features

- Step wizard: NPC, Quest, Rewards, Chain, Generate
- Multiple quests per project (create, duplicate, delete)
- Quest types: talk, kill, gather, delivery, exploration, daily/repeatable, plus chains
- Villager-based quest givers with proximity dialogue and clickable accept/turn-in
- Rewards: items, XP, money, permissions, custom commands
- Targets PaperMC, Vanilla servers, and Open-to-LAN single-player
- Validation, raw-command preview, and one-click datapack ZIP download
- Auto-saves to your browser; import/export projects as JSON

## Getting started

```bash
npm install
npm run dev      # start the app at http://localhost:5173
npm run build    # typecheck + production build
npm test         # run unit tests
```

## Deploying to GitHub Pages

This is a fully static, client-side app (no server, no database — everything runs
in the browser and saves to local storage), so it hosts on GitHub Pages as-is.

1. Push this repository to GitHub.
2. In the repo, open **Settings -> Pages** and set **Source** to **GitHub Actions**
   (not "Deploy from a branch"). If branch deploy is enabled, visitors get the raw
   source `index.html` (`/src/main.tsx`) instead of the built app.
3. Push to `main` (or run the workflow manually). The included
   [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) builds the app and
   publishes the `dist/` folder.

The workflow builds with `VITE_BASE=/` so asset paths work at a custom domain root
(e.g. `https://quest.toeffe.uk/`). The custom domain is set via
[`public/CNAME`](public/CNAME), which Vite copies into every deploy. Locally,
`npm run dev`/`build` also use `/` as the base.

## How the generated datapack works

Quests are tracked with scoreboards and run automatically from a per-tick function.
NPCs are summoned villagers (`NoAI`, no trades) tagged for identification. Players
accept and turn in quests by clicking chat prompts that use `/trigger`, so no
operator cheats are needed. Progress is shown on the action bar; dialogue fires
once per approach to avoid chat spam.

After installing the pack and running `/reload`, use
`/function <namespace>:setup_guide` to spawn NPCs and `/function <namespace>:debug`
to verify everything. Full install steps for your chosen platform are bundled in
`install.txt` inside the datapack.

## Minecraft 1.21.11 notes

- `pack.mcmeta` uses the new `min_format`/`max_format` schema (datapack format 75).
- Functions use the singular `function/` and `tags/function/` folders.
- Text components use the 1.21.5+ field names (`click_event`, `hover_event`).

## Tech stack

React + TypeScript, Vite, JSZip for export, Vitest for tests.
