import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BASE_ITEM_OPTIONS } from '../data/baseItems';
import { ENCHANTMENT_OPTIONS, getEnchantmentMaxLevel } from '../data/enchantments';
import { buildGiveCommand } from '../generator/items';
import { useEntityClipboard } from '../hooks/useEntityClipboard';
import { useCustomItemKindLabels } from '../i18n/useLabels';
import { createCustomItem } from '../types/factory';
import { toIdentifier } from '../types/ids';
import type { CustomItem, CustomItemKind, ItemRarity } from '../types/item';
import type { Project } from '../types/quest';
import {
  asRequiredNumber,
  DataListInput,
  Field,
  NumberInput,
  PillSelect,
  Select,
  TextArea,
  TextInput,
} from './ui/Field';
import { PageHeader } from './ui/PageHeader';

interface Props {
  project: Project;
  onChange: (project: Project) => void;
  onAdd: (kind: CustomItemKind) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}

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
  const { t } = useTranslation('items');
  const { t: tc } = useTranslation('common');
  const { copyEntity, pasteEntity } = useEntityClipboard();
  const kindLabels = useCustomItemKindLabels();
  const items = project.customItems ?? [];
  const [selectedId, setSelectedId] = useState<string>(() => items[0]?.id ?? '');

  const kindOptions = useMemo(
    () =>
      (Object.keys(kindLabels) as CustomItemKind[]).map((value) => ({
        value,
        label: kindLabels[value],
      })),
    [kindLabels],
  );

  const rarityOptions = useMemo(
    (): { value: ItemRarity; label: string }[] => [
      { value: 'common', label: t('rarity.common') },
      { value: 'uncommon', label: t('rarity.uncommon') },
      { value: 'rare', label: t('rarity.rare') },
      { value: 'epic', label: t('rarity.epic') },
    ],
    [t],
  );

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

  const showFood =
    selected &&
    selected.kind !== 'collectible' &&
    (selected.kind === 'food' || selected.food || selected.consumable);
  const showTool =
    selected && selected.kind !== 'collectible' && (selected.kind === 'tool' || selected.tool);

  return (
    <div className="items-page">
      <PageHeader title={t('title')} lead={t('subtitle')} hint={t('subtitleHint')} />

      <div className="items-layout">
        <aside className="items-list card">
          <div className="row-between" style={{ marginBottom: 12 }}>
            <h3 style={{ margin: 0 }}>{t('list.title', { count: items.length })}</h3>
            <div className="row-actions">
              <button
                className="btn small ghost"
                title={tc('clipboard.paste')}
                onClick={async () => {
                  const result = await pasteEntity();
                  if (result?.kind === 'customItem') setSelectedId(result.id);
                }}
              >
                {tc('clipboard.paste')}
              </button>
              <button
                className="btn small"
                onClick={() => onAdd('general')}
                title={t('list.addTitle')}
              >
                {tc('actions.add')}
              </button>
            </div>
          </div>

          {items.length === 0 && <p className="muted">{t('list.empty')}</p>}

          {items.map((item) => (
            <div
              key={item.id}
              className={`quest-item ${item.id === selected?.id ? 'active' : ''}`}
              onClick={() => setSelectedId(item.id)}
            >
              <div>
                <div className="name">{item.name || t('list.untitled')}</div>
                <div className="type">{kindLabels[item.kind]}</div>
              </div>
              <div className="row-actions">
                <button
                  className="icon-btn"
                  title={tc('clipboard.copy')}
                  onClick={(e) => {
                    e.stopPropagation();
                    void copyEntity('customItem', item.id);
                  }}
                >
                  {tc('actions.copy')}
                </button>
                <button
                  className="icon-btn"
                  title={t('list.duplicate')}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDuplicate(item.id);
                  }}
                >
                  {t('list.duplicate')}
                </button>
                <button
                  className="icon-btn"
                  title={t('list.delete')}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(item.id);
                  }}
                >
                  {t('list.delete')}
                </button>
              </div>
            </div>
          ))}

          <div style={{ marginTop: 14, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            <button className="btn small ghost" onClick={() => onAdd('collectible')}>
              {t('list.addCollectible')}
            </button>
            <button className="btn small ghost" onClick={() => onAdd('food')}>
              {t('list.addFood')}
            </button>
            <button className="btn small ghost" onClick={() => onAdd('tool')}>
              {t('list.addTool')}
            </button>
          </div>
        </aside>

        <div className="items-editor">
          {!selected && <div className="card muted">{t('list.selectEmpty')}</div>}

          {selected && (
            <>
              <div className="card" style={{ marginBottom: 16 }}>
                <Field label={t('editor.itemKind')} hint={t('editor.itemKindHint')}>
                  <PillSelect value={selected.kind} options={kindOptions} onChange={setKind} />
                </Field>

                <div className="grid-2">
                  <TextInput
                    label={t('editor.editorName')}
                    hint={t('editor.editorNameHint')}
                    value={selected.name}
                    onChange={(name) =>
                      updateItem({
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
                    onChange={(tag) => updateItem({ tag: toIdentifier(tag, 'item') })}
                  />
                </div>

                <DataListInput
                  label={t('editor.baseItem')}
                  hint={t('editor.baseItemHint')}
                  value={selected.baseItem}
                  onChange={(baseItem) => updateItem({ baseItem })}
                  options={BASE_ITEM_OPTIONS}
                  listId="base-item-list"
                  placeholder={t('editor.baseItemPlaceholder')}
                />

                <TextInput
                  label={t('editor.displayName')}
                  hint={t('editor.displayNameHint')}
                  value={selected.displayName}
                  onChange={(displayName) => updateItem({ displayName })}
                />

                <TextArea
                  label={t('editor.lore')}
                  hint={
                    selected.kind === 'collectible'
                      ? t('editor.loreCollectibleHint')
                      : t('editor.loreHint')
                  }
                  value={loreToText(selected.lore)}
                  onChange={(text) => updateItem({ lore: loreFromText(text) })}
                  placeholder={t('editor.lorePlaceholder')}
                />
              </div>

              {showFood && (
                <div className="card" style={{ marginBottom: 16 }}>
                  <h3 style={{ marginTop: 0 }}>{t('food.title')}</h3>
                  <div className="grid-2">
                    <NumberInput
                      label={t('food.nutrition')}
                      min={0}
                      value={selected.food?.nutrition ?? 0}
                      onChange={asRequiredNumber((nutrition) =>
                        updateItem({
                          food: {
                            nutrition,
                            saturation: selected.food?.saturation ?? 0,
                            canAlwaysEat: selected.food?.canAlwaysEat,
                          },
                        }),
                      )}
                    />
                    <NumberInput
                      label={t('food.saturation')}
                      min={0}
                      value={selected.food?.saturation ?? 0}
                      onChange={asRequiredNumber((saturation) =>
                        updateItem({
                          food: {
                            nutrition: selected.food?.nutrition ?? 0,
                            saturation,
                            canAlwaysEat: selected.food?.canAlwaysEat,
                          },
                        }),
                      )}
                    />
                  </div>
                  <Field label={t('food.canAlwaysEat')}>
                    <PillSelect
                      value={selected.food?.canAlwaysEat ? 'yes' : 'no'}
                      options={[
                        { value: 'no', label: tc('actions.no') },
                        { value: 'yes', label: tc('actions.yes') },
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
                    label={t('food.consumeTime')}
                    hint={t('food.consumeTimeHint')}
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
                        label={t('food.effectId')}
                        value={effect.effectId}
                        onChange={(effectId) => {
                          const effects = [...(selected.consumable?.effects ?? [])];
                          effects[i] = { ...effects[i], effectId };
                          updateItem({ consumable: { ...selected.consumable!, effects } });
                        }}
                        placeholder={t('food.effectPlaceholder')}
                      />
                      <NumberInput
                        label={t('food.amplifier')}
                        min={0}
                        value={effect.amplifier}
                        onChange={asRequiredNumber((amplifier) => {
                          const effects = [...(selected.consumable?.effects ?? [])];
                          effects[i] = { ...effects[i], amplifier };
                          updateItem({ consumable: { ...selected.consumable!, effects } });
                        })}
                      />
                      <NumberInput
                        label={t('food.duration')}
                        min={1}
                        value={effect.duration}
                        onChange={asRequiredNumber((duration) => {
                          const effects = [...(selected.consumable?.effects ?? [])];
                          effects[i] = { ...effects[i], duration };
                          updateItem({ consumable: { ...selected.consumable!, effects } });
                        })}
                      />
                      <button
                        className="btn small danger"
                        onClick={() => {
                          const effects = (selected.consumable?.effects ?? []).filter(
                            (_, idx) => idx !== i,
                          );
                          updateItem({
                            consumable: {
                              consumeSeconds: selected.consumable?.consumeSeconds,
                              effects,
                            },
                          });
                        }}
                      >
                        {tc('actions.remove')}
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
                    {t('food.addEffect')}
                  </button>
                </div>
              )}

              {showTool && (
                <div className="card" style={{ marginBottom: 16 }}>
                  <h3 style={{ marginTop: 0 }}>{t('tool.title')}</h3>
                  <div className="grid-2">
                    <NumberInput
                      label={t('tool.defaultMiningSpeed')}
                      min={0}
                      value={selected.tool?.defaultMiningSpeed ?? 1}
                      onChange={asRequiredNumber((defaultMiningSpeed) =>
                        updateItem({
                          tool: {
                            defaultMiningSpeed,
                            damagePerBlock: selected.tool?.damagePerBlock ?? 1,
                            rules: selected.tool?.rules ?? [],
                          },
                        }),
                      )}
                    />
                    <NumberInput
                      label={t('tool.damagePerBlock')}
                      min={0}
                      value={selected.tool?.damagePerBlock ?? 1}
                      onChange={asRequiredNumber((damagePerBlock) =>
                        updateItem({
                          tool: {
                            defaultMiningSpeed: selected.tool?.defaultMiningSpeed ?? 1,
                            damagePerBlock,
                            rules: selected.tool?.rules ?? [],
                          },
                        }),
                      )}
                    />
                  </div>
                  {(selected.tool?.rules ?? []).map((rule, i) => (
                    <div key={i} className="list-row" style={{ marginBottom: 8 }}>
                      <TextInput
                        label={t('tool.blocks')}
                        hint={t('tool.blocksHint')}
                        value={rule.blocks}
                        onChange={(blocks) => {
                          const rules = [...(selected.tool?.rules ?? [])];
                          rules[i] = { ...rules[i], blocks };
                          updateItem({ tool: { ...selected.tool!, rules } });
                        }}
                        placeholder={t('tool.blocksPlaceholder')}
                      />
                      <NumberInput
                        label={t('tool.speed')}
                        min={0}
                        value={rule.speed}
                        onChange={asRequiredNumber((speed) => {
                          const rules = [...(selected.tool?.rules ?? [])];
                          rules[i] = { ...rules[i], speed };
                          updateItem({ tool: { ...selected.tool!, rules } });
                        })}
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
                        {tc('actions.remove')}
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
                    {t('tool.addBlockRule')}
                  </button>
                </div>
              )}

              <div className="card" style={{ marginBottom: 16 }}>
                <h3 style={{ marginTop: 0 }}>{t('advanced.title')}</h3>
                <Field label={t('advanced.glint')}>
                  <PillSelect
                    value={selected.glint ? 'yes' : 'no'}
                    options={[
                      { value: 'no', label: tc('actions.off') },
                      { value: 'yes', label: tc('actions.on') },
                    ]}
                    onChange={(v) => updateItem({ glint: v === 'yes' })}
                  />
                </Field>
                <h4 style={{ margin: '16px 0 8px' }}>{t('advanced.enchantments')}</h4>
                {(selected.enchantments ?? []).map((enchant, i) => {
                  const maxLevel = getEnchantmentMaxLevel(enchant.enchantmentId);
                  return (
                    <div key={i} className="list-row" style={{ marginBottom: 8 }}>
                      <DataListInput
                        label={t('advanced.enchantmentId')}
                        hint={t('advanced.enchantmentIdHint')}
                        value={enchant.enchantmentId}
                        options={ENCHANTMENT_OPTIONS}
                        listId={`enchant-list-${i}`}
                        onChange={(enchantmentId) => {
                          const enchantments = [...(selected.enchantments ?? [])];
                          enchantments[i] = { ...enchantments[i], enchantmentId };
                          updateItem({ enchantments });
                        }}
                        placeholder={t('advanced.enchantmentPlaceholder')}
                      />
                      <NumberInput
                        label={t('advanced.enchantmentLevel')}
                        hint={
                          maxLevel != null
                            ? t('advanced.enchantmentLevelHint', { max: maxLevel })
                            : undefined
                        }
                        min={1}
                        value={enchant.level}
                        onChange={asRequiredNumber((level) => {
                          const enchantments = [...(selected.enchantments ?? [])];
                          enchantments[i] = { ...enchantments[i], level };
                          updateItem({ enchantments });
                        })}
                      />
                      <button
                        className="btn small danger"
                        onClick={() => {
                          const enchantments = (selected.enchantments ?? []).filter(
                            (_, idx) => idx !== i,
                          );
                          updateItem({
                            enchantments: enchantments.length ? enchantments : undefined,
                          });
                        }}
                      >
                        {tc('actions.remove')}
                      </button>
                    </div>
                  );
                })}
                <button
                  className="btn small"
                  onClick={() => {
                    const enchantments = [
                      ...(selected.enchantments ?? []),
                      { enchantmentId: 'minecraft:unbreaking', level: 1 },
                    ];
                    const patch: Partial<CustomItem> = { enchantments };
                    if (!selected.glint && !(selected.enchantments ?? []).length) {
                      patch.glint = true;
                    }
                    updateItem(patch);
                  }}
                >
                  {t('advanced.addEnchantment')}
                </button>
                <Select
                  label={t('advanced.rarity')}
                  value={selected.rarity ?? 'common'}
                  options={rarityOptions}
                  onChange={(rarity) => updateItem({ rarity })}
                />
                <NumberInput
                  label={t('advanced.maxStackSize')}
                  hint={t('advanced.maxStackSizeHint')}
                  min={1}
                  value={selected.maxStackSize ?? 64}
                  onChange={(maxStackSize) => updateItem({ maxStackSize })}
                />
                <Field label={t('advanced.unbreakable')}>
                  <PillSelect
                    value={selected.unbreakable ? 'yes' : 'no'}
                    options={[
                      { value: 'no', label: tc('actions.no') },
                      { value: 'yes', label: tc('actions.yes') },
                    ]}
                    onChange={(v) => updateItem({ unbreakable: v === 'yes' })}
                  />
                </Field>
              </div>

              <div className="card">
                <h3 style={{ marginTop: 0 }}>{t('preview.title')}</h3>
                <pre className="command-preview" style={{ overflow: 'auto', fontSize: 12 }}>
                  /{previewCommand}
                </pre>
                <div className="hint">{t('preview.hint', { namespace: project.namespace })}</div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
