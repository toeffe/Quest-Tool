import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type Project, type ZoneDrop } from '../types/quest';
import { type CustomItem } from '../types/item';
import {
  type CustomMob,
  type CustomMobEquipmentSlot,
  type CustomMobPhase,
  type CustomMobPhaseEffect,
} from '../types/customMob';
import { createCustomMobPhase } from '../types/factory';
import { toIdentifier } from '../types/ids';
import { useMobOptions } from '../data/mobs';
import { summonCustomMob, EQUIPMENT_SLOT_OPTIONS, BOSS_BAR_COLOR_OPTIONS } from '../generator/customMobs';
import { VariantFields } from './steps/VariantFields';
import {
  TextInput,
  NumberInput,
  Field,
  DataListInput,
  PillSelect,
} from './ui/Field';
import { CopyButton } from './ui/CopyButton';

interface Props {
  project: Project;
  onChange: (project: Project) => void;
  onAdd: () => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}

function defaultZoneDrop(): ZoneDrop {
  return { target: 'minecraft:rotten_flesh', amount: 1, chance: 100 };
}

function zoneDropSource(drop: ZoneDrop): 'vanilla' | 'custom' {
  return drop.customItemId ? 'custom' : 'vanilla';
}

export function CustomMobsPage({ project, onChange, onAdd, onDuplicate, onDelete }: Props) {
  const { t } = useTranslation('customMobs');
  const { t: tc } = useTranslation('common');
  const mobOptions = useMobOptions();
  const mobs = project.customMobs ?? [];
  const customItems = project.customItems ?? [];
  const [selectedId, setSelectedId] = useState<string>(() => mobs[0]?.id ?? '');

  const selected = useMemo(
    () => mobs.find((m) => m.id === selectedId) ?? mobs[0],
    [mobs, selectedId],
  );

  const updateMob = (patch: Partial<CustomMob>) => {
    if (!selected) return;
    onChange({
      ...project,
      customMobs: mobs.map((m) => (m.id === selected.id ? { ...m, ...patch } : m)),
    });
  };

  const previewCommand = selected ? summonCustomMob(selected, '~', '~1', '~') : '';

  const equipmentSlotOptions = EQUIPMENT_SLOT_OPTIONS;

  return (
    <div className="items-page">
      <h1 className="step-title">{t('title')}</h1>
      <p className="step-sub">{t('subtitle')}</p>

      <div className="items-layout">
        <aside className="items-list card">
          <div className="row-between" style={{ marginBottom: 12 }}>
            <h3 style={{ margin: 0 }}>{t('list.title', { count: mobs.length })}</h3>
            <div className="row-actions">
              <button className="btn small" onClick={onAdd} title={t('list.addTitle')}>
                {tc('actions.add')}
              </button>
            </div>
          </div>

          {mobs.length === 0 && <p className="muted">{t('list.empty')}</p>}

          {mobs.map((mob) => (
            <div
              key={mob.id}
              className={`quest-item ${mob.id === selected?.id ? 'active' : ''}`}
              onClick={() => setSelectedId(mob.id)}
            >
              <div>
                <div className="name">{mob.name || t('list.untitled')}</div>
                <div className="type">{mob.tag}</div>
              </div>
              <div className="row-actions">
                <button
                  className="icon-btn"
                  title={t('list.copy')}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDuplicate(mob.id);
                  }}
                >
                  {t('list.copy')}
                </button>
                <button
                  className="icon-btn"
                  title={t('list.delete')}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(mob.id);
                  }}
                >
                  {t('list.delete')}
                </button>
              </div>
            </div>
          ))}
        </aside>

        <div className="items-editor">
          {!selected && <div className="card muted">{t('list.selectEmpty')}</div>}

          {selected && (
            <>
              <div className="card" style={{ marginBottom: 16 }}>
                <div className="grid-2">
                  <TextInput
                    label={t('editor.editorName')}
                    hint={t('editor.editorNameHint')}
                    value={selected.name}
                    onChange={(name) =>
                      updateMob({
                        name,
                        tag: toIdentifier(name, selected.tag),
                        displayName:
                          selected.displayName === selected.name ? name : selected.displayName,
                      })
                    }
                  />
                  <TextInput
                    label={t('editor.identityTag')}
                    hint={t('editor.identityTagHint')}
                    value={selected.tag}
                    onChange={(tag) => updateMob({ tag: toIdentifier(tag, 'mob') })}
                  />
                </div>

                <DataListInput
                  label={t('editor.baseEntity')}
                  hint={t('editor.baseEntityHint')}
                  value={selected.baseEntity}
                  onChange={(baseEntity) => updateMob({ baseEntity })}
                  options={mobOptions}
                  listId="custom-mob-entity-list"
                  placeholder={t('editor.baseEntityPlaceholder')}
                />
                <p className="hint" style={{ marginTop: -8, marginBottom: 12 }}>
                  {t('editor.baseEntityNote')}
                </p>

                <VariantFields
                  entityType={selected.baseEntity}
                  variants={selected.variants}
                  onChange={(variants) => updateMob({ variants })}
                />

                <TextInput
                  label={t('editor.displayName')}
                  hint={t('editor.displayNameHint')}
                  value={selected.displayName}
                  onChange={(displayName) => updateMob({ displayName })}
                />

                <div className="grid-2">
                  <NumberInput
                    label={t('editor.health')}
                    hint={t('editor.healthHint')}
                    min={1}
                    value={selected.health ?? 0}
                    onChange={(health) =>
                      updateMob({ health: health > 0 ? health : undefined })
                    }
                  />
                  <NumberInput
                    label={t('editor.damage')}
                    hint={t('editor.damageHint')}
                    min={0}
                    value={selected.damage ?? 0}
                    onChange={(damage) =>
                      updateMob({ damage: damage > 0 ? damage : undefined })
                    }
                  />
                </div>

                <Field label={t('editor.glowing')} hint={t('editor.glowingHint')}>
                  <PillSelect
                    value={selected.glowing ? 'yes' : 'no'}
                    options={[
                      { value: 'no', label: tc('actions.no') },
                      { value: 'yes', label: tc('actions.yes') },
                    ]}
                    onChange={(v) => updateMob({ glowing: v === 'yes' })}
                  />
                </Field>

                <Field label={t('editor.bossBar')} hint={t('editor.bossBarHint')}>
                  <PillSelect
                    value={selected.bossBar ? 'yes' : 'no'}
                    options={[
                      { value: 'no', label: tc('actions.no') },
                      { value: 'yes', label: tc('actions.yes') },
                    ]}
                    onChange={(v) => updateMob({ bossBar: v === 'yes' })}
                  />
                </Field>
              </div>

              <div className="card" style={{ marginBottom: 16 }}>
                <h3 style={{ marginTop: 0 }}>{t('phases.title')}</h3>
                <p className="hint" style={{ marginTop: 0 }}>{t('phases.hint')}</p>
                <div className="row-between" style={{ marginBottom: 10 }}>
                  <span />
                  <button
                    className="btn small"
                    type="button"
                    onClick={() => {
                      const existing = selected.phases ?? [];
                      if (existing.length === 0) {
                        updateMob({
                          phases: [
                            { ...createCustomMobPhase('Phase 1'), name: 'Phase 1' },
                            {
                              ...createCustomMobPhase('Phase 2'),
                              name: 'Phase 2',
                              atHealthPercent: 50,
                            },
                          ],
                        });
                        return;
                      }
                      const lastThreshold =
                        existing[existing.length - 1].atHealthPercent ?? 25;
                      const nextThreshold = Math.max(1, lastThreshold - 25);
                      updateMob({
                        phases: [
                          ...existing,
                          {
                            ...createCustomMobPhase(`Phase ${existing.length + 1}`),
                            name: `Phase ${existing.length + 1}`,
                            atHealthPercent: nextThreshold,
                          },
                        ],
                      });
                    }}
                  >
                    {t('phases.addPhase')}
                  </button>
                </div>
                {(selected.phases ?? []).length === 0 && (
                  <p className="muted" style={{ fontSize: 13 }}>{t('phases.empty')}</p>
                )}
                {(selected.phases ?? []).map((phase, pi) => (
                  <PhaseRow
                    key={phase.id}
                    phase={phase}
                    index={pi}
                    isFirst={pi === 0}
                    onChange={(patch) => {
                      const phases = (selected.phases ?? []).map((p, idx) =>
                        idx === pi ? { ...p, ...patch } : p,
                      );
                      updateMob({ phases });
                    }}
                    onRemove={() => {
                      const phases = (selected.phases ?? []).filter((_, idx) => idx !== pi);
                      updateMob({ phases: phases.length ? phases : undefined });
                    }}
                  />
                ))}
              </div>

              <div className="card" style={{ marginBottom: 16 }}>
                <h3 style={{ marginTop: 0 }}>{t('equipment.title')}</h3>
                <p className="hint" style={{ marginTop: 0 }}>{t('equipment.hint')}</p>
                <div className="row-between" style={{ marginBottom: 10 }}>
                  <span />
                  <button
                    className="btn small"
                    type="button"
                    onClick={() =>
                      updateMob({
                        equipment: [
                          ...(selected.equipment ?? []),
                          { slot: 'mainhand' as CustomMobEquipmentSlot, item: 'minecraft:iron_sword' },
                        ],
                      })
                    }
                  >
                    {t('equipment.add')}
                  </button>
                </div>
                {(selected.equipment ?? []).length === 0 && (
                  <p className="muted" style={{ fontSize: 13 }}>{t('equipment.empty')}</p>
                )}
                {(selected.equipment ?? []).map((entry, i) => (
                  <div key={i} className="list-row" style={{ marginBottom: 8 }}>
                    <Field label={t('equipment.slot')}>
                      <select
                        value={entry.slot}
                        onChange={(e) => {
                          const equipment = (selected.equipment ?? []).map((eq, idx) =>
                            idx === i ? { ...eq, slot: e.target.value as CustomMobEquipmentSlot } : eq,
                          );
                          updateMob({ equipment });
                        }}
                      >
                        {equipmentSlotOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <TextInput
                      label={t('equipment.item')}
                      value={entry.item}
                      onChange={(item) => {
                        const equipment = (selected.equipment ?? []).map((eq, idx) =>
                          idx === i ? { ...eq, item } : eq,
                        );
                        updateMob({ equipment });
                      }}
                      placeholder={t('equipment.itemPlaceholder')}
                    />
                    <button
                      className="btn small danger"
                      type="button"
                      onClick={() => {
                        const equipment = (selected.equipment ?? []).filter((_, idx) => idx !== i);
                        updateMob({ equipment });
                      }}
                    >
                      {tc('actions.remove')}
                    </button>
                  </div>
                ))}
              </div>

              <div className="card" style={{ marginBottom: 16 }}>
                <h3 style={{ marginTop: 0 }}>{t('drops.title')}</h3>
                <p className="hint" style={{ marginTop: 0 }}>{t('drops.hint')}</p>
                <div className="row-between" style={{ marginBottom: 10 }}>
                  <span />
                  <button
                    className="btn small"
                    type="button"
                    onClick={() =>
                      updateMob({ drops: [...(selected.drops ?? []), defaultZoneDrop()] })
                    }
                  >
                    {t('drops.addDrop')}
                  </button>
                </div>
                {(selected.drops ?? []).length === 0 && (
                  <p className="muted" style={{ fontSize: 13 }}>{t('drops.empty')}</p>
                )}
                {(selected.drops ?? []).map((drop, di) => (
                  <DropRow
                    key={di}
                    drop={drop}
                    customItems={customItems}
                    onChange={(patch) => {
                      const drops = (selected.drops ?? []).map((d, idx) =>
                        idx === di ? { ...d, ...patch } : d,
                      );
                      updateMob({ drops });
                    }}
                    onRemove={() => {
                      const drops = (selected.drops ?? []).filter((_, idx) => idx !== di);
                      updateMob({ drops });
                    }}
                  />
                ))}
              </div>

              {previewCommand && (
                <div className="card">
                  <Field label={t('editor.previewCommand')} hint={t('editor.previewCommandHint')}>
                    <div className="cmd-row">
                      <code className="cmd-code">{previewCommand}</code>
                      <CopyButton value={previewCommand} />
                    </div>
                  </Field>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function PhaseRow({
  phase,
  index,
  isFirst,
  onChange,
  onRemove,
}: {
  phase: CustomMobPhase;
  index: number;
  isFirst: boolean;
  onChange: (patch: Partial<CustomMobPhase>) => void;
  onRemove: () => void;
}) {
  const { t } = useTranslation('customMobs');
  const { t: tc } = useTranslation('common');

  return (
    <div className="card" style={{ background: 'var(--bg)', marginBottom: 12 }}>
      <div className="row-between" style={{ marginBottom: 10 }}>
        <strong>{t('phases.phaseLabel', { index: index + 1 })}</strong>
        {!isFirst && (
          <button className="btn small danger" type="button" onClick={onRemove}>
            {tc('actions.remove')}
          </button>
        )}
      </div>

      <div className="field-row">
        <TextInput
          label={t('phases.phaseName')}
          hint={t('phases.phaseNameHint')}
          value={phase.name}
          onChange={(name) => onChange({ name })}
        />
        {isFirst ? (
          <Field label={t('phases.atHealthPercent')} hint={t('phases.atHealthPercentHint')}>
            <input readOnly disabled value="100%" aria-readonly />
          </Field>
        ) : (
          <NumberInput
            label={t('phases.atHealthPercent')}
            hint={t('phases.atHealthPercentHint')}
            min={1}
            value={phase.atHealthPercent ?? 50}
            onChange={(atHealthPercent) =>
              onChange({ atHealthPercent: Math.min(99, Math.max(1, atHealthPercent)) })
            }
          />
        )}
      </div>

      {!isFirst && (
        <>
          <p className="hint" style={{ margin: '12px 0' }}>{t('phases.inheritHint')}</p>
          <TextInput
            label={t('phases.displayName')}
            hint={t('phases.displayNameHint')}
            value={phase.displayName ?? ''}
            onChange={(displayName) =>
              onChange({ displayName: displayName.trim() ? displayName : undefined })
            }
          />
          <div className="field-row">
            <NumberInput
              label={t('phases.damage')}
              hint={t('phases.damageHint')}
              min={0}
              value={phase.damage ?? 0}
              onChange={(damage) =>
                onChange({ damage: damage > 0 ? damage : undefined })
              }
            />
            <Field label={t('phases.glowing')}>
              <PillSelect
                value={
                  phase.glowing === true ? 'yes' : phase.glowing === false ? 'no' : 'inherit'
                }
                options={[
                  { value: 'inherit', label: '—' },
                  { value: 'no', label: tc('actions.no') },
                  { value: 'yes', label: tc('actions.yes') },
                ]}
                onChange={(v) =>
                  onChange({
                    glowing: v === 'inherit' ? undefined : v === 'yes',
                  })
                }
              />
            </Field>
          </div>
          <Field label={t('phases.bossBarColor')}>
            <select
              value={phase.bossBarColor ?? ''}
              onChange={(e) =>
                onChange({
                  bossBarColor: e.target.value
                    ? (e.target.value as CustomMobPhase['bossBarColor'])
                    : undefined,
                })
              }
            >
              <option value="">{t('phases.bossBarColorDefault')}</option>
              {BOSS_BAR_COLOR_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </Field>
          <TextInput
            label={t('phases.announceMessage')}
            hint={t('phases.announceMessageHint')}
            value={phase.announceMessage ?? ''}
            placeholder={t('phases.announcePlaceholder')}
            onChange={(announceMessage) =>
              onChange({
                announceMessage: announceMessage.trim() ? announceMessage : undefined,
              })
            }
          />

          <h4 style={{ marginBottom: 8 }}>{t('phases.effects')}</h4>
          {(phase.effects ?? []).map((effect, ei) => (
            <div key={ei} className="list-row" style={{ marginBottom: 8 }}>
              <TextInput
                label={t('phases.effectId')}
                value={effect.effectId}
                placeholder={t('phases.effectPlaceholder')}
                onChange={(effectId) => {
                  const effects = (phase.effects ?? []).map((ef, idx) =>
                    idx === ei ? { ...ef, effectId } : ef,
                  );
                  onChange({ effects });
                }}
              />
              <NumberInput
                label={t('phases.amplifier')}
                min={0}
                value={effect.amplifier ?? 0}
                onChange={(amplifier) => {
                  const effects = (phase.effects ?? []).map((ef, idx) =>
                    idx === ei ? { ...ef, amplifier } : ef,
                  );
                  onChange({ effects });
                }}
              />
              <NumberInput
                label={t('phases.duration')}
                hint={t('phases.durationHint')}
                min={0}
                value={effect.duration ?? 0}
                onChange={(duration) => {
                  const effects = (phase.effects ?? []).map((ef, idx) =>
                    idx === ei ? { ...ef, duration: duration > 0 ? duration : undefined } : ef,
                  );
                  onChange({ effects });
                }}
              />
              <button
                className="btn small danger"
                type="button"
                onClick={() => {
                  const effects = (phase.effects ?? []).filter((_, idx) => idx !== ei);
                  onChange({ effects: effects.length ? effects : undefined });
                }}
              >
                {tc('actions.remove')}
              </button>
            </div>
          ))}
          <button
            className="btn small"
            type="button"
            style={{ marginBottom: 12 }}
            onClick={() =>
              onChange({
                effects: [
                  ...(phase.effects ?? []),
                  {
                    effectId: 'minecraft:strength',
                    amplifier: 0,
                    duration: 0,
                  } satisfies CustomMobPhaseEffect,
                ],
              })
            }
          >
            {t('phases.addEffect')}
          </button>

          <h4 style={{ marginBottom: 8 }}>{t('phases.equipmentOverride')}</h4>
          <p className="hint" style={{ marginTop: 0 }}>{t('phases.equipmentOverrideHint')}</p>
          {(phase.equipment ?? []).map((entry, ei) => (
            <div key={ei} className="list-row" style={{ marginBottom: 8 }}>
              <Field label={t('equipment.slot')}>
                <select
                  value={entry.slot}
                  onChange={(e) => {
                    const equipment = (phase.equipment ?? []).map((eq, idx) =>
                      idx === ei ? { ...eq, slot: e.target.value as CustomMobEquipmentSlot } : eq,
                    );
                    onChange({ equipment });
                  }}
                >
                  {EQUIPMENT_SLOT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </Field>
              <TextInput
                label={t('equipment.item')}
                value={entry.item}
                onChange={(item) => {
                  const equipment = (phase.equipment ?? []).map((eq, idx) =>
                    idx === ei ? { ...eq, item } : eq,
                  );
                  onChange({ equipment });
                }}
                placeholder={t('equipment.itemPlaceholder')}
              />
              <button
                className="btn small danger"
                type="button"
                onClick={() => {
                  const equipment = (phase.equipment ?? []).filter((_, idx) => idx !== ei);
                  onChange({ equipment: equipment.length ? equipment : undefined });
                }}
              >
                {tc('actions.remove')}
              </button>
            </div>
          ))}
          <button
            className="btn small"
            type="button"
            onClick={() =>
              onChange({
                equipment: [
                  ...(phase.equipment ?? []),
                  { slot: 'mainhand' as CustomMobEquipmentSlot, item: 'minecraft:netherite_sword' },
                ],
              })
            }
          >
            {t('equipment.add')}
          </button>
        </>
      )}
    </div>
  );
}

function DropRow({
  drop,
  customItems,
  onChange,
  onRemove,
}: {
  drop: ZoneDrop;
  customItems: CustomItem[];
  onChange: (patch: Partial<ZoneDrop>) => void;
  onRemove: () => void;
}) {
  const { t } = useTranslation('editor');
  const { t: tc } = useTranslation('common');
  const source = zoneDropSource(drop);

  return (
    <div className="card" style={{ background: 'var(--bg)', marginBottom: 10 }}>
      <div className="list-row">
        <div className="field" style={{ flex: 2 }}>
          <label>{tc('itemSource.label')}</label>
          <PillSelect
            value={source}
            options={[
              { value: 'vanilla', label: tc('itemSource.vanilla') },
              { value: 'custom', label: tc('itemSource.custom') },
            ]}
            onChange={(v) => {
              if (v === 'custom') {
                const first = customItems[0];
                onChange({ customItemId: first?.id, target: undefined });
              } else {
                onChange({ target: drop.target ?? 'minecraft:rotten_flesh', customItemId: undefined });
              }
            }}
          />
        </div>
        {source === 'vanilla' ? (
          <div className="field" style={{ flex: 2 }}>
            <label>{t('quest.itemId')}</label>
            <input
              value={drop.target ?? ''}
              placeholder={t('spawnZone.fleshPlaceholder')}
              onChange={(e) => onChange({ target: e.target.value })}
            />
          </div>
        ) : customItems.length === 0 ? (
          <div className="field" style={{ flex: 2 }}>
            <label>{tc('itemSource.custom')}</label>
            <div className="hint">{tc('itemSource.noCustomItemsShort')}</div>
          </div>
        ) : (
          <div className="field" style={{ flex: 2 }}>
            <label>{tc('itemSource.custom')}</label>
            <select
              value={drop.customItemId ?? ''}
              onChange={(e) =>
                onChange({ customItemId: e.target.value, target: undefined })
              }
            >
              {!drop.customItemId && <option value="">{tc('actions.selectItem')}</option>}
              {customItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.displayName})
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="field" style={{ maxWidth: 100 }}>
          <label>{t('rewards.amount')}</label>
          <input
            type="number"
            min={1}
            value={drop.amount ?? 1}
            onChange={(e) => onChange({ amount: Number(e.target.value) })}
          />
        </div>
        <div className="field" style={{ maxWidth: 100 }}>
          <label>{t('spawnZone.chancePercent')}</label>
          <input
            type="number"
            min={1}
            max={100}
            value={drop.chance ?? 100}
            onChange={(e) => onChange({ chance: Number(e.target.value) })}
          />
        </div>
        <button className="btn small danger" type="button" onClick={onRemove}>
          {tc('actions.remove')}
        </button>
      </div>
    </div>
  );
}
