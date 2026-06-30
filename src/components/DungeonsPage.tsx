import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type Project } from '../types/quest';
import {
  type Dungeon,
  type DungeonRoom,
  type RoomType,
  type TriggerEvent,
  type TriggerAction,
  type QuestState,
  type BoundingBox,
  normalizeBounds,
  boundsVolume,
  createRoomSpawn,
  createRoomTrigger,
} from '../types/dungeon';
import { toIdentifier } from '../types/ids';
import { useMobOptions } from '../data/mobs';
import { type ValidationIssue } from '../generator/validate';
import { TextInput, NumberInput, Field, Select, PillSelect } from './ui/Field';
import { useUIStore } from '../store/uiStore';

interface Props {
  project: Project;
  issues?: ValidationIssue[];
  onChange: (project: Project) => void;
  onAdd: () => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onAddRoom: (dungeonId: string) => void;
  onDeleteRoom: (dungeonId: string, roomId: string) => void;
}

const ROOM_TYPE_OPTIONS: RoomType[] = [
  'boss_room',
  'patrol_corridor',
  'treasure_vault',
  'entrance',
  'puzzle_room',
  'safe_room',
  'custom',
];

const TRIGGER_EVENTS: TriggerEvent[] = [
  'on_entry',
  'on_all_mobs_killed',
  'on_quest_complete',
  'on_exit',
];

const TRIGGER_ACTION_TYPES: TriggerAction['type'][] = [
  'set_quest_state',
  'dialogue',
  'unlock_chest',
  'custom_command',
];

const QUEST_STATES: QuestState[] = [-1, 0, 1, 2, 3];

function BoundsEditor({
  bounds,
  onChange,
  t,
  tc,
}: {
  bounds: BoundingBox;
  onChange: (b: BoundingBox) => void;
  t: (key: string, opts?: Record<string, unknown>) => string;
  tc: (key: string) => string;
}) {
  const update = (patch: Partial<BoundingBox>) => {
    onChange(normalizeBounds({ ...bounds, ...patch }));
  };

  const vol = boundsVolume(bounds);
  const norm = normalizeBounds(bounds);

  return (
    <Field label={t('editor.bounds')} hint={t('editor.boundsVolume', { count: vol })}>
      <div className="bounds-editor">
        <div>
          <span className="bounds-corner-label">{t('editor.boundsMin')}</span>
          <div className="grid-3">
            <NumberInput
              label={tc('coords.x')}
              value={bounds.x1}
              onChange={(x1) => update({ x1 })}
            />
            <NumberInput
              label={tc('coords.y')}
              value={bounds.y1}
              onChange={(y1) => update({ y1 })}
            />
            <NumberInput
              label={tc('coords.z')}
              value={bounds.z1}
              onChange={(z1) => update({ z1 })}
            />
          </div>
        </div>
        <div>
          <span className="bounds-corner-label">{t('editor.boundsMax')}</span>
          <div className="grid-3">
            <NumberInput
              label={tc('coords.x')}
              value={bounds.x2}
              onChange={(x2) => update({ x2 })}
            />
            <NumberInput
              label={tc('coords.y')}
              value={bounds.y2}
              onChange={(y2) => update({ y2 })}
            />
            <NumberInput
              label={tc('coords.z')}
              value={bounds.z2}
              onChange={(z2) => update({ z2 })}
            />
          </div>
        </div>
      </div>
      <div className="bounds-summary">
        ({norm.x1}, {norm.y1}, {norm.z1}) → ({norm.x2}, {norm.y2}, {norm.z2})
      </div>
    </Field>
  );
}

