import { useTranslation } from 'react-i18next';
import type { CustomItem } from '../../types/item';
import type { ZoneDrop } from '../../types/quest';
import { PillSelect } from '../ui/Field';
import { zoneDropSource } from './mobDropHelpers';

interface Props {
  drop: ZoneDrop;
  customItems: CustomItem[];
  onChange: (patch: Partial<ZoneDrop>) => void;
  onRemove: () => void;
}

export function MobDropRow({ drop, customItems, onChange, onRemove }: Props) {
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
                onChange({
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
              onChange={(e) => onChange({ customItemId: e.target.value, target: undefined })}
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
