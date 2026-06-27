import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { type Platform } from '../../types/quest';
import { type AppLocale } from '../../i18n/types';
import { usePlatformLabels } from '../../i18n/useLabels';
import { useProjectStore } from '../../store/useProjectStore';
import { useLocaleStore } from '../../store/localeStore';
import { useUIStore } from '../../store/uiStore';
import { readProjectJsonFromFile } from '../../state/projectStore';
import { createProject } from '../../types/factory';

export function SettingsDialog() {
  const { t } = useTranslation('common');
  const platformLabels = usePlatformLabels();
  const appLocale = useLocaleStore((s) => s.locale);
  const setAppLocale = useLocaleStore((s) => s.setLocale);
  const project = useProjectStore((s) => s.project);
  const setProjectMeta = useProjectStore((s) => s.setProjectMeta);
  const importProject = useProjectStore((s) => s.importProject);
  const setProject = useProjectStore((s) => s.setProject);
  const setSettingsOpen = useUIStore((s) => s.setSettingsOpen);
  const setSelectedQuestId = useUIStore((s) => s.setSelectedQuestId);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const json = await readProjectJsonFromFile(file);
      importProject(json);
      const imported = useProjectStore.getState().project;
      setSelectedQuestId(imported.quests[0]?.id ?? null);
      setSettingsOpen(false);
    } catch (err) {
      alert(t('settings.importError', { message: (err as Error).message }));
    }
    e.target.value = '';
  }

  function handleReset() {
    if (!confirm(t('settings.resetConfirm'))) return;
    const fresh = createProject();
    setProject(fresh);
    setSelectedQuestId(fresh.quests[0]?.id ?? null);
    setSettingsOpen(false);
  }

  return (
    <div
      className="dialog-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
      onClick={() => setSettingsOpen(false)}
      onKeyDown={(e) => e.key === 'Escape' && setSettingsOpen(false)}
    >
      <div className="dialog-panel" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-head">
          <h2 id="settings-title" className="dialog-title">
            {t('settings.title')}
          </h2>
          <button type="button" className="icon-btn" onClick={() => setSettingsOpen(false)}>
            {t('actions.close')}
          </button>
        </div>

        <div className="dialog-body">
          <div className="field">
            <label htmlFor="settings-app-locale">{t('settings.appLanguage')}</label>
            <select
              id="settings-app-locale"
              value={appLocale}
              onChange={(e) => setAppLocale(e.target.value as AppLocale)}
            >
              <option value="da">{t('settings.localeDa')}</option>
              <option value="en">{t('settings.localeEn')}</option>
            </select>
            <div className="hint">{t('settings.appLanguageHint')}</div>
          </div>

          <div className="field">
            <label htmlFor="settings-project-locale">{t('settings.projectLanguage')}</label>
            <select
              id="settings-project-locale"
              value={project.locale ?? 'da'}
              onChange={(e) => setProjectMeta({ locale: e.target.value as AppLocale })}
            >
              <option value="da">{t('settings.localeDa')}</option>
              <option value="en">{t('settings.localeEn')}</option>
            </select>
            <div className="hint">{t('settings.projectLanguageHint')}</div>
          </div>

          <div className="field">
            <label htmlFor="settings-name">{t('settings.projectName')}</label>
            <input
              id="settings-name"
              value={project.name}
              onChange={(e) => setProjectMeta({ name: e.target.value })}
            />
          </div>

          <div className="field">
            <label htmlFor="settings-namespace">{t('settings.namespace')}</label>
            <input
              id="settings-namespace"
              value={project.namespace}
              onChange={(e) => setProjectMeta({ namespace: e.target.value })}
              placeholder={t('settings.namespacePlaceholder')}
            />
            <div className="hint">{t('settings.namespaceHint')}</div>
          </div>

          <div className="field">
            <label htmlFor="settings-platform">{t('settings.platform')}</label>
            <select
              id="settings-platform"
              value={project.platform}
              onChange={(e) => setProjectMeta({ platform: e.target.value as Platform })}
            >
              {(Object.keys(platformLabels) as Platform[]).map((p) => (
                <option key={p} value={p}>
                  {platformLabels[p]}
                </option>
              ))}
            </select>
          </div>

          <div className="settings-section">
            <label>{t('settings.importSection')}</label>
            <p className="hint">{t('settings.importHint')}</p>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json,.zip,application/zip"
              style={{ display: 'none' }}
              onChange={handleImport}
            />
            <button type="button" className="btn" onClick={() => fileRef.current?.click()}>
              {t('settings.importButton')}
            </button>
          </div>

          <div className="settings-section danger">
            <label>{t('settings.dangerZone')}</label>
            <button type="button" className="btn danger" onClick={handleReset}>
              {t('settings.resetProject')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
