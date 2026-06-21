import {
  type Objective,
  type ZoneDrop,
  type ZoneDropMode,
} from '../../types/quest';
import { type CustomItem } from '../../types/item';
import { NumberInput, PillSelect, Field, DataListInput } from '../ui/Field';
import { CoordsRow } from './StepNPC';
import { MOB_OPTIONS } from '../../data/mobs';

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
  onChange: (patch: Partial<Objective>) => void;
}

export function SpawnZoneFields({ variant, obj, customItems, onChange }: Props) {
  const isKill = variant === 'kill';
  const defaultDropMode: ZoneDropMode = isKill ? 'none' : 'vanilla';

  return (
    <>
      <Field
        label={isKill ? 'Spawn mobs in a zone?' : 'Spawn animals/mobs in a zone?'}
        hint={
          isKill
            ? 'When enabled, tagged mobs spawn in the area below and only those kills count.'
            : 'Spawn tagged mobs so players can farm drops. Item progress still uses inventory count.'
        }
      >
        <PillSelect
          value={obj.spawnZone ? 'yes' : 'no'}
          options={[
            {
              value: 'no',
              label: isKill ? 'No - any kill counts' : 'No - players find items themselves',
            },
            { value: 'yes', label: 'Yes - spawn zone' },
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
              label="Mob / creature to spawn"
              hint="Animals or mobs that drop the items players need to collect."
              value={obj.zoneMob ?? ''}
              onChange={(zoneMob) => onChange({ zoneMob })}
              options={MOB_OPTIONS}
              listId="mc-zone-mob-list"
              placeholder="minecraft:cow"
            />
          )}
          <Field label="Zone center" hint="World coordinates for the center of the spawn area.">
            <CoordsRow
              value={obj.location ?? { x: 100, y: 64, z: 100 }}
              onChange={(location) => onChange({ location })}
            />
          </Field>
          <NumberInput
            label="Spawn radius (blocks)"
            hint="Mobs spawn within this distance of the zone center."
            min={1}
            value={obj.radius ?? 5}
            onChange={(radius) => onChange({ radius })}
          />
          <NumberInput
            label="Live mob cap"
            hint={
              isKill
                ? 'Max mobs alive in the zone at once. New ones spawn after kills.'
                : 'Max mobs alive in the zone at once. New ones spawn as mobs are removed.'
            }
            min={1}
            value={obj.zoneCap ?? defaultZoneCap(obj.amount ?? 1)}
            onChange={(zoneCap) => onChange({ zoneCap })}
          />
          <Field
            label="Drop behavior"
            hint="What items drop when players kill quest-spawned mobs in this zone."
          >
            <PillSelect
              value={obj.zoneDropMode ?? defaultDropMode}
              options={[
                { value: 'none', label: 'No drops' },
                { value: 'vanilla', label: 'Vanilla drops' },
                { value: 'custom', label: 'Custom drops' },
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
                <label style={{ fontWeight: 600, fontSize: 13 }}>Drop list</label>
                <button
                  className="btn small"
                  type="button"
                  onClick={() =>
                    onChange({
                      zoneDrops: [...(obj.zoneDrops ?? []), defaultZoneDrop()],
                    })
                  }
                >
                  + Add drop
                </button>
              </div>
              {(obj.zoneDrops ?? []).length === 0 && (
                <p className="muted" style={{ fontSize: 13 }}>
                  Add at least one item drop.
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
                        <label>Item source</label>
                        <PillSelect
                          value={source}
                          options={[
                            { value: 'vanilla', label: 'Vanilla item' },
                            { value: 'custom', label: 'Custom item' },
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
                          <label>Item id</label>
                          <input
                            value={drop.target ?? ''}
                            placeholder="minecraft:rotten_flesh"
                            onChange={(e) => updateDrop({ target: e.target.value })}
                          />
                        </div>
                      ) : customItems.length === 0 ? (
                        <div className="field" style={{ flex: 2 }}>
                          <label>Custom item</label>
                          <div className="hint">No custom items yet. Open the Custom Items tab.</div>
                        </div>
                      ) : (
                        <div className="field" style={{ flex: 2 }}>
                          <label>Custom item</label>
                          <select
                            value={drop.customItemId ?? ''}
                            onChange={(e) =>
                              updateDrop({
                                customItemId: e.target.value,
                                target: undefined,
                              })
                            }
                          >
                            {!drop.customItemId && <option value="">Select an item…</option>}
                            {customItems.map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.name} ({item.displayName})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                      <div className="field" style={{ maxWidth: 100 }}>
                        <label>Amount</label>
                        <input
                          type="number"
                          min={1}
                          value={drop.amount ?? 1}
                          onChange={(e) => updateDrop({ amount: Number(e.target.value) })}
                        />
                      </div>
                      <div className="field" style={{ maxWidth: 100 }}>
                        <label>Chance %</label>
                        <input
                          type="number"
                          min={1}
                          max={100}
                          value={drop.chance ?? 100}
                          onChange={(e) => updateDrop({ chance: Number(e.target.value) })}
                        />
                      </div>
                      <button className="btn small danger" type="button" onClick={removeDrop}>
                        Remove
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
