import { type Project, type Quest } from '../../types/quest';
import { StepNPC } from '../steps/StepNPC';
import { StepQuest } from '../steps/StepQuest';
import { StepRewards } from '../steps/StepRewards';
import { StepChain } from '../steps/StepChain';
import { StepGenerate } from '../steps/StepGenerate';
import { QuestChecklist } from '../QuestChecklist';
import { type FlowStage } from './QuestNode';

export type InspectorTarget =
  | { kind: 'quest'; questId: string; stage: FlowStage }
  | { kind: 'generate' }
  | null;

interface Props {
  target: InspectorTarget;
  project: Project;
  onChangeQuest: (quest: Quest) => void;
  onSelectStage: (stage: FlowStage) => void;
  onClose: () => void;
}

const STAGE_TABS: { stage: FlowStage; label: string }[] = [
  { stage: 'npc', label: 'NPC' },
  { stage: 'quest', label: 'Quest' },
  { stage: 'rewards', label: 'Rewards' },
  { stage: 'chain', label: 'Chain' },
];

export function InspectorPanel({
  target,
  project,
  onChangeQuest,
  onSelectStage,
  onClose,
}: Props) {
  if (!target) return null;

  if (target.kind === 'generate') {
    return (
      <aside className="flow-inspector">
        <div className="flow-inspector-head">
          <span className="flow-inspector-title">Generate</span>
          <button className="icon-btn" onClick={onClose} title="Close">
            Close
          </button>
        </div>
        <div className="flow-inspector-body">
          <StepGenerate project={project} />
        </div>
      </aside>
    );
  }

  const quest = project.quests.find((q) => q.id === target.questId);
  if (!quest) return null;

  return (
    <aside className="flow-inspector">
      <div className="flow-inspector-head">
        <span className="flow-inspector-title">{quest.name || 'Untitled quest'}</span>
        <button className="icon-btn" onClick={onClose} title="Close">
          Close
        </button>
      </div>

      <div className="flow-inspector-tabs">
        {STAGE_TABS.map(({ stage, label }) => (
          <button
            key={stage}
            className={`flow-inspector-tab ${target.stage === stage ? 'active' : ''}`}
            onClick={() => onSelectStage(stage)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flow-inspector-body">
        <QuestChecklist project={project} quest={quest} />

        {target.stage === 'npc' && <StepNPC quest={quest} onChange={onChangeQuest} />}
        {target.stage === 'quest' && <StepQuest quest={quest} onChange={onChangeQuest} />}
        {target.stage === 'rewards' && (
          <StepRewards quest={quest} platform={project.platform} onChange={onChangeQuest} />
        )}
        {target.stage === 'chain' && (
          <StepChain quest={quest} project={project} onChange={onChangeQuest} />
        )}
      </div>
    </aside>
  );
}
