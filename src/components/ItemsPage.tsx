import { useMemo, useState } from 'react';
import { type Project } from '../types/quest';
import {
  type CustomItem,
  type CustomItemKind,
  CUSTOM_ITEM_KIND_LABELS,
  type ItemRarity,
} from '../types/item';
import { createCustomItem } from '../types/factory';
import { toIdentifier } from '../types/ids';
import {
  TextInput,
  TextArea,
  NumberInput,
  Select,
  PillSelect,
  Field,
  DataListInput,
} from './ui/Field';
import { BASE_ITEM_OPTIONS } from '../data/baseItems';
import { buildGiveCommand } from '../generator/items';

interface Props {
  project: Project;
  onChange: (project: Project) => void;
  onAdd: (kind: CustomItemKind) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}

const KIND_OPTIONS = (Object.keys(CUSTOM_ITEM_KIND_LABELS) as CustomItemKind[]).map((k) => ({
  value: k,
  label: CUSTOM_ITEM_KIND_LABELS[k],
}));

const RARITY_OPTIONS: { value: ItemRarity; label: string }[] = [
  { value: 'common', label: 'Common' },
  { value: 'uncommon', label: 'Uncommon' },
  { value: 'rare', label: 'Rare' },
  { value: 'epic', label: 'Epic' },
];

function applyKindDefaults(item: CustomItem, kind: CustomItemKind): CustomItem {
  const fresh = createCustomItem(kind, item.name);
  return {
    ...fresh,
    id: item.id,
    tag: item.tag,
    displayName: item.displayName || item.name,
    lore: item.lore,
  };
}

function loreFromText(text: string): string[] {
  return text.split('\n').map((l) => l.trimEnd());
}

function loreToText(lore: string[]): string {
  return lore.join('\n');
}

