import { type Project, type Quest } from '../../types/quest';
import { type ValidationIssue } from '../../generator/validate';
import { QuestEditor } from '../editor/QuestEditor';
import { ExportPanel } from '../export/ExportPanel';

export type InspectorTarget =
  | { kind: 'quest'; questId: string }
  | { kind: 'generate' }
  | null;

interface Props {
  target: InspectorTarget;
  project: Project;
  issues: ValidationIssue[];
  onChangeQuest: (quest: Quest) => void;
  onClose: () => void;
}

export function InspectorPanel({ target, project, issues, onChangeQuest, onClose }: Props) {
  if (!target) return null;

  if (target.kind === 'generate') {
    return (
      <aside className="flow-inspector">
        <div className="flow-inspector-head">
          <span className="flow-inspector-title">Export</span>
          <button type="button" className="icon-btn" onClick={onClose} title="Close">
            Close
          </button>
        </div>
        <div className="flow-inspector-body flow-inspector-export">
          <ExportPanel />
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
        <button type="button" className="icon-btn" onClick={onClose} title="Close">
          Close
        </button>
      </div>
      <div className="flow-inspector-body flow-inspector-editor">
        <QuestEditor
          quest={quest}
          project={project}
          issues={issues}
          onChange={onChangeQuest}
          compact
        />
      </div>
    </aside>
  );
}
