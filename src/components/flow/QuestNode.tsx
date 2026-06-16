import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import { type Quest, QUEST_TYPE_LABELS } from '../../types/quest';
import { type ValidationIssue } from '../../generator/validate';

export type FlowStage = 'npc' | 'quest' | 'rewards' | 'chain';

export interface QuestNodeData {
  quest: Quest;
  issues: ValidationIssue[];
  selectedStage?: FlowStage;
  isSelected: boolean;
  onOpenStage: (questId: string, stage: FlowStage) => void;
  [key: string]: unknown;
}

export type QuestFlowNode = Node<QuestNodeData, 'quest'>;

const STAGE_LABELS: Record<FlowStage, string> = {
  npc: 'NPC',
  quest: 'Quest',
  rewards: 'Rewards',
  chain: 'Chain',
};

/** Best-effort mapping of a validation message to the stage that owns it. */
function classifyIssue(message: string): FlowStage {
  const m = message.toLowerCase();
  if (m.includes('reward')) return 'rewards';
  if (m.includes('chain') || m.includes('require') || m.includes('unlock')) return 'chain';
  if (m.includes('giver') || m.includes('npc')) return 'npc';
  return 'quest';
}

type StageHealth = 'ok' | 'warning' | 'error';

function stageHealth(issues: ValidationIssue[], stage: FlowStage): StageHealth {
  let health: StageHealth = 'ok';
  for (const issue of issues) {
    if (classifyIssue(issue.message) !== stage) continue;
    if (issue.level === 'error') return 'error';
    health = 'warning';
  }
  return health;
}

function shortId(id: string | undefined): string {
  if (!id) return '?';
  return id.replace(/^minecraft:/, '');
}

function oneObjectiveSummary(quest: Quest, o: Quest['objectives'][number]): string {
  switch (quest.type) {
    case 'kill':
      return `Kill ${o.amount ?? 0} ${shortId(o.target)}`;
    case 'gather':
      return `Gather ${o.amount ?? 0} ${shortId(o.target)}`;
    case 'delivery':
      return `Deliver ${o.amount ?? 0} ${shortId(o.target)}`;
    case 'exploration':
      return o.location ? `Explore (${o.location.x}, ${o.location.y}, ${o.location.z})` : 'Explore a location';
    case 'talk':
      return quest.targetNpc ? `Talk to ${quest.targetNpc.name}` : 'Talk to the giver';
    case 'daily':
      return `Daily: ${o.amount ?? 0} ${shortId(o.target)}`;
    default:
      return o.description ?? '';
  }
}

function objectiveSummary(quest: Quest): string {
  const first = quest.objectives[0] ?? {};
  const base = oneObjectiveSummary(quest, first);
  const extra = quest.objectives.length - 1;
  return extra > 0 ? `${base} +${extra} more` : base;
}

function chainSummary(quest: Quest): string {
  const parts: string[] = [];
  if (quest.chain.requires) parts.push(`needs ${quest.chain.requires}`);
  if (quest.chain.unlocks) parts.push(`unlocks ${quest.chain.unlocks}`);
  return parts.length ? parts.join(' / ') : 'Standalone';
}

function stageSummary(quest: Quest, stage: FlowStage): string {
  switch (stage) {
    case 'npc':
      return quest.npc.name || 'Unnamed giver';
    case 'quest':
      return objectiveSummary(quest);
    case 'rewards':
      return quest.rewards.length === 0
        ? 'No rewards'
        : `${quest.rewards.length} reward${quest.rewards.length === 1 ? '' : 's'}`;
    case 'chain':
      return chainSummary(quest);
  }
}

const STAGES: FlowStage[] = ['npc', 'quest', 'rewards', 'chain'];

export function QuestNode({ data }: NodeProps<QuestFlowNode>) {
  const { quest, issues, selectedStage, isSelected, onOpenStage } = data;
  const hasError = issues.some((i) => i.level === 'error');
  const hasWarning = issues.some((i) => i.level === 'warning');
  const nodeState = hasError ? 'error' : hasWarning ? 'warning' : 'ok';

  return (
    <div className={`flow-node ${isSelected ? 'selected' : ''} ${nodeState}`}>
      <Handle type="target" position={Position.Left} className="flow-handle" />

      <div className="flow-node-header">
        <span className="flow-node-title">{quest.name || 'Untitled quest'}</span>
        <span className="flow-node-type">{QUEST_TYPE_LABELS[quest.type]}</span>
      </div>

      <div className="flow-node-stages">
        {STAGES.map((stage) => {
          const health = stageHealth(issues, stage);
          const active = selectedStage === stage && isSelected;
          return (
            <button
              key={stage}
              className={`flow-stage ${active ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                onOpenStage(quest.id, stage);
              }}
              title={stageSummary(quest, stage)}
            >
              <span className={`flow-stage-dot ${health}`} />
              <span className="flow-stage-label">{STAGE_LABELS[stage]}</span>
              <span className="flow-stage-summary">{stageSummary(quest, stage)}</span>
            </button>
          );
        })}
      </div>

      <Handle type="source" position={Position.Right} className="flow-handle" />
    </div>
  );
}
