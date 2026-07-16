import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { showFlowToast } from '../components/flow/flowToast';
import { ClipboardError, type EntityKind } from '../state/clipboard';
import type { ActiveView } from '../store/uiStore';
import { useUIStore } from '../store/uiStore';
import { useProjectStore } from '../store/useProjectStore';

const VIEW_FOR_KIND: Record<EntityKind, ActiveView> = {
  quest: 'flow',
  customItem: 'items',
  customMob: 'mobs',
  job: 'jobs',
  dungeon: 'dungeons',
  dimension: 'dimensions',
  teleportPad: 'dimensions',
  container: 'containers',
};

export function useEntityClipboard() {
  const { t } = useTranslation('common');
  const copyEntityToClipboard = useProjectStore((s) => s.copyEntityToClipboard);
  const pasteFromClipboard = useProjectStore((s) => s.pasteFromClipboard);
  const setActiveView = useUIStore((s) => s.setActiveView);
  const setSelectedQuestId = useUIStore((s) => s.setSelectedQuestId);
  const setDimensionsFocus = useUIStore((s) => s.setDimensionsFocus);
  const setDungeonsFocus = useUIStore((s) => s.setDungeonsFocus);

  const focusPasted = useCallback(
    (kind: EntityKind, id: string) => {
      setActiveView(VIEW_FOR_KIND[kind]);
      if (kind === 'quest') setSelectedQuestId(id);
      if (kind === 'dimension') setDimensionsFocus({ kind: 'dimension', id });
      if (kind === 'teleportPad') setDimensionsFocus({ kind: 'pad', id });
      if (kind === 'dungeon') setDungeonsFocus(id);
    },
    [setActiveView, setDimensionsFocus, setDungeonsFocus, setSelectedQuestId],
  );

  const copyEntity = useCallback(
    async (kind: EntityKind, id: string) => {
      try {
        await copyEntityToClipboard(kind, id);
        showFlowToast(t('clipboard.copied'));
      } catch {
        showFlowToast(t('clipboard.denied'));
      }
    },
    [copyEntityToClipboard, t],
  );

  const pasteEntity = useCallback(async (): Promise<{ kind: EntityKind; id: string } | null> => {
    try {
      const result = await pasteFromClipboard();
      if (!result) return null;
      focusPasted(result.kind, result.id);
      showFlowToast(t('clipboard.pasted'));
      return result;
    } catch (e) {
      let message = t('clipboard.invalid');
      if (e instanceof ClipboardError) {
        if (e.message.includes('empty')) message = t('clipboard.empty');
        else if (e.message.includes('denied') || e.message.includes('Clipboard access'))
          message = t('clipboard.denied');
        else if (e.message.includes('version')) message = t('clipboard.unsupported');
      }
      showFlowToast(message);
      return null;
    }
  }, [focusPasted, pasteFromClipboard, t]);

  return { copyEntity, pasteEntity };
}
