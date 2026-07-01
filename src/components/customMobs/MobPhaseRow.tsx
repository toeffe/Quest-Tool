import { useTranslation } from 'react-i18next';
import { supportsCustomSkin } from '../../data/mobVariantRegistry';
import { BOSS_BAR_COLOR_OPTIONS, EQUIPMENT_SLOT_OPTIONS } from '../../generator/customMobs';
import type {
  CustomMobEquipmentSlot,
  CustomMobPhase,
  CustomMobPhaseEffect,
} from '../../types/customMob';
import { asRequiredNumber, Field, NumberInput, PillSelect, TextInput } from '../ui/Field';
import { SkinUploadField } from '../ui/SkinUploadField';

interface Props {
  phase: CustomMobPhase;
  index: number;
  isFirst: boolean;
  baseEntity: string;
  namespace: string;
  mobTag: string;
  onChange: (patch: Partial<CustomMobPhase>) => void;
  onRemove: () => void;
}

export function MobPhaseRow({
  phase,
  index,
  isFirst,
  baseEntity,
  namespace,
  mobTag,
  onChange,
  onRemove,
}: Props) {
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
            onChange={asRequiredNumber((atHealthPercent) =>
              onChange({ atHealthPercent: Math.min(99, Math.max(1, atHealthPercent)) }),
            )}
          />
        )}
      </div>

      {!isFirst && (
        <>
          <p className="hint" style={{ margin: '12px 0' }}>
            {t('phases.inheritHint')}
          </p>
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
              value={phase.damage}
              onChange={(damage) =>
                onChange({ damage: damage != null && damage > 0 ? damage : undefined })
              }
            />
            <Field label={t('phases.glowing')}>
              <PillSelect
                value={phase.glowing === true ? 'yes' : phase.glowing === false ? 'no' : 'inherit'}
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
          <NumberInput
            label={t('editor.scale')}
            hint={t('phases.scaleHint')}
            min={0.1}
            step={0.1}
            placeholder="—"
            value={phase.scale}
            onChange={(scale) =>
              onChange({ scale: scale != null && scale > 0 ? scale : undefined })
            }
          />
          {supportsCustomSkin(baseEntity) && (
            <SkinUploadField
              baseEntity={baseEntity}
              namespace={namespace}
              mobTag={mobTag}
              value={phase.skinTexture}
              onChange={(skinTexture) => onChange({ skinTexture })}
            />
          )}
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
                allowClear
                value={effect.duration ?? 0}
                onChange={(duration) => {
                  const effects = (phase.effects ?? []).map((ef, idx) =>
                    idx === ei
                      ? { ...ef, duration: duration != null && duration > 0 ? duration : undefined }
                      : ef,
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
          <p className="hint" style={{ marginTop: 0 }}>
            {t('phases.equipmentOverrideHint')}
          </p>
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