export function DungeonsPage({
  project,
  issues = [],
  onChange,
  onAdd,
  onDuplicate,
  onDelete,
  onAddRoom,
  onDeleteRoom,
}: Props) {
  const { t } = useTranslation('dungeons');
  const { t: tc } = useTranslation('common');
  const mobOptions = useMobOptions();
  const dungeons = project.dungeons ?? [];
  const customMobs = project.customMobs ?? [];
  const dimensions = project.dimensions ?? [];
  const quests = project.quests;

  const [selectedDungeonId, setSelectedDungeonId] = useState(() => dungeons[0]?.id ?? '');
  const [selectedRoomId, setSelectedRoomId] = useState(() => dungeons[0]?.rooms[0]?.id ?? '');
  const [expandedDungeons, setExpandedDungeons] = useState<Set<string>>(
    () => new Set(dungeons[0]?.id ? [dungeons[0].id] : []),
  );
  const [tab, setTab] = useState<'spawns' | 'triggers'>('spawns');
  const dungeonsFocus = useUIStore((s) => s.dungeonsFocus);
  const setDungeonsFocus = useUIStore((s) => s.setDungeonsFocus);

  useEffect(() => {
    if (!dungeonsFocus) return;
    setSelectedDungeonId(dungeonsFocus);
    setExpandedDungeons((prev) => new Set([...prev, dungeonsFocus]));
    setDungeonsFocus(null);
  }, [dungeonsFocus, setDungeonsFocus]);

  const selectedDungeon = useMemo(
    () => dungeons.find((d) => d.id === selectedDungeonId) ?? dungeons[0],
    [dungeons, selectedDungeonId],
  );

  const selectedRoom = useMemo(() => {
    if (!selectedDungeon) return undefined;
    return selectedDungeon.rooms.find((r) => r.id === selectedRoomId) ?? selectedDungeon.rooms[0];
  }, [selectedDungeon, selectedRoomId]);

  const updateDungeon = (patch: Partial<Dungeon>) => {
    if (!selectedDungeon) return;
    onChange({
      ...project,
      dungeons: dungeons.map((d) =>
        d.id === selectedDungeon.id ? { ...d, ...patch } : d,
      ),
    });
  };

  const updateRoom = (patch: Partial<DungeonRoom>) => {
    if (!selectedDungeon || !selectedRoom) return;
    onChange({
      ...project,
      dungeons: dungeons.map((d) =>
        d.id === selectedDungeon.id
          ? {
              ...d,
              rooms: d.rooms.map((r) =>
                r.id === selectedRoom.id ? { ...r, ...patch } : r,
              ),
            }
          : d,
      ),
    });
  };

  const roomIssues = (roomId: string) =>
    issues.filter((i) => i.field?.includes(roomId) || i.dungeonRoomId === roomId);

  const questOptions = quests.map((q) => ({ value: q.name, label: q.name }));

  const dimensionOptions = useMemo(
    () => [
      { value: '', label: tc('actions.noneDash') },
      ...dimensions.map((d) => ({ value: d.id, label: d.name })),
    ],
    [dimensions, tc],
  );

  const toggleExpanded = (id: string) => {
    setExpandedDungeons((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectDungeon = (dungeonId: string) => {
    setSelectedDungeonId(dungeonId);
    setExpandedDungeons((p) => new Set(p).add(dungeonId));
    const dungeon = dungeons.find((d) => d.id === dungeonId);
    if (dungeon?.rooms[0]) setSelectedRoomId(dungeon.rooms[0].id);
  };

  const selectRoom = (dungeonId: string, roomId: string) => {
    setSelectedDungeonId(dungeonId);
    setSelectedRoomId(roomId);
    setExpandedDungeons((p) => new Set(p).add(dungeonId));
  };

  return (
    <div className="items-page">
      <h1 className="step-title">{t('title')}</h1>
      <p className="step-sub">{t('subtitle')}</p>

      <div className="items-layout">
        <aside className="items-list card">
          <div className="row-between" style={{ marginBottom: 12 }}>
            <h3 style={{ margin: 0 }}>{t('list.title', { count: dungeons.length })}</h3>
            <button type="button" className="btn small" onClick={onAdd} title={t('list.addTitle')}>
              {tc('actions.add')}
            </button>
          </div>

          {dungeons.length === 0 && <p className="muted">{t('list.empty')}</p>}

          <div className="dungeon-tree">
            {dungeons.map((dungeon) => {
              const expanded = expandedDungeons.has(dungeon.id);
              const isDungeonActive = selectedDungeon?.id === dungeon.id;
              return (
                <div
                  key={dungeon.id}
                  className={`dungeon-tree-group ${isDungeonActive ? 'active' : ''}`}
                >
                  <div className="dungeon-tree-header">
                    <button
                      type="button"
                      className="dungeon-expand"
                      onClick={() => toggleExpanded(dungeon.id)}
                      aria-expanded={expanded}
                      aria-label={expanded ? 'Collapse' : 'Expand'}
                    >
                      {expanded ? '▾' : '▸'}
                    </button>
                    <button
                      type="button"
                      className="dungeon-tree-label"
                      onClick={() => selectDungeon(dungeon.id)}
                    >
                      <span className="name">{dungeon.name || tc('actions.none')}</span>
                      <span className="tag">{dungeon.tag}</span>
                    </button>
                    <div className="row-actions">
                      <button
                        type="button"
                        className="icon-btn"
                        title={tc('actions.duplicate')}
                        onClick={() => onDuplicate(dungeon.id)}
                      >
                        {tc('actions.duplicate')}
                      </button>
                      <button
                        type="button"
                        className="icon-btn"
                        title={tc('actions.delete')}
                        onClick={() => {
                          if (window.confirm(t('list.deleteDungeonConfirm'))) onDelete(dungeon.id);
                        }}
                      >
                        {tc('actions.delete')}
                      </button>
                    </div>
                  </div>
                  {expanded && (
                    <div className="dungeon-rooms">
                      {dungeon.rooms.map((room) => {
                        const ri = roomIssues(room.id);
                        const hasError = ri.some((i) => i.level === 'error');
                        const hasWarn = ri.some((i) => i.level === 'warning');
                        const isRoomActive =
                          isDungeonActive && selectedRoom?.id === room.id;
                        return (
                          <button
                            key={room.id}
                            type="button"
                            className={`dungeon-room-item ${isRoomActive ? 'active' : ''}`}
                            onClick={() => selectRoom(dungeon.id, room.id)}
                          >
                            <span>{room.name}</span>
                            {hasError && (
                              <span className="badge error" title={tc('validation.hasErrors')}>
                                ●
                              </span>
                            )}
                            {!hasError && hasWarn && (
                              <span className="badge warning" title={tc('validation.hasWarnings')}>
                                ●
                              </span>
                            )}
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        className="btn small ghost dungeon-add-room"
                        onClick={() => {
                          selectDungeon(dungeon.id);
                          onAddRoom(dungeon.id);
                        }}
                      >
                        {t('list.addRoom')}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </aside>

        <div className="items-editor">
          {!selectedDungeon && (
            <div className="card muted">{t('editor.selectDungeon')}</div>
          )}

          {selectedDungeon && !selectedRoom && (
            <div className="card">
              <div className="row-between" style={{ marginBottom: 14 }}>
                <h3 style={{ margin: 0 }}>{selectedDungeon.name || t('editor.dungeonName')}</h3>
                <div className="row-actions">
                  <button
                    type="button"
                    className="btn small"
                    onClick={() => onDuplicate(selectedDungeon.id)}
                  >
                    {tc('actions.duplicate')}
                  </button>
                  <button
                    type="button"
                    className="btn small danger"
                    onClick={() => {
                      if (window.confirm(t('list.deleteDungeonConfirm'))) {
                        onDelete(selectedDungeon.id);
                      }
                    }}
                  >
                    {tc('actions.delete')}
                  </button>
                </div>
              </div>
              <TextInput
                label={t('editor.dungeonName')}
                value={selectedDungeon.name}
                onChange={(name) => {
                  updateDungeon({ name, tag: toIdentifier(name, selectedDungeon.tag || 'dungeon') });
                }}
              />
              <TextInput
                label={t('editor.dungeonTag')}
                value={selectedDungeon.tag}
                onChange={(tag) => updateDungeon({ tag: toIdentifier(tag, 'dungeon') })}
              />
              <TextInput
                label={t('editor.description')}
                value={selectedDungeon.description ?? ''}
                onChange={(description) => updateDungeon({ description: description || undefined })}
              />
              <Select
                label={t('editor.dimension')}
                hint={t('editor.dimensionHint')}
                value={selectedDungeon.dimensionId ?? ''}
                options={dimensionOptions}
                onChange={(dimensionId) =>
                  updateDungeon({ dimensionId: dimensionId || undefined })
                }
              />
              <p className="muted">{t('editor.selectRoom')}</p>
            </div>
          )}

          {selectedDungeon && selectedRoom && (
            <div className="card">
              <div className="row-between" style={{ marginBottom: 14 }}>
                <div>
                  <h3 style={{ margin: '0 0 4px' }}>{selectedRoom.name || t('editor.roomName')}</h3>
                  <span className="badge">{t(`roomTypes.${selectedRoom.type}`)}</span>
                </div>
                <button
                  type="button"
                  className="btn small danger"
                  onClick={() => {
                    if (window.confirm(t('list.deleteRoomConfirm'))) {
                      onDeleteRoom(selectedDungeon.id, selectedRoom.id);
                    }
                  }}
                >
                  {tc('actions.delete')}
                </button>
              </div>

              <TextInput
                label={t('editor.roomName')}
                value={selectedRoom.name}
                onChange={(name) => updateRoom({ name })}
              />

              <Select
                label={t('editor.roomType')}
                value={selectedRoom.type}
                options={ROOM_TYPE_OPTIONS.map((rt) => ({
                  value: rt,
                  label: t(`roomTypes.${rt}`),
                }))}
                onChange={(type) => updateRoom({ type: type as RoomType })}
              />

              {selectedRoom.type === 'custom' && (
                <TextInput
                  label={t('editor.customTypeLabel')}
                  value={selectedRoom.customTypeLabel ?? ''}
                  onChange={(customTypeLabel) => updateRoom({ customTypeLabel })}
                />
              )}

              <BoundsEditor
                bounds={selectedRoom.bounds}
                onChange={(bounds) => updateRoom({ bounds })}
                t={t}
                tc={tc}
              />

              <Field label={t('editor.questGate')} hint={t('editor.questGateHint')}>
                <label className="checkbox-row">
                  <input
                    type="checkbox"
                    checked={!!selectedRoom.questGate}
                    onChange={(e) =>
                      updateRoom({
                        questGate: e.target.checked
                          ? { questName: quests[0]?.name ?? '', requiredState: 1 }
                          : undefined,
                      })
                    }
                  />
                  <span>{selectedRoom.questGate ? t('editor.gateQuest') : t('editor.noGate')}</span>
                </label>
                {selectedRoom.questGate && (
                  <div className="field-row">
                    <Select
                      label={t('editor.gateQuest')}
                      value={selectedRoom.questGate.questName}
                      options={questOptions.length ? questOptions : [{ value: '', label: tc('actions.none') }]}
                      onChange={(questName) =>
                        updateRoom({
                          questGate: { ...selectedRoom.questGate!, questName },
                        })
                      }
                    />
                    <Select
                      label={t('editor.gateState')}
                      value={String(selectedRoom.questGate.requiredState)}
                      options={QUEST_STATES.map((s) => ({
                        value: String(s),
                        label: t(`questStates.${s}`),
                      }))}
                      onChange={(v) =>
                        updateRoom({
                          questGate: {
                            ...selectedRoom.questGate!,
                            requiredState: Number(v) as QuestState,
                          },
                        })
                      }
                    />
                  </div>
                )}
              </Field>

              <NumberInput
                label={t('editor.respawnCooldown')}
                value={selectedRoom.respawnCooldown ?? 0}
                min={0}
                onChange={(v) => updateRoom({ respawnCooldown: v > 0 ? v : undefined })}
              />

              <PillSelect
                value={tab}
                options={[
                  { value: 'spawns', label: t('tabs.spawns') },
                  { value: 'triggers', label: t('tabs.triggers') },
                ]}
                onChange={(v) => setTab(v as 'spawns' | 'triggers')}
              />

              {tab === 'spawns' && (
                <div className="editor-section">
                  <div className="editor-section-header">
                    <h4>{t('spawns.title')}</h4>
                    <button
                      type="button"
                      className="btn small"
                      onClick={() =>
                        updateRoom({ spawns: [...selectedRoom.spawns, createRoomSpawn()] })
                      }
                    >
                      {t('spawns.add')}
                    </button>
                  </div>
                  {selectedRoom.spawns.length === 0 && (
                    <p className="muted">{t('spawns.empty')}</p>
                  )}
                  {selectedRoom.spawns.map((spawn) => (
                    <div key={spawn.id} className="card editor-subcard">
                      <Field label={tc('mobSource.label')}>
                        <PillSelect
                          value={spawn.sourceType}
                          options={[
                            { value: 'vanilla', label: tc('mobSource.vanilla') },
                            { value: 'customMob', label: tc('mobSource.custom') },
                          ]}
                          onChange={(sourceType) =>
                            updateRoom({
                              spawns: selectedRoom.spawns.map((s) =>
                                s.id === spawn.id
                                  ? {
                                      ...s,
                                      sourceType: sourceType as 'vanilla' | 'customMob',
                                    }
                                  : s,
                              ),
                            })
                          }
                        />
                      </Field>
                      {spawn.sourceType === 'vanilla' ? (
                        <Select
                          label={tc('mobSource.selectMob')}
                          value={spawn.vanillaEntity ?? 'minecraft:zombie'}
                          options={mobOptions}
                          onChange={(vanillaEntity) =>
                            updateRoom({
                              spawns: selectedRoom.spawns.map((s) =>
                                s.id === spawn.id ? { ...s, vanillaEntity } : s,
                              ),
                            })
                          }
                        />
                      ) : (
                        <Select
                          label={tc('mobSource.custom')}
                          value={spawn.customMobId ?? ''}
                          options={
                            customMobs.length
                              ? customMobs.map((m) => ({ value: m.id, label: m.name }))
                              : [{ value: '', label: tc('mobSource.noCustomMobsShort') }]
                          }
                          onChange={(customMobId) =>
                            updateRoom({
                              spawns: selectedRoom.spawns.map((s) =>
                                s.id === spawn.id ? { ...s, customMobId } : s,
                              ),
                            })
                          }
                        />
                      )}
                      <NumberInput
                        label={t('spawns.count')}
                        value={spawn.count}
                        min={1}
                        onChange={(count) =>
                          updateRoom({
                            spawns: selectedRoom.spawns.map((s) =>
                              s.id === spawn.id ? { ...s, count: Math.max(1, count) } : s,
                            ),
                          })
                        }
                      />
                      <label className="checkbox-row">
                        <input
                          type="checkbox"
                          checked={spawn.spawnOnEntry}
                          onChange={(e) =>
                            updateRoom({
                              spawns: selectedRoom.spawns.map((s) =>
                                s.id === spawn.id ? { ...s, spawnOnEntry: e.target.checked } : s,
                              ),
                            })
                          }
                        />
                        <span>
                          {t('spawns.spawnOnEntry')} (
                          {spawn.spawnOnEntry ? t('spawns.onEntry') : t('spawns.onInit')})
                        </span>
                      </label>
                      <label className="checkbox-row">
                        <input
                          type="checkbox"
                          checked={spawn.respawn}
                          onChange={(e) =>
                            updateRoom({
                              spawns: selectedRoom.spawns.map((s) =>
                                s.id === spawn.id ? { ...s, respawn: e.target.checked } : s,
                              ),
                            })
                          }
                        />
                        <span>{t('spawns.respawn')}</span>
                      </label>
                      <div className="row-actions-end">
                        <button
                          type="button"
                          className="btn small danger"
                          onClick={() =>
                            updateRoom({
                              spawns: selectedRoom.spawns.filter((s) => s.id !== spawn.id),
                            })
                          }
                        >
                          {tc('actions.remove')}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {tab === 'triggers' && (
                <div className="editor-section">
                  <div className="editor-section-header">
                    <h4>{t('triggers.title')}</h4>
                    <button
                      type="button"
                      className="btn small"
                      onClick={() =>
                        updateRoom({
                          triggers: [...selectedRoom.triggers, createRoomTrigger()],
                        })
                      }
                    >
                      {t('triggers.add')}
                    </button>
                  </div>
                  {selectedRoom.triggers.length === 0 && (
                    <p className="muted">{t('triggers.empty')}</p>
                  )}
                  {selectedRoom.triggers.map((trigger) => (
                    <div key={trigger.id} className="card editor-subcard">
                      <Select
                        label={t('triggers.event')}
                        value={trigger.event}
                        options={TRIGGER_EVENTS.map((e) => ({
                          value: e,
                          label: t(`triggerEvents.${e}`),
                        }))}
                        onChange={(event) =>
                          updateRoom({
                            triggers: selectedRoom.triggers.map((tr) =>
                              tr.id === trigger.id ? { ...tr, event: event as TriggerEvent } : tr,
                            ),
                          })
                        }
                      />
                      <Select
                        label={t('triggers.action')}
                        value={trigger.action.type}
                        options={TRIGGER_ACTION_TYPES.map((a) => ({
                          value: a,
                          label: t(`triggerActions.${a}`),
                        }))}
                        onChange={(type) => {
                          let action: TriggerAction;
                          switch (type) {
                            case 'set_quest_state':
                              action = { type, questName: quests[0]?.name ?? '', state: 1 };
                              break;
                            case 'dialogue':
                              action = { type, message: '', targets: 'room' };
                              break;
                            case 'unlock_chest':
                              action = { type, x: 0, y: 64, z: 0 };
                              break;
                            default:
                              action = { type: 'custom_command', command: '' };
                          }
                          updateRoom({
                            triggers: selectedRoom.triggers.map((tr) =>
                              tr.id === trigger.id ? { ...tr, action } : tr,
                            ),
                          });
                        }}
                      />
                      {trigger.action.type === 'set_quest_state' && (
                        <>
                          <Select
                            label={t('triggers.questName')}
                            value={trigger.action.questName}
                            options={questOptions}
                            onChange={(questName) =>
                              updateRoom({
                                triggers: selectedRoom.triggers.map((tr) =>
                                  tr.id === trigger.id && tr.action.type === 'set_quest_state'
                                    ? { ...tr, action: { ...tr.action, questName } }
                                    : tr,
                                ),
                              })
                            }
                          />
                          <Select
                            label={t('triggers.state')}
                            value={String(trigger.action.state)}
                            options={QUEST_STATES.map((s) => ({
                              value: String(s),
                              label: t(`questStates.${s}`),
                            }))}
                            onChange={(v) =>
                              updateRoom({
                                triggers: selectedRoom.triggers.map((tr) =>
                                  tr.id === trigger.id && tr.action.type === 'set_quest_state'
                                    ? {
                                        ...tr,
                                        action: {
                                          ...tr.action,
                                          state: Number(v) as QuestState,
                                        },
                                      }
                                    : tr,
                                ),
                              })
                            }
                          />
                        </>
                      )}
                      {trigger.action.type === 'dialogue' && (
                        <>
                          <TextInput
                            label={t('triggers.message')}
                            value={trigger.action.message}
                            onChange={(message) =>
                              updateRoom({
                                triggers: selectedRoom.triggers.map((tr) =>
                                  tr.id === trigger.id && tr.action.type === 'dialogue'
                                    ? { ...tr, action: { ...tr.action, message } }
                                    : tr,
                                ),
                              })
                            }
                          />
                          <Select
                            label={t('triggers.targets')}
                            value={trigger.action.targets}
                            options={[
                              { value: 'room', label: t('triggers.targetsRoom') },
                              { value: 'all', label: t('triggers.targetsAll') },
                            ]}
                            onChange={(targets) =>
                              updateRoom({
                                triggers: selectedRoom.triggers.map((tr) =>
                                  tr.id === trigger.id && tr.action.type === 'dialogue'
                                    ? {
                                        ...tr,
                                        action: {
                                          ...tr.action,
                                          targets: targets as 'all' | 'room',
                                        },
                                      }
                                    : tr,
                                ),
                              })
                            }
                          />
                        </>
                      )}
                      {trigger.action.type === 'unlock_chest' && (
                        <div className="field-row-3">
                          <NumberInput
                            label={tc('coords.x')}
                            value={trigger.action.x}
                            onChange={(x) =>
                              updateRoom({
                                triggers: selectedRoom.triggers.map((tr) =>
                                  tr.id === trigger.id && tr.action.type === 'unlock_chest'
                                    ? { ...tr, action: { ...tr.action, x } }
                                    : tr,
                                ),
                              })
                            }
                          />
                          <NumberInput
                            label={tc('coords.y')}
                            value={trigger.action.y}
                            onChange={(y) =>
                              updateRoom({
                                triggers: selectedRoom.triggers.map((tr) =>
                                  tr.id === trigger.id && tr.action.type === 'unlock_chest'
                                    ? { ...tr, action: { ...tr.action, y } }
                                    : tr,
                                ),
                              })
                            }
                          />
                          <NumberInput
                            label={tc('coords.z')}
                            value={trigger.action.z}
                            onChange={(z) =>
                              updateRoom({
                                triggers: selectedRoom.triggers.map((tr) =>
                                  tr.id === trigger.id && tr.action.type === 'unlock_chest'
                                    ? { ...tr, action: { ...tr.action, z } }
                                    : tr,
                                ),
                              })
                            }
                          />
                        </div>
                      )}
                      {trigger.action.type === 'custom_command' && (
                        <TextInput
                          label={t('triggers.command')}
                          value={trigger.action.command}
                          hint="{player}"
                          onChange={(command) =>
                            updateRoom({
                              triggers: selectedRoom.triggers.map((tr) =>
                                tr.id === trigger.id && tr.action.type === 'custom_command'
                                  ? { ...tr, action: { ...tr.action, command } }
                                  : tr,
                              ),
                            })
                          }
                        />
                      )}
                      <label className="checkbox-row">
                        <input
                          type="checkbox"
                          checked={trigger.fireOnce}
                          onChange={(e) =>
                            updateRoom({
                              triggers: selectedRoom.triggers.map((tr) =>
                                tr.id === trigger.id ? { ...tr, fireOnce: e.target.checked } : tr,
                              ),
                            })
                          }
                        />
                        <span>{t('triggers.fireOnce')}</span>
                      </label>
                      <div className="row-actions-end">
                        <button
                          type="button"
                          className="btn small danger"
                          onClick={() =>
                            updateRoom({
                              triggers: selectedRoom.triggers.filter((tr) => tr.id !== trigger.id),
                            })
                          }
                        >
                          {tc('actions.remove')}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
