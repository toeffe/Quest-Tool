import { useCallback, useState } from 'react';
import { buildDatapackZip, datapackFileName } from '../generator/datapack';
import { hasBlockingErrors, validateProject } from '../generator/validate';
import { useProject } from '../store/useProjectStore';

interface ExportState {
  busy: boolean;
  downloaded: boolean;
  error: string | null;
}

/** Export flow with non-blocking UI thread via setTimeout. */
export function useExport() {
  const project = useProject();
  const [state, setState] = useState<ExportState>({
    busy: false,
    downloaded: false,
    error: null,
  });

  const downloadDatapack = useCallback(async () => {
    const issues = validateProject(project);
    if (hasBlockingErrors(issues)) return;

    setState({ busy: true, downloaded: false, error: null });
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
      setState({ busy: false, downloaded: true, error: null });
    } catch (err) {
      setState({
        busy: false,
        downloaded: false,
        error: err instanceof Error ? err.message : 'Export failed',
      });
    }
  }, [project]);

  return { ...state, downloadDatapack };
}
