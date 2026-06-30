import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { type Coordinates, type Project, type Quest, type SpawnMode } from '../../types/quest';
import { CoordsWithDimension } from './CoordsWithDimension';
import { useDimensionOptions } from '../../hooks/useDimensionOptions';
import { TextInput, TextArea, Select, NumberInput, DataListInput } from '../ui/Field';
import { toIdentifier } from '../../types/ids';
import { useMobOptions, isVillager } from '../../data/mobs';
import { VariantFields, BabySelect } from './VariantFields';
import { QuestPreview } from '../preview/QuestPreview';

interface Props {
  quest: Quest;
  project: Project;
  onChange: (quest: Quest) => void;
}

const PROFESSIONS = [
  'none', 'armorer', 'butcher', 'cartographer', 'cleric', 'farmer', 'fisherman',
  'fletcher', 'leatherworker', 'librarian', 'mason', 'nitwit', 'shepherd',
  'toolsmith', 'weaponsmith',
];

const VARIANTS = ['plains', 'desert', 'jungle', 'savanna', 'snow', 'swamp', 'taiga'];

export function CoordsRow({
  value,
  onChange,
}: {
  value: Coordinates;
  onChange: (c: Coordinates) => void;
}) {
  const { t } = useTranslation('common');
  return (
    <div className="grid-3">
      <NumberInput label={t('coords.x')} value={value.x} onChange={(x) => onChange({ ...value, x })} />
      <NumberInput label={t('coords.y')} value={value.y} onChange={(y) => onChange({ ...value, y })} />
      <NumberInput label={t('coords.z')} value={value.z} onChange={(z) => onChange({ ...value, z })} />
    </div>
  );
}

export function StepNPC({ quest, project, onChange }: Props) {
  const { t } = useTranslation('editor');
  const { t: tc } = useTranslation('common');
  const mobOptions = useMobOptions();
  const dimensionOptions = useDimensionOptions(project);
  const npc = quest.npc;
  const update = (patch: Partial<typeof npc>) => onChange({ ...quest, npc: { ...npc, ...patch } });
  const updateDialogue = (patch: Partial<typeof npc.dialogue>) =>
    update({ dialogue: { ...npc.dialogue, ...patch } });

  const spawnModes = useMemo(
    (): { value: SpawnMode; label: string }[] => [
      { value: 'player', label: tc('spawnMode.playerRecommended') },
      { value: 'fixed', label: tc('spawnMode.fixed') },
      { value: 'manual', label: tc('spawnMode.manualPlace') },
    ],
    [tc],
  );

  return (
    <div>
      <h1 className="step-title">{t('npc.title')}</h1>
      <p className="step-sub">{t('npc.subtitle')}</p>

      <div className="card">
        <h3>{t('npc.identity')}</h3>
        <TextInput
          label={t('npc.npcName')}
          hint={t('npc.npcNameHint')}
          value={npc.name}
          onChange={(name) => update({ name, tag: toIdentifier(name, npc.tag) })}
        />
        <TextInput
          label={t('npc.uniqueTag')}
          hint={t('npc.uniqueTagHint')}
          value={npc.tag}
          onChange={(tag) => update({ tag: toIdentifier(tag) })}
        />
        <DataListInput
          label={t('npc.entityType')}
          hint={t('npc.entityTypeHint')}
          value={npc.entityType ?? 'minecraft:villager'}
          onChange={(entityType) => update({ entityType })}
          options={mobOptions}
          listId="mc-mob-list"
          placeholder={t('quest.villagerPlaceholder')}
        />
        {isVillager(npc.entityType) ? (
          <div className="grid-3">
            <Select
              label={t('npc.profession')}
              value={npc.profession}
              options={PROFESSIONS.map((p) => ({ value: p, label: tc(`professions.${p}` as 'professions.none') }) )}
              onChange={(profession) => update({ profession })}
            />
            <Select
              label={t('npc.biomeVariant')}
              value={npc.variant}
              options={VARIANTS.map((v) => ({ value: v, label: tc(`variants.${v}` as 'variants.plains') }) )}
              onChange={(variant) => update({ variant })}
            />
            <BabySelect value={npc.baby} onChange={(baby) => update({ baby })} />
          </div>
        ) : (
          <VariantFields
            entityType={npc.entityType}
            variants={npc.variants}
            onChange={(variants) => update({ variants })}
          />
        )}
      </div>

      <div className="card">
        <h3>{t('npc.dialogue')}</h3>
        <TextArea
          label={t('npc.greeting')}
          hint={t('npc.greetingHint')}
          value={npc.dialogue.greeting}
          onChange={(greeting) => updateDialogue({ greeting })}
        />
        <TextArea
          label={t('npc.offer')}
          hint={t('npc.offerHint')}
          value={npc.dialogue.offer}
          onChange={(offer) => updateDialogue({ offer })}
        />
        <TextArea
          label={t('npc.inProgress')}
          hint={t('npc.inProgressHint')}
          value={npc.dialogue.inProgress}
          onChange={(inProgress) => updateDialogue({ inProgress })}
        />
        <TextArea
          label={t('npc.completion')}
          hint={t('npc.completionHint')}
          value={npc.dialogue.completion}
          onChange={(completion) => updateDialogue({ completion })}
        />

        <div style={{ marginTop: 16 }}>
          <QuestPreview quest={quest} variant="dialogue" />
        </div>
      </div>

      <div className="card">
        <h3>{t('npc.spawnLocation')}</h3>
        <Select
          label={tc('spawnMode.howToPlace')}
          hint={tc('spawnMode.howToPlaceHint')}
          value={npc.spawnMode}
          options={spawnModes}
          onChange={(spawnMode) =>
            update({
              spawnMode,
              coordinates:
                spawnMode === 'fixed'
                  ? npc.coordinates ?? { x: 0, y: 64, z: 0 }
                  : npc.coordinates,
            })
          }
        />
        {npc.spawnMode === 'fixed' && (
          <CoordsWithDimension
            value={npc.coordinates ?? { x: 0, y: 64, z: 0 }}
            onChange={(coordinates) => update({ coordinates })}
            dimensionOptions={dimensionOptions}
          />
        )}
      </div>
    </div>
  );
}
