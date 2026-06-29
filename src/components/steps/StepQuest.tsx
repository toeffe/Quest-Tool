import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  type Objective,
  type Quest,
  type QuestType,
  type SpawnMode,
  type TargetNpc,
} from '../../types/quest';
import {
  TextInput,
  TextArea,
  NumberInput,
  Select,
  PillSelect,
  Field,
  DataListInput,
} from '../ui/Field';
import { defaultObjectiveFor, newObjectiveFor } from '../../types/factory';
import { toIdentifier } from '../../types/ids';
import { CoordsRow } from './StepNPC';
import { useMobOptions, isVillager } from '../../data/mobs';
import { VariantFields, BabySelect } from './VariantFields';
import { type CustomItem } from '../../types/item';
import { type CustomMob } from '../../types/customMob';
import { useQuestTypeLabels } from '../../i18n/useLabels';
import { QuestPreview } from '../preview/QuestPreview';
import { SpawnZoneFields } from './SpawnZoneFields';

interface Props {
  quest: Quest;
  customItems: CustomItem[];
  customMobs: CustomMob[];
  onChange: (quest: Quest) => void;
}

type ItemSource = 'vanilla' | 'custom';
type MobSource = 'vanilla' | 'custom';

function objectiveItemSource(obj: Objective): ItemSource {
  return obj.customItemId ? 'custom' : 'vanilla';
}

function objectiveMobSource(obj: Objective): MobSource {
  return obj.eliteMobId ? 'custom' : 'vanilla';
}

const usesItemTarget = (t: QuestType) => t === 'gather' || t === 'delivery' || t === 'daily';

