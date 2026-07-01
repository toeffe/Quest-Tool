import { type BoundingBox, boundsVolume, normalizeBounds } from '../../types/dungeon';
import { Field, NumberInput } from '../ui/Field';

interface Props {
  bounds: BoundingBox;
  onChange: (b: BoundingBox) => void;
  t: (key: string, opts?: Record<string, unknown>) => string;
  tc: (key: string) => string;
}

export function DungeonBoundsEditor({ bounds, onChange, t, tc }: Props) {
  const update = (patch: Partial<BoundingBox>) => {
    onChange(normalizeBounds({ ...bounds, ...patch }));
  };

  const vol = boundsVolume(bounds);
  const norm = normalizeBounds(bounds);

  return (
    <Field label={t('editor.bounds')} hint={t('editor.boundsVolume', { count: vol })}>
      <div className="bounds-editor">
        <div>
          <span className="bounds-corner-label">{t('editor.boundsMin')}</span>
          <div className="grid-3">
            <NumberInput
              label={tc('coords.x')}
              value={bounds.x1}
              onChange={(x1) => update({ x1 })}
            />
            <NumberInput
              label={tc('coords.y')}
              value={bounds.y1}
              onChange={(y1) => update({ y1 })}
            />
            <NumberInput
              label={tc('coords.z')}
              value={bounds.z1}
              onChange={(z1) => update({ z1 })}
            />
          </div>
        </div>
        <div>
          <span className="bounds-corner-label">{t('editor.boundsMax')}</span>
          <div className="grid-3">
            <NumberInput
              label={tc('coords.x')}
              value={bounds.x2}
              onChange={(x2) => update({ x2 })}
            />
            <NumberInput
              label={tc('coords.y')}
              value={bounds.y2}
              onChange={(y2) => update({ y2 })}
            />
            <NumberInput
              label={tc('coords.z')}
              value={bounds.z2}
              onChange={(z2) => update({ z2 })}
            />
          </div>
        </div>
      </div>
      <div className="bounds-summary">
        ({norm.x1}, {norm.y1}, {norm.z1}) → ({norm.x2}, {norm.y2}, {norm.z2})
      </div>
    </Field>
  );
}
