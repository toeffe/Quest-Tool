interface Props {
  onClose: () => void;
}

const VIEWS = [
  {
    title: 'Quest Builder',
    body: 'Edit one quest at a time through five steps: NPC, Quest, Rewards, Chain, then Generate.',
  },
  {
    title: 'Story Flow',
    body: 'A visual map of every quest. Drag between quests to link them, and click a card to edit it.',
  },
  {
    title: 'In-Game Commands',
    body: 'A reference of the admin commands the generated datapack adds (spawning NPCs, resets, debug).',
  },
  {
    title: 'Custom Items',
    body: 'Define trophy collectibles, food, tools, and more. Pick them as quest rewards or gather/delivery targets. Items use component syntax — no custom textures unless you add a resource pack.',
  },
];

const STEPS = ['NPC', 'Quest', 'Rewards', 'Chain', 'Generate'];

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
        Build quests for Minecraft Java 1.21.11, then export a ready-to-install datapack. Pick a
        quest in the left sidebar, fill in the steps, and head to Generate when you are ready.
      </p>

      <div className="help-flow">
        {STEPS.map((label, i) => (
          <span key={label} className="help-flow-step">
            <span className="help-flow-pill">{label}</span>
            {i < STEPS.length - 1 && <span className="help-flow-arrow">-&gt;</span>}
          </span>
        ))}
      </div>

      <div className="help-views" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
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
