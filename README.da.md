# Quest Tool MC

> **Sprog:** [Dansk](README.da.md) · [English](README.md)

En webbaseret quest-skaber til **Minecraft Java Edition 1.21.11**. Design RPG-agtige
quests, passive job-færdigheder og quest-kæder i browseren, og eksporter derefter en
klar-til-installation **datapack** — uden behov for kommandoer, datapacks eller kodning.

**Live demo:** [https://quest.toeffe.uk](https://quest.toeffe.uk)

Alt kører client-side i browseren. Dit projekt gemmes automatisk i local
storage; intet sendes til en server.

## Funktioner

### Quest-forfattelse

- **Faneret editor** per quest: Objectives, NPC, Rewards, Chain — hop til enhver sektion uden tvungen rækkefølge
- **Quest-typer:** talk, kill, gather, delivery, exploration, daily/repeatable
- Flere quests per projekt — opret, dupliker, slet; valideringsbadges på hver quest i sidebaren
- **Quest-kæder** med requires/unlocks, auto-start og job-level gates
- Villager-baserede quest givers med nærhedsdialog og klikbare accept/turn-in
- Belønninger: items, XP, money, permissions, custom commands, job XP
- **Kill quest spawn zones:** styr om datapack-spawnede mobs dropper items (none, vanilla loot eller en custom drop list)

### Visuelle værktøjer

- **Story Flow:** visuel quest-graf — træk for at forbinde kæder, auto-layout, minimap, inline inspector
- **Custom Items:** definer genbrugelige items (general, collectible, food, tool) med Minecraft 1.21 item components; brug dem i rewards, gather/delivery objectives og spawn-zone drops
- **Verdenscontainere:** placér kister/tønder ved faste koordinater der periodisk genopfyldes (inkl. brugerdefinerede quest-genstande)
- **Advancements:** forhåndsvis de job skill trees der eksporteres med datapacken

### Jobs (passive skills)

- Nye projekter leveres med **11 starter jobs:** fishing, mining, woodcutting, farming, combat, hunting, breeding, enchanting, trading, crafting og PvP
- Konfigurer XP curves, stat presets, milestone rewards og boss bar progress
- Giv **job XP** som quest-belønning; gate quest-kæder på required job levels

### Eksport og platforme

- **Løbende validering** — fejl og advarsler vises i sidebaren, editoren og eksportvisningen; fejl blokerer kun eksport, ikke redigering
- Ett-klik **datapack ZIP**-download med indlejret `quest-tool-project.json` til genimport
- Understøtter **PaperMC**, **Vanilla**-servere og **Open-to-LAN** single-player (economy og permissions håndteres per platform)
- **Commands**-reference, rå kommando-preview og platform-installationsguide i eksportpanelet

### App UX

- **Dansk og engelsk UI** — skift appsprog under Indstillinger; vælg et separat **datapack-sprog** til tekster i spillet og standardværdier for nye quests
- Autogem til browserens localStorage
- Import fra JSON eller en tidligere downloadet datapack-ZIP (**Indstillinger**, tandhjulsikonet)
- Lyst/mørkt tema
- Kommandopalette (`Ctrl/Cmd+K`); hop til Eksport (`Ctrl/Cmd+E`); `Esc` lukker paletten

## Brug af appen

Appen har syv views i topbaren: **Editor**, **Story flow**, **Custom items**, **Jobs**, **Advancements**, **Commands** og **Export**.

1. Åbn **Indstillinger** (tandhjulsikon) for at sætte projektnavn, datapack-namespace, målplatform, **appsprog** og **datapack-sprog**.
2. Brug **Editor** til at oprette og redigere quests. Vælg en quest i sidebaren; skift faner for Objectives, NPC, Rewards og Chain. En valideringslinje nederst viser problemer for den aktuelle quest.
3. Definer eventuelt **Custom items** og finjuster **Jobs** (nye projekter inkluderer allerede 11 starter jobs).
4. Brug **Story flow** til at se alle quests som en graf og forbinde chain links visuelt.
5. Åbn **Export** for at gennemgå validering, læse installationsguiden, forhåndsvise genererede filer og downloade datapack-ZIP'en.

Importér et gemt projekt via **Indstillinger → Import** (accepterer fritstående JSON eller en datapack-ZIP med `quest-tool-project.json`).

## Sådan fungerer den genererede datapack

Quests spores med scoreboards og kører automatisk fra en per-tick function.
NPCs er summoned villagers (`NoAI`, ingen trades) med tags til identifikation. Spillere
accepterer og afleverer quests ved at klikke på chat-prompts der bruger `/trigger`, så ingen
operator cheats er nødvendige. Fremskridt vises på action bar; dialog udløses
én gang per tilgang for at undgå chat spam.

Efter installation af packen og `/reload`, brug
`/function <namespace>:setup_guide` til at spawne NPCs og `/function <namespace>:debug`
til at verificere alt. Hvis du har defineret custom items, kør
`/function <namespace>:give_custom_items` for at modtage én af hver til test.
Den fulde installationsguide for din valgte platform findes i
`install.txt` inde i datapacken.

### Jobs

Når dit projekt inkluderer jobs, sporer datapacken spillerhandlinger på hver tick,
viser fremskridt på boss bars og giver milestone rewards ved konfigurerede levels.
Spillere kan følge levels under **Esc → Advancements → dit namespace tab**.
Hvis job advancements ser forældede ud efter redigering, kør
`/function <namespace>:jobs/sync_all` for at opdatere tabs for alle online.

### Custom items

Custom items er vanilla base items med **item components** (custom name, lore, food, tool rules osv.). Hvert item får et stabilt internt tag i `custom_data`, så gather/delivery quests kan tælle de rigtige stacks. De ligner deres base item medmindre du tilføjer en separat resource pack.

### Spawn zone mob drops

Kill objectives med **spawn zones** default til **no item drops** når aktiveret. Du kan skifte til vanilla mob loot eller konfigurere en custom drop list (vanilla items eller projekt custom items, med amount og chance). Datapacken vedhæfter en `DeathLootTable` ved summon og emitter loot table JSON efter behov.

### Custom mob drops

På siden **Custom mobs** kan du tilføje en drop list til enhver mob. Export emitter `data/<namespace>/loot_table/mobs/<tag>.json` og sætter `DeathLootTable:"<namespace>:mobs/<tag>"` ved summon (`/function <namespace>:spawn_mob/<tag>`, quest spawn zones, dungeons). Custom drops **erstatter** vanilla loot for den mob.

**Test efter export:** `/loot spawn ~ ~1 ~ loot <namespace>:mobs/<tag>` og `/function <namespace>:spawn_mob/<tag>` — dræb mobben. Genjoin verdenen efter geninstall af datapack (ikke kun `/reload`). Se [docs/custom-mob-drops.md](docs/custom-mob-drops.md) for loot-table format og fejlfinding.

## Bemærkninger om Minecraft 1.21.11

- `pack.mcmeta` bruger `min_format`/`max_format` `[94, 1]` (datapack format 94.1 for 1.21.11).
- Funktioner bruger mapperne `function/` og `tags/function/` (ental, ikke `functions/`).
- Tekstkomponenter bruger feltnavne fra 1.21.5+ (`click_event`, `hover_event`).

### Inventar over datapack-evner

En levende used/unused-matrix over vanilla datapack-flader (og hvad Quest Tool udsender) findes i
[docs/datapack-capabilities.md](docs/datapack-capabilities.md).

## Udvikling

**Forudsætninger:** Node.js 20+

```bash
npm install
npm run dev          # dev server at http://localhost:5173
npm run build        # typecheck + production build → dist/
npm run preview      # serve dist/ locally
npm test             # run unit tests once
npm run test:watch   # vitest watch mode
```

### Arkitektur

```
components/ + hooks/     UI and React logic
store/                   Zustand stores (project + UI state)
state/projectStore.ts    Pure CRUD, migration, localStorage I/O
types/                   Quest, item, job domain types
generator/               Pure functions: Project → datapack files / ZIP
```

**Generatoren** (`src/generator/`) er pure og tungt unit-tested — tilføj helst game logic der frem for i UI components. Schema migrations ligger i `src/state/projectStore.ts` (`PROJECT_SCHEMA_VERSION = 6`). Validation rules er i `src/generator/validate.ts`; UI kører dem løbende via `src/hooks/useValidation.ts` (300 ms debounce).

### Test

| Lag | Kommando / doc |
|-----|----------------|
| Unit tests (generator, store, flow) | `npm test` — kører også i [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) før build |
| Manuel in-game QA | [docs/INGAME_QA.da.md](docs/INGAME_QA.da.md) ([English](docs/INGAME_QA.md)) — checklist med `/function <ns>:setup_guide` og `/function <ns>:debug` |
| QA datapack fixture | Export → **Download test datapack**, eller `npm run ingame:fixture` |
| Fremtidig runtime automation | Design i [scripts/ingame/README.da.md](scripts/ingame/README.da.md) ([English](scripts/ingame/README.md)) |

Der er endnu ingen automatiseret Minecraft runtime test i CI; generator unit tests plus den manuelle checklist er sikkerhedsnettet.

## Deploy til GitHub Pages

Live-sitet på [https://quest.toeffe.uk](https://quest.toeffe.uk) deployes fra dette repo.
Det er en fuldt statisk, client-side app (ingen server, ingen database), så den kan hostes på GitHub Pages som den er.

1. Push dette repository til GitHub.
2. I repoet, åbn **Settings → Pages** og sæt **Source** til **Deploy from a branch**,
   branch **`main`**, mappe **`/docs`**. Brug ikke **GitHub Actions** som kilde (det bruger
   det defekte `deploy-pages` API). Brug ikke **`/ (root)`** på `main` — den mappe har Vites
   source `index.html`, ikke den byggede app.
3. Push til `main` (eller kør workflow manuelt). Den inkluderede
   [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) bygger appen og
   committer output til mappen **`docs/`** på **`main`** (samme branch som kildekoden).

Workflow bygger med `VITE_BASE=/` så asset paths virker ved custom domain root.
Custom domain sættes via [`public/CNAME`](public/CNAME), som Vite kopierer ind i hver deploy. Lokalt
bruger `npm run dev`/`build` også `/` som base.

### Fejlfinding ved deploy

To workflows er involveret — forveksl dem ikke:

| Workflow | Hvad den gør |
|----------|----------------|
| **Deploy to GitHub Pages** (`.github/workflows/deploy.yml`) | Bygger appen, kører lint/tests, committer output til `docs/` på `main` |
| **pages build and deployment** (GitHub automatisk) | Publicerer indholdet af `docs/` til det live site (bruger `deploy-pages` internt) |

Hvis sitet ikke opdateres efter en grøn workflow:

1. Bekræft at **Settings → Pages → Source** er **Branch: `main` / `/docs`**, ikke GitHub Actions eller `/ (root)`.
2. Efter en succesfuld kørsel, tjek at **`docs/index.html`** findes på `main` — uden den returnerer GitHub Pages 404, selv når workflowet er grønt. `pages build and deployment` publicerer kun det, der allerede ligger i `docs/`.
3. Kør workflow igen fra **Actions** hvis et push blev annulleret af et nyere commit (`cancel-in-progress`).

**`deploy-pages`-fejl: “in progress deployment”**

Hvis **pages build and deployment** fejler med `Deployment request failed … due to in progress deployment`, sidder en tidligere Pages-deploy fast i GitHubs kø (ikke en fejl i repoets build-workflow). Løsning:

1. Åbn **[Deployments](https://github.com/toeffe/Quest-Tool/deployments)** (eller **Settings → Pages**).
2. Annuller eller vent på den igangværende deployment (ofte knyttet til et ældre commit som `0911a9d`).
3. Kør **pages build and deployment** igen fra **Actions**, eller push et commit der opdaterer `docs/`.

Vores **Deploy to GitHub Pages**-workflow kalder ikke `deploy-pages`; kun GitHubs automatiske Pages-udgiver gør det. Grøn build-workflow + rød pages-workflow betyder normalt trin 1–3 ovenfor.

Workflowet committer build-filer til `docs/` på `main` med `[skip ci]`, så deploy-commits ikke genstarter build-workflowet. `peaceiris/actions-gh-pages` kan ikke publicere til samme branch som udløste kørslen (`main` → `main`), så deploy bruger `rsync` + `git push` i stedet.

## Tech stack

React 18, TypeScript, Vite 5, Zustand, `@xyflow/react`, JSZip, Vitest.
