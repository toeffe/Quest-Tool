import { useTranslation } from 'react-i18next';

interface Props {
  onClose: () => void;
}

const VIEW_KEYS = ['flow', 'editor', 'items', 'jobs', 'advancements', 'commands', 'export'] as const;

export function HelpPanel({ onClose }: Props) {
  const { t } = useTranslation('help');
  const { t: tc } = useTranslation('common');

  return (
    <div className="help-panel">
      <div className="row-between" style={{ marginBottom: 12 }}>
        <h3 style={{ margin: 0 }}>{t('title')}</h3>
        <button className="icon-btn" onClick={onClose} title={t('closeTitle')}>
          {tc('actions.close')}
        </button>
      </div>

      <p className="muted" style={{ marginTop: 0 }}>
        {t('intro')}
      </p>

      <div
        className="help-views"
        style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}
      >
        {VIEW_KEYS.map((key) => (
          <div key={key} className="help-view">
            <strong>{t(`views.${key}.title`)}</strong>
            <div className="muted">{t(`views.${key}.body`)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
