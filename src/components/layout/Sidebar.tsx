import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useValidation } from '../../hooks/useValidation';
import { useQuestTypeLabels } from '../../i18n/useLabels';
import { useUIStore } from '../../store/uiStore';
import { useProjectStore } from '../../store/useProjectStore';

export function Sidebar() {
  const { t } = useTranslation('common');
  const questTypeLabels = useQuestTypeLabels();
  const project = useProjectStore((s) => s.project);
  const reorderQuests = useProjectStore((s) => s.reorderQuests);
  const selectedQuestId = useUIStore((s) => s.selectedQuestId);
  const setSelectedQuestId = useUIStore((s) => s.setSelectedQuestId);
  const setActiveView = useUIStore((s) => s.setActiveView);
  const addQuest = useProjectStore((s) => s.addQuest);
  const duplicateQuest = useProjectStore((s) => s.duplicateQuest);
  const deleteQuest = useProjectStore((s) => s.deleteQuest);
  const issues = useValidation();

  const [dragId, setDragId] = useState<string | null>(null);
  const [dropBeforeId, setDropBeforeId] = useState<string | null>(null);

  function questErrors(id: string) {
    return issues.filter((i) => i.questId === id && i.level === 'error').length;
  }
  function questWarnings(id: string) {
    return issues.filter((i) => i.questId === id && i.level === 'warning').length;
  }

  function handleAdd() {
    const quest = addQuest();
    setSelectedQuestId(quest.id);
    setActiveView('flow');
  }

  function handleSelect(id: string) {
    setSelectedQuestId(id);
    setActiveView('flow');
  }

  function reorder(draggedId: string, beforeId: string | null) {
    const ids = project.quests.map((q) => q.id);
    const from = ids.indexOf(draggedId);
    if (from < 0) return;
    const next = [...ids];
    next.splice(from, 1);
    const insertAt = beforeId ? next.indexOf(beforeId) : next.length;
    if (insertAt < 0) return;
    next.splice(insertAt, 0, draggedId);
    reorderQuests(next);
  }

  return (
    <aside className="quest-sidebar">
      <div className="quest-sidebar-head">
        <span className="quest-sidebar-title">{t('sidebar.title')}</span>
        <button
          type="button"
          className="btn small primary"
          onClick={handleAdd}
          title={t('sidebar.newQuestTitle')}
        >
          {t('actions.new')}
        </button>
      </div>

      <div className="quest-sidebar-list">
        {project.quests.map((q) => {
          const selected = q.id === selectedQuestId;
          const errs = questErrors(q.id);
          const warns = questWarnings(q.id);
          const isDragging = dragId === q.id;
          const showDropLine = dropBeforeId === q.id && dragId !== q.id;
          return (
            <div
              key={q.id}
              className={`quest-sidebar-item ${selected ? 'active' : ''} ${isDragging ? 'dragging' : ''}`}
              onClick={() => handleSelect(q.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && handleSelect(q.id)}
              onDragOver={(e) => {
                e.preventDefault();
                if (dragId && dragId !== q.id) setDropBeforeId(q.id);
              }}
              onDragLeave={() => {
                if (dropBeforeId === q.id) setDropBeforeId(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (dragId) reorder(dragId, q.id);
                setDragId(null);
                setDropBeforeId(null);
              }}
            >
              {showDropLine && <div className="quest-sidebar-drop-line" aria-hidden />}
              <span
                className="quest-sidebar-grip"
                draggable
                title={t('sidebar.dragToReorder')}
                onDragStart={(e) => {
                  e.stopPropagation();
                  setDragId(q.id);
                  e.dataTransfer.effectAllowed = 'move';
                }}
                onDragEnd={() => {
                  setDragId(null);
                  setDropBeforeId(null);
                }}
                onClick={(e) => e.stopPropagation()}
                aria-hidden
              >
                ⋮⋮
              </span>
              <div className="quest-sidebar-item-main">
                <span className="quest-sidebar-item-name">
                  {q.name || t('sidebar.untitledQuest')}
                </span>
                <span className="quest-sidebar-item-type">{questTypeLabels[q.type]}</span>
              </div>
              <div className="quest-sidebar-item-badges">
                {errs > 0 && (
                  <span
                    className="validation-dot error"
                    title={t('sidebar.errorCountTitle', { count: errs })}
                  />
                )}
                {errs === 0 && warns > 0 && (
                  <span
                    className="validation-dot warning"
                    title={t('sidebar.warningCountTitle', { count: warns })}
                  />
                )}
              </div>
              {selected && (
                <div className="quest-sidebar-item-actions">
                  <button
                    type="button"
                    className="btn small ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      duplicateQuest(q.id);
                      const next = useProjectStore.getState().project;
                      const idx = next.quests.findIndex((x) => x.id === q.id);
                      if (idx >= 0 && next.quests[idx + 1]) {
                        setSelectedQuestId(next.quests[idx + 1].id);
                      }
                    }}
                  >
                    {t('actions.duplicate')}
                  </button>
                  <button
                    type="button"
                    className="btn small danger"
                    disabled={project.quests.length <= 1}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (deleteQuest(q.id)) {
                        const remaining = project.quests.filter((x) => x.id !== q.id);
                        setSelectedQuestId(remaining[0]?.id ?? null);
                      } else {
                        alert(t('sidebar.minQuestAlert'));
                      }
                    }}
                  >
                    {t('actions.delete')}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
