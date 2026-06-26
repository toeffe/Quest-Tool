import { QUEST_TYPE_LABELS } from '../../types/quest';
import { useProjectStore } from '../../store/useProjectStore';
import { useUIStore } from '../../store/uiStore';
import { useValidation } from '../../hooks/useValidation';

export function Sidebar() {
  const project = useProjectStore((s) => s.project);
  const selectedQuestId = useUIStore((s) => s.selectedQuestId);
  const setSelectedQuestId = useUIStore((s) => s.setSelectedQuestId);
  const setActiveView = useUIStore((s) => s.setActiveView);
  const addQuest = useProjectStore((s) => s.addQuest);
  const duplicateQuest = useProjectStore((s) => s.duplicateQuest);
  const deleteQuest = useProjectStore((s) => s.deleteQuest);
  const issues = useValidation();

  function questErrors(id: string) {
    return issues.filter((i) => i.questId === id && i.level === 'error').length;
  }
  function questWarnings(id: string) {
    return issues.filter((i) => i.questId === id && i.level === 'warning').length;
  }

  function handleAdd() {
    const quest = addQuest();
    setSelectedQuestId(quest.id);
    setActiveView('editor');
  }

  function handleSelect(id: string) {
    setSelectedQuestId(id);
    setActiveView('editor');
  }

  return (
    <aside className="quest-sidebar">
      <div className="quest-sidebar-head">
        <span className="quest-sidebar-title">Quests</span>
        <button type="button" className="btn small primary" onClick={handleAdd} title="New quest">
          + New
        </button>
      </div>

      <div className="quest-sidebar-list">
        {project.quests.map((q) => {
          const selected = q.id === selectedQuestId;
          const errs = questErrors(q.id);
          const warns = questWarnings(q.id);
          return (
            <div
              key={q.id}
              className={`quest-sidebar-item ${selected ? 'active' : ''}`}
              onClick={() => handleSelect(q.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && handleSelect(q.id)}
            >
              <div className="quest-sidebar-item-main">
                <span className="quest-sidebar-item-name">{q.name || 'Untitled quest'}</span>
                <span className="quest-sidebar-item-type">{QUEST_TYPE_LABELS[q.type]}</span>
              </div>
              <div className="quest-sidebar-item-badges">
                {errs > 0 && (
                  <span className="validation-dot error" title={`${errs} error(s)`} />
                )}
                {errs === 0 && warns > 0 && (
                  <span className="validation-dot warning" title={`${warns} warning(s)`} />
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
                    Duplicate
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
                        alert('A project needs at least one quest.');
                      }
                    }}
                  >
                    Delete
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
