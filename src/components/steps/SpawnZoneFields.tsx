import { useTranslation } from 'react-i18next';
import {
  type Objective,
  type ZoneDrop,
  type ZoneDropMode,
} from '../../types/quest';
import { type CustomItem } from '../../types/item';
import { NumberInput, PillSelect, Field, DataListInput } from '../ui/Field';
import { CoordsWithDimension } from './CoordsWithDimension';
import { useMobOptions } from '../../data/mobs';

type ItemSource = 'vanilla' | 'custom';

function defaultZoneCap(amount: number): number {
  return Math.min(Math.max(1, amount), 5);
}

function defaultZoneDrop(): ZoneDrop {
  return { target: 'minecraft:rotten_flesh', amount: 1, chance: 100 };
}

function zoneDropSource(drop: ZoneDrop): ItemSource {
  return drop.customItemId ? 'custom' : 'vanilla';
}

interface Props {
  variant: 'kill' | 'gather';
  obj: Objective;
  customItems: CustomItem[];
  dimensionOptions: { value: string; label: string }[];
  onChange: (patch: Partial<Objective>) => void;
}

export function SpawnZoneFields({ variant, obj, customItems, dimensionOptions, onChange }: Props) {
  const { t } = useTranslation('editor');
  const { t: tc } = useTranslation('common');
  const mobOptions = useMobOptions();
  const isKill = variant === 'kill';
  const defaultDropMode: ZoneDropMode = isKill ? 'none' : 'vanilla';

  return (
    <>
      <Field
        label={isKill ? t('spawnZone.killEnable') : t('spawnZone.gatherEnable')}
        hint={isKill ? t('spawnZone.killEnableHint') : t('spawnZone.gatherEnableHint')}
      >
        <PillSelect
          value={obj.spawnZone ? 'yes' : 'no'}
          options={[
            {
              value: 'no',
              label: isKill ? t('spawnZone.killNo') : t('spawnZone.gatherNo'),
            },
            { value: 'yes', label: t('spawnZone.yes') },
          ]}
          onChange={(v) =>
            onChange({
              spawnZone: v === 'yes',
              location:
                v === 'yes' ? obj.location ?? { x: 100, y: 64, z: 100 } : obj.location,
              radius: v === 'yes' ? obj.radius ?? 5 : obj.radius,
              zoneCap: v === 'yes' ? obj.zoneCap ?? defaultZoneCap(obj.amount ?? 1) : obj.zoneCap,
              zoneMob: v === 'yes' && !isKill ? obj.zoneMob ?? 'minecraft:cow' : obj.zoneMob,
              zoneDropMode:
                v === 'yes' ? obj.zoneDropMode ?? defaultDropMode : obj.zoneDropMode,
              zoneDrops: v === 'yes' ? obj.zoneDrops : obj.zoneDrops,
            })
          }
        />
      </Field>
      {obj.spawnZone && (
        <>
          {!isKill && (
            <DataListInput
              label={t('spawnZone.mobToSpawn')}
              hint={t('spawnZone.mobToSpawnHint')}
              value={obj.zoneMob ?? ''}
              onChange={(zoneMob) => onChange({ zoneMob })}
              options={mobOptions}
              listId="mc-zone-mob-list"
              placeholder={t('spawnZone.cowPlaceholder')}
            />
          )}
          <Field label={t('spawnZone.zoneCenter')} hint={t('spawnZone.zoneCenterHint')}>
            <CoordsWithDimension
              value={obj.location ?? { x: 100, y: 64, z: 100 }}
              onChange={(location) => onChange({ location })}
              dimensionOptions={dimensionOptions}
            />
          </Field>
          <NumberInput
            label={t('spawnZone.spawnRadius')}
            hint={t('spawnZone.spawnRadiusHint')}
            min={1}
            value={obj.radius ?? 5}
            onChange={(radius) => onChange({ radius })}
          />
          <NumberInput
            label={t('spawnZone.liveMobCap')}
            hint={isKill ? t('spawnZone.liveMobCapKillHint') : t('spawnZone.liveMobCapGatherHint')}
            min={1}
            value={obj.zoneCap ?? defaultZoneCap(obj.amount ?? 1)}
            onChange={(zoneCap) => onChange({ zoneCap })}
          />
          <Field label={t('spawnZone.dropBehavior')} hint={t('spawnZone.dropBehaviorHint')}>
            <PillSelect
              value={obj.zoneDropMode ?? defaultDropMode}
              options={[
                { value: 'none', label: t('spawnZone.dropNone') },
                { value: 'vanilla', label: t('spawnZone.dropVanilla') },
                { value: 'custom', label: t('spawnZone.dropCustom') },
              ]}
              onChange={(mode) => {
                const zoneDropMode = mode as ZoneDropMode;
                onChange({
                  zoneDropMode,
                  zoneDrops:
                    zoneDropMode === 'custom'
                      ? obj.zoneDrops?.length
                        ? obj.zoneDrops
                        : [defaultZoneDrop()]
                      : obj.zoneDrops,
                });
              }}
            />
          </Field>
          {obj.zoneDropMode === 'custom' && (
            <div>
              <div className="row-between" style={{ marginBottom: 10 }}>
                <label style={{ fontWeight: 600, fontSize: 13 }}>{t('spawnZone.dropList')}</label>
                <button
                  className="btn small"
                  type="button"
                  onClick={() =>
                    onChange({
                      zoneDrops: [...(obj.zoneDrops ?? []), defaultZoneDrop()],
                    })
                  }
                >
                  {t('spawnZone.addDrop')}
                </button>
              </div>
              {(obj.zoneDrops ?? []).length === 0 && (
                <p className="muted" style={{ fontSize: 13 }}>
                  {t('spawnZone.addDropEmpty')}
                </p>
              )}
              {(obj.zoneDrops ?? []).map((drop, di) => {
                const source = zoneDropSource(drop);
                const updateDrop = (patch: Partial<ZoneDrop>) => {
                  const zoneDrops = (obj.zoneDrops ?? []).map((d, idx) =>
                    idx === di ? { ...d, ...patch } : d,
                  );
                  onChange({ zoneDrops });
                };
                const removeDrop = () => {
                  const zoneDrops = (obj.zoneDrops ?? []).filter((_, idx) => idx !== di);
                  onChange({ zoneDrops });
                };
                return (
                  <div
                    key={di}
                    className="card"
                    style={{ background: 'var(--bg)', marginBottom: 10 }}
                  >
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
                              updateDrop({
                                customItemId: first?.id,
                                target: undefined,
                              });
                            } else {
                              updateDrop({
                                target: drop.target ?? 'minecraft:rotten_flesh',
                                customItemId: undefined,
                              });
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
                            onChange={(e) => updateDrop({ target: e.target.value })}
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
                              updateDrop({
                                customItemId: e.target.value,
                                target: undefined,
                              })
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
                          onChange={(e) => updateDrop({ amount: Number(e.target.value) })}
                        />
                      </div>
                      <div className="field" style={{ maxWidth: 100 }}>
                        <label>{t('spawnZone.chancePercent')}</label>
                        <input
                          type="number"
                          min={1}
                          max={100}
                          value={drop.chance ?? 100}
                          onChange={(e) => updateDrop({ chance: Number(e.target.value) })}
                        />
                      </div>
                      <button className="btn small danger" type="button" onClick={removeDrop}>
                        {tc('actions.remove')}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </>
  );
}
