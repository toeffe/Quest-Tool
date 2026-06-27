export const helpEn = {
  title: 'Getting started',
  closeTitle: 'Close help',
  intro:
    'Build quests for Minecraft Java 1.21.11, then export a ready-to-install datapack. Your work auto-saves in this browser. Story Flow is the default view. Use Settings (gear icon) → Import to restore a JSON file or a datapack ZIP you downloaded earlier. Shortcuts: Ctrl/Cmd+K command palette, Ctrl/Cmd+E jump to Export, Ctrl/Cmd+Shift+E next error (in Story Flow).',

  views: {
    flow: {
      title: 'Story flow',
      body:
        'The main quest workspace — opens by default. Each card shows the player playthrough step-by-step. Drag the right port (→) to another quest\'s left port (←). Click a link to unlink or set auto-start. Click any step to edit in the resizable inspector. Chain tab in the inspector sets job gates and follow-up behavior. Sidebar: drag the grip to reorder quests. Shortcuts: Ctrl/Cmd+Shift+A auto-arrange, Ctrl/Cmd+Shift+F fit view, Ctrl/Cmd+Shift+E next error, Esc close inspector. Toolbar: Fit errors, Next error, Errors only filter.',
    },
    editor: {
      title: 'Editor',
      body:
        'Full-width tabbed quest editor — use when you want more room than the flow inspector. Open via the Editor tab or the Full editor button in the flow inspector. Edit Objectives, NPC, Rewards, and Chain with a validation bar at the bottom.',
    },
    items: {
      title: 'Custom items',
      body:
        'Define trophy collectibles, food, tools, and more. Use them as quest rewards, gather/delivery targets, or spawn-zone mob drops. Items use component syntax — no custom textures unless you add a resource pack.',
    },
    jobs: {
      title: 'Jobs',
      body:
        'Passive skills (fishing, mining, combat, and more) level up from player actions. New projects include 11 starter jobs. Configure XP curves, stat presets, and milestone rewards that grant custom items on level-up.',
    },
    advancements: {
      title: 'Advancements',
      body:
        'Preview the in-game skill trees exported with your datapack. Players open Esc → Advancements → your namespace tab to track job levels.',
    },
    commands: {
      title: 'Commands',
      body:
        'A reference of the admin commands the generated datapack adds (spawning NPCs, resets, debug, job sync).',
    },
    export: {
      title: 'Export',
      body:
        'Review validation, read the platform install guide, preview generated files, and download the datapack ZIP. The ZIP includes quest-tool-project.json so you can re-import your work via Settings.',
    },
  },
} as const;