export function StepQuest({ quest, customItems, customMobs, onChange }: Props) {
  const { t } = useTranslation('editor');
  const { t: tc } = useTranslation('common');
  const questTypeLabels = useQuestTypeLabels();
  const mobOptions = useMobOptions();
  const objectives: Objective[] = quest.objectives.length ? quest.objectives : [{}];
  const isMultiType = quest.type !== 'talk';

  const typeOptions = useMemo(
    () =>
      (Object.keys(questTypeLabels) as QuestType[]).map((value) => ({
        value,
        label: questTypeLabels[value],
      })),
    [questTypeLabels],
  );

  const spawnModes = useMemo(
    (): { value: SpawnMode; label: string }[] => [
      { value: 'player', label: tc('spawnMode.player') },
      { value: 'fixed', label: tc('spawnMode.fixed') },
      { value: 'manual', label: tc('spawnMode.manual') },
    ],
    [tc],
  );

  const setObjectiveAt = (i: number, patch: Partial<Objective>) =>
    onChange({
      ...quest,
      objectives: objectives.map((o, idx) => (idx === i ? { ...o, ...patch } : o)),
    });

  const addObjective = () =>
    onChange({ ...quest, objectives: [...objectives, newObjectiveFor(quest.type)] });

  const removeObjective = (i: number) =>
    onChange({ ...quest, objectives: objectives.filter((_, idx) => idx !== i) });

  function changeType(type: QuestType) {
    onChange({
      ...quest,
      type,
      objectives: defaultObjectiveFor(type),
      cooldownSeconds: type === 'daily' ? quest.cooldownSeconds || 86400 : quest.cooldownSeconds,
      targetNpc: type === 'talk' ? quest.targetNpc : undefined,
    });
  }

  function setTarget(patch: Partial<TargetNpc>) {
    const base: TargetNpc =
      quest.targetNpc ?? {
        name: 'Target NPC',
        tag: 'target_npc',
        entityType: 'minecraft:villager',
        dialogue: 'You found me! Now return to the quest giver.',
        spawnMode: 'player',
      };
    onChange({ ...quest, targetNpc: { ...base, ...patch } });
  }

  return (
    <div>
      <h1 className="step-title">{t('quest.title')}</h1>
      <p className="step-sub">{t('quest.subtitle')}</p>

      <div className="card">
        <h3>{t('quest.type')}</h3>
        <Field label={t('quest.questType')} hint={t('quest.questTypeHint')}>
          <PillSelect value={quest.type} options={typeOptions} onChange={changeType} />
        </Field>
        <div className="grid-2">
          <TextInput
            label={t('quest.questName')}
            hint={t('quest.questNameHint')}
            value={quest.name}
            onChange={(name) => onChange({ ...quest, name })}
          />
          <TextInput
            label={t('quest.category')}
            hint={t('quest.categoryHint')}
            value={quest.category}
            onChange={(category) => onChange({ ...quest, category })}
          />
        </div>
        <TextArea
          label={t('quest.description')}
          hint={t('quest.descriptionHint')}
          value={quest.description}
          onChange={(description) => onChange({ ...quest, description })}
        />
      </div>

      <div className="card">
        <div className="row-between" style={{ marginBottom: 14 }}>
          <h3 style={{ margin: 0 }}>{isMultiType ? t('quest.objectives') : t('quest.objective')}</h3>
          {isMultiType && (
            <button className="btn small" onClick={addObjective}>
              {t('quest.addObjective')}
            </button>
          )}
        </div>

        {isMultiType && objectives.length > 1 && (
          <p className="muted" style={{ marginTop: -6, marginBottom: 14, fontSize: 13 }}>
            {t('quest.multiObjectiveHint')}
          </p>
        )}

        {usesItemTarget(quest.type) && (
          <p className="muted" style={{ marginTop: -6, marginBottom: 14, fontSize: 13 }}>
            {t('quest.turnInHint')}
          </p>
        )}

        {objectives.map((obj, i) => {
          const showSub = isMultiType && objectives.length > 1;
          const fields = (
            <>
              <TextInput
                label={t('quest.objectiveText')}
                hint={t('quest.objectiveTextHint')}
                value={obj.description ?? ''}
                onChange={(description) => setObjectiveAt(i, { description })}
              />

              {quest.type === 'kill' && (
                <>
                  <Field label={tc('mobSource.label')}>
                    <PillSelect
                      value={objectiveMobSource(obj)}
                      options={[
                        { value: 'vanilla', label: tc('mobSource.vanilla') },
                        { value: 'custom', label: tc('mobSource.custom') },
                      ]}
                      onChange={(v) => {
                        if (v === 'custom') {
                          const first = customMobs[0];
                          setObjectiveAt(i, {
                            eliteMobId: first?.id,
                            target: undefined,
                          });
                        } else {
                          setObjectiveAt(i, {
                            target: obj.target ?? 'minecraft:zombie',
                            eliteMobId: undefined,
                          });
                        }
                      }}
                    />
                  </Field>
                  <div className="grid-2">
                    {objectiveMobSource(obj) === 'vanilla' ? (
                      <DataListInput
                        label={t('quest.mobCreature')}
                        hint={t('quest.mobCreatureHint')}
                        value={obj.target ?? ''}
                        onChange={(target) => setObjectiveAt(i, { target })}
                        options={mobOptions}
                        listId="mc-mob-list"
                        placeholder={t('quest.mobPlaceholder')}
                      />
                    ) : customMobs.length === 0 ? (
                      <div className="field">
                        <label>{tc('mobSource.custom')}</label>
                        <div className="hint">{tc('mobSource.noCustomMobsShort')}</div>
                      </div>
                    ) : (
                      <Field label={tc('mobSource.custom')}>
                        <select
                          value={obj.eliteMobId ?? ''}
                          onChange={(e) =>
                            setObjectiveAt(i, {
                              eliteMobId: e.target.value,
                              target: undefined,
                            })
                          }
                        >
                          {!obj.eliteMobId && (
                            <option value="">{tc('mobSource.selectMob')}</option>
                          )}
                          {customMobs.map((mob) => (
                            <option key={mob.id} value={mob.id}>
                              {mob.name} ({mob.displayName})
                            </option>
                          ))}
                        </select>
                      </Field>
                    )}
                    <NumberInput
                      label={t('quest.amountToKill')}
                      min={1}
                      value={obj.amount ?? 1}
                      onChange={(amount) => setObjectiveAt(i, { amount })}
                    />
                  </div>
                  <SpawnZoneFields
                    variant="kill"
                    obj={obj}
                    customItems={customItems}
                    onChange={(patch) => setObjectiveAt(i, patch)}
                  />
                </>
              )}

              {usesItemTarget(quest.type) && (
                <>
                  <Field label={tc('itemSource.label')} hint={tc('itemSource.vanillaHint')}>
                    <PillSelect
                      value={objectiveItemSource(obj)}
                      options={[
                        { value: 'vanilla', label: tc('itemSource.vanilla') },
                        { value: 'custom', label: tc('itemSource.custom') },
                      ]}
                      onChange={(source) => {
                        if (source === 'custom') {
                          const first = customItems[0];
                          setObjectiveAt(i, {
                            customItemId: first?.id,
                            target: undefined,
                          });
                        } else {
                          setObjectiveAt(i, {
                            target: obj.target ?? 'minecraft:wheat',
                            customItemId: undefined,
                          });
                        }
                      }}
                    />
                  </Field>
                  <div className="grid-2">
                    {objectiveItemSource(obj) === 'vanilla' ? (
                      <TextInput
                        label={t('quest.itemId')}
                        hint={t('quest.itemIdHint')}
                        value={obj.target ?? ''}
                        onChange={(target) => setObjectiveAt(i, { target })}
                      />
                    ) : customItems.length === 0 ? (
                      <div className="field">
                        <label>{tc('itemSource.custom')}</label>
                        <div className="hint">{tc('itemSource.noCustomItems')}</div>
                      </div>
                    ) : (
                      <Field label={tc('itemSource.custom')}>
                        <select
                          value={obj.customItemId ?? ''}
                          onChange={(e) =>
                            setObjectiveAt(i, {
                              customItemId: e.target.value,
                              target: undefined,
                            })
                          }
                        >
                          {!obj.customItemId && <option value="">{tc('actions.selectItem')}</option>}
                          {customItems.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.name} ({item.displayName})
                            </option>
                          ))}
                        </select>
                      </Field>
                    )}
                    <NumberInput
                      label={t('quest.amountRequired')}
                      min={1}
                      value={obj.amount ?? 1}
                      onChange={(amount) => setObjectiveAt(i, { amount })}
                    />
                  </div>
                  <Field
                    label={t('quest.onTurnIn')}
                    hint={
                      quest.type === 'delivery'
                        ? t('quest.onTurnInDeliveryHint')
                        : t('quest.onTurnInGatherHint')
                    }
                  >
                    {quest.type === 'delivery' ? (
                      <div
                        className="pill active"
                        style={{ cursor: 'default', display: 'inline-block' }}
                      >
                        {t('quest.removeItemsAlways')}
                      </div>
                    ) : (
                      <PillSelect
                        value={obj.consumeOnTurnIn ? 'remove' : 'keep'}
                        options={[
                          { value: 'keep', label: tc('actions.keep') },
                          { value: 'remove', label: tc('actions.remove') },
                        ]}
                        onChange={(v) =>
                          setObjectiveAt(i, { consumeOnTurnIn: v === 'remove' })
                        }
                      />
                    )}
                  </Field>
                  {quest.type === 'gather' && (
                    <SpawnZoneFields
                      variant="gather"
                      obj={obj}
                      customItems={customItems}
                      onChange={(patch) => setObjectiveAt(i, patch)}
                    />
                  )}
                </>
              )}

              {quest.type === 'exploration' && (
                <>
                  <CoordsRow
                    value={obj.location ?? { x: 0, y: 64, z: 0 }}
                    onChange={(location) => setObjectiveAt(i, { location })}
                  />
                  <NumberInput
                    label={t('quest.discoveryRadius')}
                    hint={t('quest.discoveryRadiusHint')}
                    min={1}
                    value={obj.radius ?? 5}
                    onChange={(radius) => setObjectiveAt(i, { radius })}
                  />
                </>
              )}
            </>
          );

          if (!showSub) return <div key={i}>{fields}</div>;
          return (
            <div key={i} className="card" style={{ background: 'var(--bg)', marginBottom: 12 }}>
              <div className="row-between" style={{ marginBottom: 12 }}>
                <strong>{t('quest.objectiveN', { n: i + 1 })}</strong>
                <button className="btn small danger" onClick={() => removeObjective(i)}>
                  {tc('actions.remove')}
                </button>
              </div>
              {fields}
            </div>
          );
        })}

        {quest.type === 'talk' && (
          <p className="muted" style={{ fontSize: 13 }}>
            {t('quest.talkHint')}
          </p>
        )}

        {quest.type === 'daily' && (
          <NumberInput
            label={t('quest.cooldown')}
            hint={t('quest.cooldownHint')}
            min={1}
            value={quest.cooldownSeconds}
            onChange={(cooldownSeconds) => onChange({ ...quest, cooldownSeconds })}
          />
        )}

        {quest.type !== 'talk' && (
          <div style={{ marginTop: 16 }}>
            <QuestPreview quest={quest} variant="objective" />
          </div>
        )}
      </div>

      {quest.type === 'talk' && (
        <div className="card">
          <h3>{t('quest.targetNpcTitle')}</h3>
          <Field label={t('quest.requireTargetNpc')} hint={t('quest.requireTargetNpcHint')}>
            <PillSelect
              value={quest.targetNpc ? 'yes' : 'no'}
              options={[
                { value: 'no', label: t('quest.talkToGiver') },
                { value: 'yes', label: t('quest.visitTarget') },
              ]}
              onChange={(v) =>
                v === 'yes'
                  ? setTarget({})
                  : onChange({ ...quest, targetNpc: undefined })
              }
            />
          </Field>

          {quest.targetNpc && (
            <>
              <div className="grid-2">
                <TextInput
                  label={t('quest.targetName')}
                  value={quest.targetNpc.name}
                  onChange={(name) =>
                    setTarget({ name, tag: toIdentifier(name, quest.targetNpc!.tag) })
                  }
                />
                <TextInput
                  label={t('quest.targetTag')}
                  value={quest.targetNpc.tag}
                  onChange={(tag) => setTarget({ tag: toIdentifier(tag) })}
                />
              </div>
              <DataListInput
                label={t('quest.targetEntityType')}
                hint={t('quest.targetEntityHint')}
                value={quest.targetNpc.entityType ?? 'minecraft:villager'}
                onChange={(entityType) => setTarget({ entityType })}
                options={mobOptions}
                listId="mc-mob-list"
                placeholder={t('quest.villagerPlaceholder')}
              />
              {isVillager(quest.targetNpc.entityType) ? (
                <BabySelect
                  value={quest.targetNpc.baby}
                  onChange={(baby) => setTarget({ baby })}
                />
              ) : (
                <VariantFields
                  entityType={quest.targetNpc.entityType}
                  variants={quest.targetNpc.variants}
                  onChange={(variants) => setTarget({ variants })}
                />
              )}
              <TextArea
                label={t('quest.targetDialogue')}
                hint={t('quest.targetDialogueHint')}
                value={quest.targetNpc.dialogue}
                onChange={(dialogue) => setTarget({ dialogue })}
              />
              <Select
                label={tc('spawnMode.targetSpawn')}
                value={quest.targetNpc.spawnMode}
                options={spawnModes}
                onChange={(spawnMode) =>
                  setTarget({
                    spawnMode,
                    coordinates:
                      spawnMode === 'fixed'
                        ? quest.targetNpc!.coordinates ?? { x: 0, y: 64, z: 0 }
                        : quest.targetNpc!.coordinates,
                  })
                }
              />
              {quest.targetNpc.spawnMode === 'fixed' && (
                <CoordsRow
                  value={quest.targetNpc.coordinates ?? { x: 0, y: 64, z: 0 }}
                  onChange={(coordinates) => setTarget({ coordinates })}
                />
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
