import { useTranslation } from 'react-i18next';
import type { ValidationIssue } from '../../generator/validate';
import { useUIStore } from '../../store/uiStore';
import type { Dimension, TeleportPad } from '../../types/dimension';
import type { Dungeon, DungeonRoom } from '../../types/dungeon';
import type { Project, Quest } from '../../types/quest';
import { DimensionForm } from '../dimensions/DimensionForm';
import { PadForm } from '../dimensions/PadForm';
import { DungeonForm } from '../dungeons/DungeonForm';
import { DungeonRoomGateList } from '../dungeons/DungeonRoomGateList';
import { QuestEditor } from '../editor/QuestEditor';
import type { EditorTab } from '../editor/ValidationBar';
import { ValidationBar } from '../editor/ValidationBar';
import { ExportPanel } from '../export/ExportPanel';
import { ResizableInspector } from './ResizableInspector';

export type InspectorTarget =
  | { kind: 'quest'; questId: string; tab?: EditorTab; stepId?: string }
  | { kind: 'dungeon'; dungeonId: string; roomId?: string }
  | { kind: 'dimension'; dimensionId: string }
  | { kind: 'pad'; padId: string }
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

function InspectorShell({
  title,
  fullEditorLabel,
  fullEditorTitle,
  onFullEditor,
  onClose,
  children,
}: {
  title: string;
  fullEditorLabel?: string;
  fullEditorTitle?: string;
  onFullEditor?: () => void;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const { t: tc } = useTranslation('common');
  const { t } = useTranslation('flow');

  return (
    <ResizableInspector>
      <aside className="flow-inspector">
        <div className="flow-inspector-head">
          <span className="flow-inspector-title">{title}</span>
          <div className="flow-inspector-actions">
            {onFullEditor && fullEditorLabel && (
              <button
                type="button"
                className="btn small ghost"
                onClick={onFullEditor}
                title={fullEditorTitle}
              >
                {fullEditorLabel}
              </button>
            )}
            <button
              type="button"
              className="icon-btn"
              onClick={onClose}
              title={t('inspector.closeTitle')}
            >
              {tc('actions.close')}
            </button>
          </div>
        </div>
        <div className="flow-inspector-body flow-inspector-editor">{children}</div>
      </aside>
    </ResizableInspector>
  );
}

export function InspectorPanel({
  target,
  project,
  issues,
  onChangeQuest,
  onChangeProject,
  onClose,
}: Props) {
  const { t: tc } = useTranslation('common');
  const { t } = useTranslation('flow');
  const setActiveView = useUIStore((s) => s.setActiveView);
  const setDimensionsFocus = useUIStore((s) => s.setDimensionsFocus);
  const setDungeonsFocus = useUIStore((s) => s.setDungeonsFocus);

  if (!target) return null;

  if (target.kind === 'generate') {
    return (
      <ResizableInspector>
        <aside className="flow-inspector">
          <div className="flow-inspector-head">
            <span className="flow-inspector-title">{t('inspector.exportTitle')}</span>
            <button
              type="button"
              className="icon-btn"
              onClick={onClose}
              title={t('inspector.closeTitle')}
            >
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

  if (!onChangeProject) return null;

  if (target.kind === 'dimension') {
    const dimension = (project.dimensions ?? []).find((d) => d.id === target.dimensionId);
    if (!dimension) return null;
    const dimIssues = issues.filter((i) => i.dimensionId === dimension.id && !i.teleportPadId);

    const updateDimension = (patch: Partial<Dimension>) => {
      onChangeProject({
        ...project,
        dimensions: (project.dimensions ?? []).map((d) =>
          d.id === dimension.id ? { ...d, ...patch } : d,
        ),
      });
    };

    return (
      <InspectorShell
        title={dimension.name || t('inspector.untitledDimension')}
        fullEditorLabel={tc('actions.fullEditor')}
        fullEditorTitle={t('inspector.fullDimensionsTitle')}
        onFullEditor={() => {
          setDimensionsFocus({ kind: 'dimension', id: dimension.id });
          setActiveView('dimensions');
        }}
        onClose={onClose}
      >
        <DimensionForm
          dimension={dimension}
          project={project}
          issues={dimIssues}
          onChange={updateDimension}
          compact
        />
      </InspectorShell>
    );
  }

  if (target.kind === 'pad') {
    const pad = (project.teleportPads ?? []).find((p) => p.id === target.padId);
    if (!pad) return null;
    const padIssues = issues.filter((i) => i.teleportPadId === pad.id);

    const updatePad = (patch: Partial<TeleportPad>) => {
      onChangeProject({
        ...project,
        teleportPads: (project.teleportPads ?? []).map((p) =>
          p.id === pad.id ? { ...p, ...patch } : p,
        ),
      });
    };

    return (
      <InspectorShell
        title={pad.name || t('inspector.untitledPad')}
        fullEditorLabel={tc('actions.fullEditor')}
        fullEditorTitle={t('inspector.fullDimensionsTitle')}
        onFullEditor={() => {
          setDimensionsFocus({ kind: 'pad', id: pad.id });
          setActiveView('dimensions');
        }}
        onClose={onClose}
      >
        <PadForm
          pad={pad}
          dimensions={project.dimensions ?? []}
          issues={padIssues}
          onChange={updatePad}
          compact
        />
      </InspectorShell>
    );
  }

  if (target.kind === 'dungeon') {
    const dungeon = (project.dungeons ?? []).find((d) => d.id === target.dungeonId);
    if (!dungeon) return null;
    const dungeonIssues = issues.filter((i) => i.dungeonId === dungeon.id);

    const updateDungeon = (patch: Partial<Dungeon>) => {
      onChangeProject({
        ...project,
        dungeons: (project.dungeons ?? []).map((d) =>
          d.id === dungeon.id ? { ...d, ...patch } : d,
        ),
      });
    };

    const updateRoom = (roomId: string, patch: Partial<DungeonRoom>) => {
      onChangeProject({
        ...project,
        dungeons: (project.dungeons ?? []).map((d) =>
          d.id === dungeon.id
            ? {
                ...d,
                rooms: d.rooms.map((r) => (r.id === roomId ? { ...r, ...patch } : r)),
              }
            : d,
        ),
      });
    };

    return (
      <InspectorShell
        title={dungeon.name || t('inspector.untitledDungeon')}
        fullEditorLabel={tc('actions.fullEditor')}
        fullEditorTitle={t('inspector.fullDungeonsTitle')}
        onFullEditor={() => {
          setDungeonsFocus(dungeon.id);
          setActiveView('dungeons');
        }}
        onClose={onClose}
      >
        <div className="flow-inspector-form">
          <DungeonForm dungeon={dungeon} project={project} onChange={updateDungeon} />
          <DungeonRoomGateList
            dungeon={dungeon}
            quests={project.quests}
            selectedRoomId={target.roomId}
            onChangeRoom={updateRoom}
          />
          <ValidationBar issues={dungeonIssues} />
        </div>
      </InspectorShell>
    );
  }

  const quest = project.quests.find((q) => q.id === target.questId);
  if (!quest) return null;

  return (
    <InspectorShell
      title={quest.name || t('inspector.untitledQuest')}
      fullEditorLabel={tc('actions.fullEditor')}
      fullEditorTitle={t('inspector.fullEditorTitle')}
      onFullEditor={() => setActiveView('editor')}
      onClose={onClose}
    >
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
    </InspectorShell>
  );
}
