import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  supportsCustomSkin,
  texturePathForSkin,
  variantAssetId,
  variantRegistryForEntity,
} from '../../data/mobVariantRegistry';
import { Field } from './Field';

interface Props {
  baseEntity: string;
  namespace: string;
  mobTag: string;
  value?: string;
  onChange: (skinTexture: string | undefined) => void;
}

export function SkinUploadField({ baseEntity, namespace, mobTag, value, onChange }: Props) {
  const { t } = useTranslation('customMobs');
  const inputRef = useRef<HTMLInputElement>(null);
  const canSkin = supportsCustomSkin(baseEntity);
  const registry = variantRegistryForEntity(baseEntity);
  const assetId =
    registry && mobTag.trim() ? variantAssetId(namespace, registry.textureFolder, mobTag) : null;
  const texturePath =
    registry && mobTag.trim()
      ? texturePathForSkin(namespace, registry.textureFolder, mobTag)
      : null;
  const isFrog = baseEntity.trim() === 'minecraft:frog';

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    if (file.type !== 'image/png') return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === 'string') onChange(result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <Field
      label={t('editor.skin')}
      hint={canSkin ? t('editor.skinHint') : undefined}
      note={!canSkin ? t('editor.skinUnsupported') : isFrog ? t('editor.skinFrogNote') : undefined}
    >
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {value && (
          <img
            src={value}
            alt=""
            style={{
              width: 64,
              height: 64,
              imageRendering: 'pixelated',
              border: '1px solid var(--border)',
              borderRadius: 4,
              background: 'var(--bg)',
            }}
          />
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input
            ref={inputRef}
            type="file"
            accept="image/png"
            disabled={!canSkin}
            style={{ maxWidth: 220 }}
            onChange={(e) => {
              handleFile(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
          {value && (
            <button className="btn small" type="button" onClick={() => onChange(undefined)}>
              {t('editor.skinClear')}
            </button>
          )}
        </div>
      </div>
      {canSkin && assetId && texturePath && (
        <details style={{ marginTop: 8 }}>
          <summary className="export-details-summary subtle" style={{ fontSize: 12 }}>
            {t('editor.skinPaths')}
          </summary>
          <code style={{ display: 'block', marginTop: 4, fontSize: 11 }}>
            {t('editor.skinAssetId', { path: assetId })}
          </code>
          <code style={{ display: 'block', marginTop: 4, fontSize: 11 }}>
            {t('editor.skinTexturePath', { path: texturePath })}
          </code>
        </details>
      )}
    </Field>
  );
}
