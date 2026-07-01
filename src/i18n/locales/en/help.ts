export const helpEn = {
  title: 'Getting started',
  closeTitle: 'Close help',
  intro:
    'Build quests for Minecraft Java 1.21.11 and export a datapack. Work auto-saves in this browser.',
  introHint:
    'Story Flow is the default view. Settings → Import restores JSON or a datapack ZIP. Shortcuts: Ctrl/Cmd+K palette, Ctrl/Cmd+E Export, Ctrl/Cmd+Shift+E next error.',

  shortcutsTitle: 'Keyboard shortcuts',

  views: {
    flow: {
      title: 'Story flow',
      summary: 'Main quest workspace — drag-connect quests, edit in the inspector.',
      body: "Each card shows the player playthrough. Drag right port (→) to another's left port (←). Click a link to unlink or set auto-start. Chain tab sets job gates. Sidebar grip reorders quests. Ctrl/Cmd+Shift+A arrange, +F fit view, +E next error, Esc close inspector.",
    },
    editor: {
      title: 'Editor',
      summary: 'Full-width tabbed quest editor.',
      body: 'More room than the flow inspector. Open via Editor tab or Full editor in the inspector. Objectives, NPC, Rewards, Chain tabs with validation at the bottom.',
    },
    items: {
      title: 'Custom items',
      summary: 'Trophy items, food, tools for rewards and objectives.',
      body: 'Use in quest rewards, gather/delivery targets, or spawn-zone drops. Component syntax — no custom textures unless you add a resource pack.',
    },
    jobs: {
      title: 'Jobs',
      summary: 'Passive skills from player actions.',
      body: 'New projects include 11 starter jobs. Configure XP curves, presets, and milestone rewards with custom items.',
    },
    advancements: {
      title: 'Advancements',
      summary: 'Preview in-game job trees.',
      body: 'Players open Esc → Advancements → your namespace tab to track job levels.',
    },
    commands: {
      title: 'Commands',
      summary: 'Datapack admin command reference.',
      body: 'Spawn NPCs, reset progress, debug, job sync — for setup and administration.',
    },
    export: {
      title: 'Export',
      summary: 'Validate and download the datapack ZIP.',
      body: 'Install guide, file preview, and download. ZIP includes quest-tool-project.json for re-import.',
    },
  },
} as const;
