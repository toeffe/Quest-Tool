import { useCallback, useState } from 'react';
import { buildDatapackZip, datapackFileName } from '../generator/datapack';
import { hasBlockingErrors, validateProject } from '../generator/validate';
import { useProject } from '../store/useProjectStore';
import {
  buildTestDatapackZip,
  TEST_DATAPACK_ZIP_NAME,
} from '../fixtures/testDatapackProject';

interface ExportState {
  busy: boolean;
  downloaded: boolean;
  testDownloaded: boolean;
  error: string | null;
  testError: string | null;
}

/** Export flow with non-blocking UI thread via setTimeout. */
export function useExport() {
  const project = useProject();
  const [state, setState] = useState<ExportState>({
    busy: false,
    downloaded: false,
    testDownloaded: false,
    error: null,
    testError: null,
  });

  const downloadDatapack = useCallback(async () => {
    const issues = validateProject(project);
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
        error: err instanceof Error ? err.message : 'Export failed',
      }));
    }
  }, [project]);

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
        testError: err instanceof Error ? err.message : 'Test pack export failed',
      }));
    }
  }, []);

  return { ...state, downloadDatapack, downloadTestDatapack };
}
