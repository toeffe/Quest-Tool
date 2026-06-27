interface Props {
  onClose: () => void;
}

const VIEWS = [
  {
    title: 'Editor',
    body:
      'Tabbed quest editor — select a quest in the sidebar, then edit Objectives, NPC, Rewards, and Chain. ' +
      'Kill quests with spawn zones can set drop behavior: no drops, vanilla mob loot, or a custom drop list. ' +
      'A validation bar at the bottom shows issues for the current quest.',
  },
  {
    title: 'Story flow',
    body: 'A visual map of every quest. Drag between quests to link chains, use auto-layout, and click a node to edit it in the inspector.',
  },
  {
    title: 'Custom items',
    body:
      'Define trophy collectibles, food, tools, and more. Use them as quest rewards, gather/delivery targets, ' +
      'or spawn-zone mob drops. Items use component syntax — no custom textures unless you add a resource pack.',
  },
  {
    title: 'Jobs',
    body:
      'Passive skills (fishing, mining, combat, and more) level up from player actions. New projects include 11 starter jobs. ' +
      'Configure XP curves, stat presets, and milestone rewards that grant custom items on level-up.',
  },
  {
    title: 'Advancements',
    body:
      'Preview the in-game skill trees exported with your datapack. Players open Esc → Advancements → your namespace tab to track job levels.',
  },
  {
    title: 'Commands',
    body: 'A reference of the admin commands the generated datapack adds (spawning NPCs, resets, debug, job sync).',
  },
  {
    title: 'Export',
    body:
      'Review validation, read the platform install guide, preview generated files, and download the datapack ZIP. ' +
      'The ZIP includes quest-tool-project.json so you can re-import your work via Settings.',
  },
];

export function HelpPanel({ onClose }: Props) {
  return (
    <div className="help-panel">
      <div className="row-between" style={{ marginBottom: 12 }}>
        <h3 style={{ margin: 0 }}>Getting started</h3>
        <button className="icon-btn" onClick={onClose} title="Close help">
          Close
        </button>
      </div>

      <p className="muted" style={{ marginTop: 0 }}>
        Build quests for Minecraft Java 1.21.11, then export a ready-to-install datapack. Your work
        auto-saves in this browser. Use <strong>Settings</strong> (gear icon) → Import to restore a JSON file
        or a datapack ZIP you downloaded earlier. Shortcuts: <kbd>Ctrl/Cmd+K</kbd> command palette,{' '}
        <kbd>Ctrl/Cmd+E</kbd> jump to Export.
      </p>

      <div
        className="help-views"
        style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}
      >
        {VIEWS.map((v) => (
          <div key={v.title} className="help-view">
            <strong>{v.title}</strong>
            <div className="muted">{v.body}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
