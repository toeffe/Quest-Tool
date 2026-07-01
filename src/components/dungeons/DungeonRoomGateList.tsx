import { useTranslation } from 'react-i18next';
import type { Dungeon, DungeonRoom, QuestState } from '../../types/dungeon';
import type { Quest } from '../../types/quest';
import { Field, Select } from '../ui/Field';
import { QUEST_STATES } from './dungeonConstants';

interface Props {
  dungeon: Dungeon;
  quests: Quest[];
  selectedRoomId?: string;
  onChangeRoom: (roomId: string, patch: Partial<DungeonRoom>) => void;
}

export function DungeonRoomGateList({ dungeon, quests, selectedRoomId, onChangeRoom }: Props) {
  const { t } = useTranslation('dungeons');
  const { t: tc } = useTranslation('common');

  const questOptions = quests.map((q) => ({ value: q.name, label: q.name }));

  return (
    <Field label={t('editor.questGate')} hint={t('editor.questGateHint')}>
      {dungeon.rooms.length === 0 && <p className="muted">{t('editor.selectRoom')}</p>}
      {dungeon.rooms.map((room) => (
        <div
          key={room.id}
          className={`dungeon-gate-row ${selectedRoomId === room.id ? 'selected' : ''}`}
          style={{ marginBottom: 12 }}
        >
          <div className="row-between" style={{ marginBottom: 6 }}>
            <strong>{room.name || t('editor.roomName')}</strong>
          </div>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={!!room.questGate}
              onChange={(e) =>
                onChangeRoom(room.id, {
                  questGate: e.target.checked
                    ? { questName: quests[0]?.name ?? '', requiredState: 1 }
                    : undefined,
                })
              }
            />
            <span>{room.questGate ? t('editor.gateQuest') : t('editor.noGate')}</span>
          </label>
          {room.questGate && (
            <div className="field-row">
              <Select
                label={t('editor.gateQuest')}
                value={room.questGate.questName}
                options={
                  questOptions.length ? questOptions : [{ value: '', label: tc('actions.none') }]
                }
                onChange={(questName) =>
                  onChangeRoom(room.id, {
                    questGate: { ...room.questGate!, questName },
                  })
                }
              />
              <Select
                label={t('editor.gateState')}
                value={String(room.questGate.requiredState)}
                options={QUEST_STATES.map((s) => ({
                  value: String(s),
                  label: t(`questStates.${s}`),
                }))}
                onChange={(v) =>
                  onChangeRoom(room.id, {
                    questGate: {
                      ...room.questGate!,
                      requiredState: Number(v) as QuestState,
                    },
                  })
                }
              />
            </div>
          )}
        </div>
      ))}
    </Field>
  );
}
