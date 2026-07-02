import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMobOptions } from '../data/mobs';
import { EQUIPMENT_SLOT_OPTIONS, summonCustomMob } from '../generator/customMobs';
import { useEntityClipboard } from '../hooks/useEntityClipboard';
import type { CustomMob, CustomMobEquipmentSlot } from '../types/customMob';
import { createCustomMobPhase } from '../types/factory';
import { toIdentifier } from '../types/ids';
import type { Project } from '../types/quest';
import { MobDropRow } from './customMobs/MobDropRow';
import { MobPhaseRow } from './customMobs/MobPhaseRow';
import { defaultZoneDrop } from './customMobs/mobDropHelpers';
import { VariantFields } from './steps/VariantFields';
import { CopyButton } from './ui/CopyButton';
import { DataListInput, Field, NumberInput, PillSelect, TextInput } from './ui/Field';
import { PageHeader } from './ui/PageHeader';
import { SectionHeading } from './ui/SectionHeading';
import { SkinUploadField } from './ui/SkinUploadField';

interface Props {
  project: Project;
  onChange: (project: Project) => void;
  onAdd: () => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}

export function CustomMobsPage({ project, onChange, onAdd, onDuplicate, onDelete }: Props) {
  const { t } = useTranslation('customMobs');
  const { t: tc } = useTranslation('common');
  const { copyEntity, pasteEntity } = useEntityClipboard();
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

  const datapackNs = toIdentifier(project.namespace || project.name, 'questpack');

  const previewCommand = selected
    ? summonCustomMob(selected, '~', '~1', '~', {
        namespace: datapackNs,
      })
    : '';

  const equipmentSlotOptions = EQUIPMENT_SLOT_OPTIONS;

  return (
    <div className="items-page">
      <PageHeader title={t('title')} lead={t('subtitle')} hint={t('subtitleHint')} />

      <div className="items-layout">
        <aside className="items-list card">
          <div className="row-between" style={{ marginBottom: 12 }}>
            <h3 style={{ margin: 0 }}>{t('list.title', { count: mobs.length })}</h3>
            <div className="row-actions">
              <button
                className="btn small ghost"
                title={tc('clipboard.paste')}
                onClick={async () => {
                  const result = await pasteEntity();
                  if (result?.kind === 'customMob') setSelectedId(result.id);
                }}
              >
                {tc('clipboard.paste')}
              </button>
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
                  title={tc('clipboard.copy')}
                  onClick={(e) => {
                    e.stopPropagation();
                    void copyEntity('customMob', mob.id);
                  }}
                >
                  {tc('actions.copy')}
                </button>
                <button
                  className="icon-btn"
                  title={t('list.duplicate')}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDuplicate(mob.id);
                  }}
                >
                  {t('list.duplicate')}
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

                <VariantFields
                  entityType={selected.baseEntity}
                  variants={selected.variants}
                  onChange={(variants) => updateMob({ variants })}
                />

                <SkinUploadField
                  baseEntity={selected.baseEntity}
                  namespace={datapackNs}
                  mobTag={selected.tag}
                  value={selected.skinTexture}
                  onChange={(skinTexture) => updateMob({ skinTexture })}
                />

                <NumberInput
                  label={t('editor.scale')}
                  hint={t('editor.scaleHint')}
                  min={0.1}
                  step={0.1}
                  placeholder="1"
                  value={selected.scale}
                  onChange={(scale) =>
                    updateMob({ scale: scale != null && scale > 0 ? scale : undefined })
                  }
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
                    allowClear
                    value={selected.health ?? 0}
                    onChange={(health) =>
                      updateMob({ health: health != null && health > 0 ? health : undefined })
                    }
                  />
                  <NumberInput
                    label={t('editor.damage')}
                    hint={t('editor.damageHint')}
                    min={0}
                    allowClear
                    value={selected.damage ?? 0}
                    onChange={(damage) =>
                      updateMob({ damage: damage != null && damage > 0 ? damage : undefined })
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
                <SectionHeading
                  title={t('phases.title')}
                  hint={t('phases.hint')}
                  actions={
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
                        const lastThreshold = existing[existing.length - 1].atHealthPercent ?? 25;
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
                  }
                />
                {(selected.phases ?? []).length === 0 && (
                  <p className="muted" style={{ fontSize: 13 }}>
                    {t('phases.empty')}
                  </p>
                )}
                {(selected.phases ?? []).map((phase, pi) => (
                  <MobPhaseRow
                    key={phase.id}
                    phase={phase}
                    index={pi}
                    isFirst={pi === 0}
                    baseEntity={selected.baseEntity}
                    namespace={datapackNs}
                    mobTag={selected.tag}
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
                <SectionHeading
                  title={t('equipment.title')}
                  hint={t('equipment.hint')}
                  actions={
                    <button
                      className="btn small"
                      type="button"
                      onClick={() =>
                        updateMob({
                          equipment: [
                            ...(selected.equipment ?? []),
                            {
                              slot: 'mainhand' as CustomMobEquipmentSlot,
                              item: 'minecraft:iron_sword',
                            },
                          ],
                        })
                      }
                    >
                      {t('equipment.add')}
                    </button>
                  }
                />
                {(selected.equipment ?? []).length === 0 && (
                  <p className="muted" style={{ fontSize: 13 }}>
                    {t('equipment.empty')}
                  </p>
                )}
                {(selected.equipment ?? []).map((entry, i) => (
                  <div key={i} className="list-row" style={{ marginBottom: 8 }}>
                    <Field label={t('equipment.slot')}>
                      <select
                        value={entry.slot}
                        onChange={(e) => {
                          const equipment = (selected.equipment ?? []).map((eq, idx) =>
                            idx === i
                              ? { ...eq, slot: e.target.value as CustomMobEquipmentSlot }
                              : eq,
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
                <SectionHeading
                  title={t('drops.title')}
                  hint={t('drops.hint')}
                  actions={
                    <button
                      className="btn small"
                      type="button"
                      onClick={() =>
                        updateMob({ drops: [...(selected.drops ?? []), defaultZoneDrop()] })
                      }
                    >
                      {t('drops.addDrop')}
                    </button>
                  }
                />
                {(selected.drops ?? []).length === 0 && (
                  <p className="muted" style={{ fontSize: 13 }}>
                    {t('drops.empty')}
                  </p>
                )}
                {(selected.drops ?? []).map((drop, di) => (
                  <MobDropRow
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
