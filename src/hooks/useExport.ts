import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { buildTestDatapackZip, TEST_DATAPACK_ZIP_NAME } from '../fixtures/testDatapackProject';
import {
  buildDatapackZip,
  buildResourcePackZip,
  datapackFileName,
  resourcePackFileName,
} from '../generator/datapack';
import { projectHasSkinTextures } from '../generator/mobSkins';
import { hasBlockingErrors, validateProject } from '../generator/validate';
import { getAppLocale } from '../i18n';
import { useProject } from '../store/useProjectStore';

interface ExportState {
  busy: boolean;
  downloaded: boolean;
  resourcePackDownloaded: boolean;
  testDownloaded: boolean;
  error: string | null;
  resourcePackError: string | null;
  testError: string | null;
}

/** Export flow with non-blocking UI thread via setTimeout. */
export function useExport() {
  const { t } = useTranslation('export');
  const project = useProject();
  const [state, setState] = useState<ExportState>({
    busy: false,
    downloaded: false,
    resourcePackDownloaded: false,
    testDownloaded: false,
    error: null,
    resourcePackError: null,
    testError: null,
  });

  const hasSkins = projectHasSkinTextures(project);

  const downloadDatapack = useCallback(async () => {
    const issues = validateProject(project, getAppLocale());
    if (hasBlockingErrors(issues)) return;

    setState((s) => ({ ...s, busy: true, downloaded: false, error: null }));
    try {
      const blob = await new Promise<Blob>((resolve, reject) => {
        window.setTimeout(async () => {
          try {
            resolve(await buildDatapackZip(project));
          } catch (err) {
            reject(err);
          }
        }, 0);
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = datapackFileName(project);
      a.click();
      URL.revokeObjectURL(url);
      setState((s) => ({ ...s, busy: false, downloaded: true, error: null }));
    } catch (err) {
      setState((s) => ({
        ...s,
        busy: false,
        downloaded: false,
        error: err instanceof Error ? err.message : t('exportCard.exportFailed'),
      }));
    }
  }, [project, t]);

  const downloadResourcePack = useCallback(async () => {
    const issues = validateProject(project, getAppLocale());
    if (hasBlockingErrors(issues)) return;
    if (!projectHasSkinTextures(project)) return;

    setState((s) => ({ ...s, busy: true, resourcePackDownloaded: false, resourcePackError: null }));
    try {
      const blob = await new Promise<Blob>((resolve, reject) => {
        window.setTimeout(async () => {
          try {
            resolve(await buildResourcePackZip(project));
          } catch (err) {
            reject(err);
          }
        }, 0);
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = resourcePackFileName(project);
      a.click();
      URL.revokeObjectURL(url);
      setState((s) => ({
        ...s,
        busy: false,
        resourcePackDownloaded: true,
        resourcePackError: null,
      }));
    } catch (err) {
      setState((s) => ({
        ...s,
        busy: false,
        resourcePackDownloaded: false,
        resourcePackError:
          err instanceof Error ? err.message : t('exportCard.resourcePackExportFailed'),
      }));
    }
  }, [project, t]);

  const downloadTestDatapack = useCallback(async () => {
    setState((s) => ({ ...s, busy: true, testDownloaded: false, testError: null }));
    try {
      const blob = await new Promise<Blob>((resolve, reject) => {
        window.setTimeout(async () => {
          try {
            resolve(await buildTestDatapackZip());
          } catch (err) {
            reject(err);
          }
        }, 0);
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = TEST_DATAPACK_ZIP_NAME;
      a.click();
      URL.revokeObjectURL(url);
      setState((s) => ({ ...s, busy: false, testDownloaded: true, testError: null }));
    } catch (err) {
      setState((s) => ({
        ...s,
        busy: false,
        testDownloaded: false,
        testError: err instanceof Error ? err.message : t('testPack.exportFailed'),
      }));
    }
  }, [t]);

  return { ...state, hasSkins, downloadDatapack, downloadResourcePack, downloadTestDatapack };
}