export function ItemsPage({ project, onChange, onAdd, onDuplicate, onDelete }: Props) {
  const items = project.customItems ?? [];
  const [selectedId, setSelectedId] = useState<string>(() => items[0]?.id ?? '');

  const selected = useMemo(
    () => items.find((i) => i.id === selectedId) ?? items[0],
    [items, selectedId],
  );

  const updateItem = (patch: Partial<CustomItem>) => {
    if (!selected) return;
    onChange({
      ...project,
      customItems: items.map((i) => (i.id === selected.id ? { ...i, ...patch } : i)),
    });
  };

  const setKind = (kind: CustomItemKind) => {
    if (!selected) return;
    const next = applyKindDefaults(selected, kind);
    onChange({
      ...project,
      customItems: items.map((i) => (i.id === selected.id ? next : i)),
    });
  };

  const previewCommand = selected ? buildGiveCommand(selected, '@s', 1) : '';

  const showFood = selected && selected.kind !== 'collectible' && (selected.kind === 'food' || selected.food || selected.consumable);
  const showTool = selected && selected.kind !== 'collectible' && (selected.kind === 'tool' || selected.tool);

  return (
    <div className="items-page">
      <h1 className="step-title">Custom Items</h1>
      <p className="step-sub">
        Define reusable items with custom names, lore, and behavior. Use them as quest rewards or
        gather/delivery targets. Items use Minecraft item components (no custom textures in v1).
      </p>

      <div className="items-layout">
        <aside className="items-list card">
          <div className="row-between" style={{ marginBottom: 12 }}>
            <h3 style={{ margin: 0 }}>Items ({items.length})</h3>
            <div className="row-actions">
              <button className="btn small" onClick={() => onAdd('general')} title="Add general item">
                + Add
              </button>
            </div>
          </div>

          {items.length === 0 && (
            <p className="muted">No custom items yet. Create one to use in quests.</p>
          )}

          {items.map((item) => (
            <div
              key={item.id}
              className={`quest-item ${item.id === selected?.id ? 'active' : ''}`}
              onClick={() => setSelectedId(item.id)}
            >
              <div>
                <div className="name">{item.name || 'Untitled item'}</div>
                <div className="type">{CUSTOM_ITEM_KIND_LABELS[item.kind]}</div>
              </div>
              <div className="row-actions">
                <button
                  className="icon-btn"
                  title="Duplicate"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDuplicate(item.id);
                  }}
                >
                  Copy
                </button>
                <button
                  className="icon-btn"
                  title="Delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(item.id);
                  }}
                >
                  Del
                </button>
              </div>
            </div>
          ))}

          <div style={{ marginTop: 14, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            <button className="btn small ghost" onClick={() => onAdd('collectible')}>
              + Collectible
            </button>
            <button className="btn small ghost" onClick={() => onAdd('food')}>
              + Food
            </button>
            <button className="btn small ghost" onClick={() => onAdd('tool')}>
              + Tool
            </button>
          </div>
        </aside>

        <div className="items-editor">
          {!selected && (
            <div className="card muted">Select an item from the list or create a new one.</div>
          )}

          {selected && (
            <>
              <div className="card" style={{ marginBottom: 16 }}>
                <Field label="Item kind" hint="Collectibles are trophy-style rewards with sensible defaults.">
                  <PillSelect
                    value={selected.kind}
                    options={KIND_OPTIONS}
                    onChange={setKind}
                  />
                </Field>

                <div className="grid-2">
                  <TextInput
                    label="Editor name"
                    hint="Internal label in this tool only."
                    value={selected.name}
                    onChange={(name) =>
                      updateItem({
                        name,
                        tag: toIdentifier(name, selected.tag),
                        displayName: selected.displayName === selected.name ? name : selected.displayName,
                      })
                    }
                  />
                  <TextInput
                    label="Identity tag"
                    hint="Stored in custom_data; used to match items in quests."
                    value={selected.tag}
                    onChange={(tag) => updateItem({ tag: toIdentifier(tag, 'item') })}
                  />
                </div>

                <DataListInput
                  label="Base item"
                  hint="Vanilla item this is based on (appearance matches this unless you add a resource pack)."
                  value={selected.baseItem}
                  onChange={(baseItem) => updateItem({ baseItem })}
                  options={BASE_ITEM_OPTIONS}
                  listId="base-item-list"
                  placeholder="minecraft:paper"
                />

                <TextInput
                  label="Display name"
                  hint="Shown to the player in-game."
                  value={selected.displayName}
                  onChange={(displayName) => updateItem({ displayName })}
                />

                <TextArea
                  label="Lore"
                  hint={
                    selected.kind === 'collectible'
                      ? 'One line per row. e.g. "Awarded for completing the dragon quest."'
                      : 'One line per row.'
                  }
                  value={loreToText(selected.lore)}
                  onChange={(text) => updateItem({ lore: loreFromText(text) })}
                  placeholder="Line one&#10;Line two"
                />
              </div>

              {showFood && (
                <div className="card" style={{ marginBottom: 16 }}>
                  <h3 style={{ marginTop: 0 }}>Food & consumable</h3>
                  <div className="grid-2">
                    <NumberInput
                      label="Nutrition"
                      min={0}
                      value={selected.food?.nutrition ?? 0}
                      onChange={(nutrition) =>
                        updateItem({
                          food: {
                            nutrition,
                            saturation: selected.food?.saturation ?? 0,
                            canAlwaysEat: selected.food?.canAlwaysEat,
                          },
                        })
                      }
                    />
                    <NumberInput
                      label="Saturation"
                      min={0}
                      value={selected.food?.saturation ?? 0}
                      onChange={(saturation) =>
                        updateItem({
                          food: {
                            nutrition: selected.food?.nutrition ?? 0,
                            saturation,
                            canAlwaysEat: selected.food?.canAlwaysEat,
                          },
                        })
                      }
                    />
                  </div>
                  <Field label="Can always eat">
                    <PillSelect
                      value={selected.food?.canAlwaysEat ? 'yes' : 'no'}
                      options={[
                        { value: 'no', label: 'No' },
                        { value: 'yes', label: 'Yes' },
                      ]}
                      onChange={(v) =>
                        updateItem({
                          food: {
                            nutrition: selected.food?.nutrition ?? 4,
                            saturation: selected.food?.saturation ?? 0.3,
                            canAlwaysEat: v === 'yes',
                          },
                        })
                      }
                    />
                  </Field>
                  <NumberInput
                    label="Consume time (seconds)"
                    hint="How long eating takes."
                    min={0}
                    value={selected.consumable?.consumeSeconds ?? 1.6}
                    onChange={(consumeSeconds) =>
                      updateItem({
                        consumable: {
                          consumeSeconds,
                          effects: selected.consumable?.effects ?? [],
                        },
                      })
                    }
                  />
                  {(selected.consumable?.effects ?? []).map((effect, i) => (
                    <div key={i} className="list-row" style={{ marginBottom: 8 }}>
                      <TextInput
                        label="Effect id"
                        value={effect.effectId}
                        onChange={(effectId) => {
                          const effects = [...(selected.consumable?.effects ?? [])];
                          effects[i] = { ...effects[i], effectId };
                          updateItem({ consumable: { ...selected.consumable!, effects } });
                        }}
                        placeholder="minecraft:regeneration"
                      />
                      <NumberInput
                        label="Amplifier"
                        min={0}
                        value={effect.amplifier}
                        onChange={(amplifier) => {
                          const effects = [...(selected.consumable?.effects ?? [])];
                          effects[i] = { ...effects[i], amplifier };
                          updateItem({ consumable: { ...selected.consumable!, effects } });
                        }}
                      />
                      <NumberInput
                        label="Duration (ticks)"
                        min={1}
                        value={effect.duration}
                        onChange={(duration) => {
                          const effects = [...(selected.consumable?.effects ?? [])];
                          effects[i] = { ...effects[i], duration };
                          updateItem({ consumable: { ...selected.consumable!, effects } });
                        }}
                      />
                      <button
                        className="btn small danger"
                        onClick={() => {
                          const effects = (selected.consumable?.effects ?? []).filter((_, idx) => idx !== i);
                          updateItem({
                            consumable: {
                              consumeSeconds: selected.consumable?.consumeSeconds,
                              effects,
                            },
                          });
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    className="btn small"
                    onClick={() =>
                      updateItem({
                        consumable: {
                          consumeSeconds: selected.consumable?.consumeSeconds ?? 1.6,
                          effects: [
                            ...(selected.consumable?.effects ?? []),
                            { effectId: 'minecraft:regeneration', amplifier: 0, duration: 100 },
                          ],
                        },
                        food: selected.food ?? { nutrition: 4, saturation: 0.3 },
                      })
                    }
                  >
                    + Add effect
                  </button>
                </div>
              )}

              {showTool && (
                <div className="card" style={{ marginBottom: 16 }}>
                  <h3 style={{ marginTop: 0 }}>Tool</h3>
                  <div className="grid-2">
                    <NumberInput
                      label="Default mining speed"
                      min={0}
                      value={selected.tool?.defaultMiningSpeed ?? 1}
                      onChange={(defaultMiningSpeed) =>
                        updateItem({
                          tool: {
                            defaultMiningSpeed,
                            damagePerBlock: selected.tool?.damagePerBlock ?? 1,
                            rules: selected.tool?.rules ?? [],
                          },
                        })
                      }
                    />
                    <NumberInput
                      label="Damage per block"
                      min={0}
                      value={selected.tool?.damagePerBlock ?? 1}
                      onChange={(damagePerBlock) =>
                        updateItem({
                          tool: {
                            defaultMiningSpeed: selected.tool?.defaultMiningSpeed ?? 1,
                            damagePerBlock,
                            rules: selected.tool?.rules ?? [],
                          },
                        })
                      }
                    />
                  </div>
                  {(selected.tool?.rules ?? []).map((rule, i) => (
                    <div key={i} className="list-row" style={{ marginBottom: 8 }}>
                      <TextInput
                        label="Blocks"
                        hint="Block id or tag"
                        value={rule.blocks}
                        onChange={(blocks) => {
                          const rules = [...(selected.tool?.rules ?? [])];
                          rules[i] = { ...rules[i], blocks };
                          updateItem({ tool: { ...selected.tool!, rules } });
                        }}
                        placeholder="minecraft:sand"
                      />
                      <NumberInput
                        label="Speed"
                        min={0}
                        value={rule.speed}
                        onChange={(speed) => {
                          const rules = [...(selected.tool?.rules ?? [])];
                          rules[i] = { ...rules[i], speed };
                          updateItem({ tool: { ...selected.tool!, rules } });
                        }}
                      />
                      <button
                        className="btn small danger"
                        onClick={() => {
                          const rules = (selected.tool?.rules ?? []).filter((_, idx) => idx !== i);
                          updateItem({
                            tool: {
                              defaultMiningSpeed: selected.tool?.defaultMiningSpeed ?? 1,
                              damagePerBlock: selected.tool?.damagePerBlock ?? 1,
                              rules,
                            },
                          });
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    className="btn small"
                    onClick={() =>
                      updateItem({
                        tool: {
                          defaultMiningSpeed: selected.tool?.defaultMiningSpeed ?? 1,
                          damagePerBlock: selected.tool?.damagePerBlock ?? 1,
                          rules: [
                            ...(selected.tool?.rules ?? []),
                            { blocks: 'minecraft:sand', speed: 100 },
                          ],
                        },
                      })
                    }
                  >
                    + Add block rule
                  </button>
                </div>
              )}

              <div className="card" style={{ marginBottom: 16 }}>
                <h3 style={{ marginTop: 0 }}>Advanced</h3>
                <Field label="Enchantment glint">
                  <PillSelect
                    value={selected.glint ? 'yes' : 'no'}
                    options={[
                      { value: 'no', label: 'Off' },
                      { value: 'yes', label: 'On' },
                    ]}
                    onChange={(v) => updateItem({ glint: v === 'yes' })}
                  />
                </Field>
                <Select
                  label="Rarity"
                  value={selected.rarity ?? 'common'}
                  options={RARITY_OPTIONS}
                  onChange={(rarity) => updateItem({ rarity })}
                />
                <NumberInput
                  label="Max stack size"
                  hint="Leave at 64 for default, or set 1 for unique items."
                  min={1}
                  value={selected.maxStackSize ?? 64}
                  onChange={(maxStackSize) => updateItem({ maxStackSize })}
                />
                <Field label="Unbreakable">
                  <PillSelect
                    value={selected.unbreakable ? 'yes' : 'no'}
                    options={[
                      { value: 'no', label: 'No' },
                      { value: 'yes', label: 'Yes' },
                    ]}
                    onChange={(v) => updateItem({ unbreakable: v === 'yes' })}
                  />
                </Field>
              </div>

              <div className="card">
                <h3 style={{ marginTop: 0 }}>Generated command preview</h3>
                <pre className="command-preview" style={{ overflow: 'auto', fontSize: 12 }}>
                  /{previewCommand}
                </pre>
                <div className="hint">
                  After exporting, run /function {project.namespace}:give_custom_items to receive one
                  of each custom item for testing.
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
