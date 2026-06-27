import { useTranslation } from 'react-i18next';
import { type Project, type Quest } from '../../types/quest';
import { type ValidationIssue } from '../../generator/validate';
import { type EditorTab } from '../editor/ValidationBar';
import { QuestEditor } from '../editor/QuestEditor';
import { ExportPanel } from '../export/ExportPanel';
import { ResizableInspector } from './ResizableInspector';
import { useUIStore } from '../../store/uiStore';

export type InspectorTarget =
  | { kind: 'quest'; questId: string; tab?: EditorTab; stepId?: string }
  | { kind: 'generate' }
  | null;

interface Props {
  target: InspectorTarget;
  project: Project;
  issues: ValidationIssue[];
  onChangeQuest: (quest: Quest) => void;
  onChangeProject?: (project: Project) => void;
  onClose: () => void;
}

export function InspectorPanel({ target, project, issues, onChangeQuest, onChangeProject, onClose }: Props) {
  const { t: tc } = useTranslation('common');
  const { t } = useTranslation('flow');
  const setActiveView = useUIStore((s) => s.setActiveView);

  if (!target) return null;

  if (target.kind === 'generate') {
    return (
      <ResizableInspector>
        <aside className="flow-inspector">
          <div className="flow-inspector-head">
            <span className="flow-inspector-title">{t('inspector.exportTitle')}</span>
            <button type="button" className="icon-btn" onClick={onClose} title={t('inspector.closeTitle')}>
              {tc('actions.close')}
            </button>
          </div>
          <div className="flow-inspector-body flow-inspector-export">
            <ExportPanel />
          </div>
        </aside>
      </ResizableInspector>
    );
  }

  const quest = project.quests.find((q) => q.id === target.questId);
  if (!quest) return null;

  return (
    <ResizableInspector>
      <aside className="flow-inspector">
        <div className="flow-inspector-head">
          <span className="flow-inspector-title">{quest.name || t('inspector.untitledQuest')}</span>
          <div className="flow-inspector-actions">
            <button
              type="button"
              className="btn small ghost"
              onClick={() => setActiveView('editor')}
              title={t('inspector.fullEditorTitle')}
            >
              {tc('actions.fullEditor')}
            </button>
            <button type="button" className="icon-btn" onClick={onClose} title={t('inspector.closeTitle')}>
              {tc('actions.close')}
            </button>
          </div>
        </div>
        <div className="flow-inspector-body flow-inspector-editor">
          <QuestEditor
            key={`${quest.id}-${target.tab ?? 'objectives'}`}
            quest={quest}
            project={project}
            issues={issues}
            onChange={onChangeQuest}
            onChangeProject={onChangeProject}
            compact
            initialTab={target.tab}
          />
        </div>
      </aside>
    </ResizableInspector>
  );
}
