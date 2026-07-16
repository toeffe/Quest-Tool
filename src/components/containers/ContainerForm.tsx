import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { ValidationIssue } from '../../generator/validate';
import {
  CONTAINER_BLOCK_TYPES,
  type ContainerBlockType,
  type WorldContainer,
} from '../../types/container';
import type { Project, ZoneDrop } from '../../types/quest';
import { MobDropRow } from '../customMobs/MobDropRow';
import { defaultZoneDrop } from '../customMobs/mobDropHelpers';
import { ValidationBar } from '../editor/ValidationBar';
import { asRequiredNumber, NumberInput, Select, TextInput } from '../ui/Field';

interface Props {
  container: WorldContainer;
  project: Project;
  issues: ValidationIssue[];
  onChange: (patch: Partial<WorldContainer>) => void;
}

export function ContainerForm({ container, project, issues, onChange }: Props) {
  const { t } = useTranslation('containers');
  const dimensions = project.dimensions ?? [];
  const customItems = project.customItems ?? [];

  const blockOptions = useMemo(
    () =>
      CONTAINER_BLOCK_TYPES.map((value) => ({
        value,
        label:
          value === 'minecraft:chest'
            ? t('editor.blockChest')
            : value === 'minecraft:trapped_chest'
              ? t('editor.blockTrappedChest')
              : t('editor.blockBarrel'),
      })),
    [t],
  );

  const dimensionOptions = useMemo(
    () => [
      { value: '', label: t('overworld') },
      ...dimensions.map((d) => ({ value: d.id, label: d.name })),
    ],
    [dimensions, t],
  );

  const updateStock = (stock: ZoneDrop[]) => onChange({ stock });

  return (
    <div>
      <TextInput
        label={t('editor.name')}
        value={container.name}
        onChange={(name) => onChange({ name })}
      />
      <Select
        label={t('editor.blockType')}
        value={container.blockType}
        options={blockOptions}
        onChange={(blockType) => onChange({ blockType: blockType as ContainerBlockType })}
      />
      <Select
        label={t('editor.dimension')}
        value={container.location.dimensionId ?? ''}
        options={dimensionOptions}
        onChange={(dimensionId) =>
          onChange({
            location: {
              ...container.location,
              dimensionId: dimensionId || undefined,
            },
          })
        }
      />
      <div className="field">
        <label>{t('editor.location')}</label>
        <div className="hint">{t('editor.coordsHint')}</div>
        <div className="row" style={{ gap: 8 }}>
          <NumberInput
            label="X"
            value={container.location.x}
            onChange={asRequiredNumber((x) => onChange({ location: { ...container.location, x } }))}
          />
          <NumberInput
            label="Y"
            value={container.location.y}
            onChange={asRequiredNumber((y) => onChange({ location: { ...container.location, y } }))}
          />
          <NumberInput
            label="Z"
            value={container.location.z}
            onChange={asRequiredNumber((z) => onChange({ location: { ...container.location, z } }))}
          />
        </div>
      </div>
      <NumberInput
        label={t('editor.refillInterval')}
        hint={t('editor.refillHint')}
        value={container.refillIntervalSeconds}
        min={1}
        onChange={asRequiredNumber((refillIntervalSeconds) =>
          onChange({ refillIntervalSeconds: Math.max(1, refillIntervalSeconds) }),
        )}
      />

      <div className="field" style={{ marginTop: 16 }}>
        <div className="row-between" style={{ marginBottom: 8 }}>
          <div>
            <label>{t('editor.stock')}</label>
            <div className="hint">{t('editor.stockHint')}</div>
          </div>
          <button
            type="button"
            className="btn small"
            onClick={() => updateStock([...(container.stock ?? []), defaultZoneDrop()])}
          >
            {t('editor.addStock')}
          </button>
        </div>
        {(container.stock ?? []).length === 0 && <p className="muted">{t('editor.emptyStock')}</p>}
        {(container.stock ?? []).map((drop, di) => (
          <MobDropRow
            key={di}
            drop={drop}
            customItems={customItems}
            onChange={(patch) => {
              const stock = (container.stock ?? []).map((d, idx) =>
                idx === di ? { ...d, ...patch } : d,
              );
              updateStock(stock);
            }}
            onRemove={() => {
              updateStock((container.stock ?? []).filter((_, idx) => idx !== di));
            }}
          />
        ))}
      </div>

      <ValidationBar issues={issues} />
    </div>
  );
}
