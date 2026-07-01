import { useTranslation } from 'react-i18next';
import { HintTooltip } from './ui/HintTooltip';

interface Props {
  onClose: () => void;
}

const VIEW_KEYS = [
  'flow',
  'editor',
  'items',
  'jobs',
  'advancements',
  'commands',
  'export',
] as const;

export function HelpPanel({ onClose }: Props) {
  const { t } = useTranslation('help');
  const { t: tc } = useTranslation('common');

  return (
    <div className="help-panel">
      <div className="row-between" style={{ marginBottom: 12 }}>
        <div className="page-header-title-row">
          <h3 style={{ margin: 0 }}>{t('title')}</h3>
          <HintTooltip text={t('introHint')} label={t('title')} />
        </div>
        <button className="icon-btn" onClick={onClose} title={t('closeTitle')}>
          {tc('actions.close')}
        </button>
      </div>

      <p className="muted" style={{ marginTop: 0 }}>
        {t('intro')}
      </p>

      <details className="help-shortcuts" style={{ marginBottom: 16 }}>
        <summary className="export-details-summary subtle">{t('shortcutsTitle')}</summary>
        <p className="muted" style={{ margin: '8px 0 0', fontSize: 13, lineHeight: 1.5 }}>
          {t('introHint')}
        </p>
      </details>

      <div
        className="help-views"
        style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}
      >
        {VIEW_KEYS.map((key) => (
          <div key={key} className="help-view">
            <strong>{t(`views.${key}.title`)}</strong>
            <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
              {t(`views.${key}.summary`)}
            </div>
            <details style={{ marginTop: 8 }}>
              <summary className="export-details-summary subtle" style={{ fontSize: 12 }}>
                {tc('actions.more')}
              </summary>
              <div className="muted" style={{ fontSize: 12, marginTop: 6, lineHeight: 1.5 }}>
                {t(`views.${key}.body`)}
              </div>
            </details>
          </div>
        ))}
      </div>
    </div>
  );
}
