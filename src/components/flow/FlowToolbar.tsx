import { Panel } from '@xyflow/react';
import { useTranslation } from 'react-i18next';
import { dismissFlowLegend, dismissFlowTip, isFlowLegendDismissed, isFlowTipDismissed } from './flowStorage';

interface Props {
  questCount: number;
  errorCount: number;
  warningCount: number;
  errorNavLabel?: string;
  showMinimap: boolean;
  errorsOnly: boolean;
  tipDismissed: boolean;
  legendDismissed: boolean;
  onAutoArrange: () => void;
  onFitView: () => void;
  onFitErrors: () => void;
  onNextError: () => void;
  onToggleMinimap: () => void;
  onToggleErrorsOnly: () => void;
  onDismissTip: () => void;
  onDismissLegend: () => void;
}

export function FlowToolbar({
  questCount,
  errorCount,
  warningCount,
  errorNavLabel = '',
  showMinimap,
  errorsOnly,
  tipDismissed,
  legendDismissed,
  onAutoArrange,
  onFitView,
  onFitErrors,
  onNextError,
  onToggleMinimap,
  onToggleErrorsOnly,
  onDismissTip,
  onDismissLegend,
}: Props) {
  const { t } = useTranslation('flow');
  const showTip = !tipDismissed && !isFlowTipDismissed();
  const showLegend = !legendDismissed && !isFlowLegendDismissed();

  return (
    <>
      <Panel position="top-center" className="flow-toolbar-panel">
        <div className="flow-toolbar">
          <button type="button" className="btn small" onClick={onAutoArrange} title={t('toolbar.autoArrangeTitle')}>
            {t('toolbar.autoArrange')}
          </button>
          <button type="button" className="btn small" onClick={onFitView} title={t('toolbar.fitViewTitle')}>
            {t('toolbar.fitView')}
          </button>
          <button
            type="button"
            className="btn small"
            onClick={onFitErrors}
            disabled={errorCount === 0}
            title={t('toolbar.fitErrorsTitle')}
          >
            {t('toolbar.fitErrors')}
          </button>
          <button
            type="button"
            className="btn small"
            onClick={onNextError}
            disabled={errorCount === 0}
            title={t('toolbar.nextErrorTitle')}
          >
            {t('toolbar.nextError')}
          </button>
          <button
            type="button"
            className={`btn small ${showMinimap ? 'active' : ''}`}
            onClick={onToggleMinimap}
            title={t('toolbar.minimapTitle')}
          >
            {t('toolbar.minimap')}
          </button>
          <button
            type="button"
            className={`btn small ${errorsOnly ? 'active' : ''}`}
            onClick={onToggleErrorsOnly}
            title={t('toolbar.errorsOnlyTitle')}
          >
            {t('toolbar.errorsOnly')}
          </button>
          <span className="flow-toolbar-status muted">
            {t('toolbar.questCount', { count: questCount })}
            {errorCount > 0 && ` · ${t('toolbar.errorCount', { count: errorCount })}`}
            {errorCount === 0 && warningCount > 0 && ` · ${t('toolbar.warningCount', { count: warningCount })}`}
            {errorNavLabel}
          </span>
        </div>
      </Panel>

      {showTip && (
        <Panel position="top-left">
          <div className="flow-tip flow-tip-dismissible">
            <span>
              {questCount <= 1 ? t('tips.singleQuest') : t('tips.multiQuest')}
            </span>
            <button
              type="button"
              className="flow-tip-dismiss"
              onClick={() => {
                dismissFlowTip();
                onDismissTip();
              }}
              aria-label={t('tips.dismissAria')}
            >
              ×
            </button>
          </div>
        </Panel>
      )}

      {showLegend && (
        <Panel position="bottom-left">
          <div className="flow-legend">
            <strong>{t('legend.title')}</strong>
            <ul>
              <li>{t('legend.linkPorts')}</li>
              <li>{t('legend.clickLink')}</li>
              <li>{t('legend.deleteKey')}</li>
              <li>{t('legend.arrowStyles')}</li>
              <li>{t('legend.startLocked')}</li>
              <li>{t('legend.clickStep')}</li>
            </ul>
            <button
              type="button"
              className="flow-tip-dismiss"
              onClick={() => {
                dismissFlowLegend();
                onDismissLegend();
              }}
              aria-label={t('legend.dismissAria')}
            >
              ×
            </button>
          </div>
        </Panel>
      )}
    </>
  );
}
