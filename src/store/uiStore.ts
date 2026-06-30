import { create } from 'zustand';

export type ActiveView = 'editor' | 'flow' | 'items' | 'mobs' | 'dungeons' | 'dimensions' | 'jobs' | 'advancements' | 'commands' | 'export';

interface UIStore {
  activeView: ActiveView;
  selectedQuestId: string | null;
  dimensionsFocus: { kind: 'dimension' | 'pad'; id: string } | null;
  dungeonsFocus: string | null;
  commandPaletteOpen: boolean;
  settingsOpen: boolean;
  helpOpen: boolean;
  setActiveView: (view: ActiveView) => void;
  setSelectedQuestId: (id: string | null) => void;
  setDimensionsFocus: (focus: { kind: 'dimension' | 'pad'; id: string } | null) => void;
  setDungeonsFocus: (id: string | null) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setSettingsOpen: (open: boolean) => void;
  setHelpOpen: (open: boolean) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  activeView: 'flow',
  selectedQuestId: null,
  dimensionsFocus: null,
  dungeonsFocus: null,
  commandPaletteOpen: false,
  settingsOpen: false,
  helpOpen: false,
  setActiveView: (activeView) => set({ activeView }),
  setSelectedQuestId: (selectedQuestId) => set({ selectedQuestId }),
  setDimensionsFocus: (dimensionsFocus) => set({ dimensionsFocus }),
  setDungeonsFocus: (dungeonsFocus) => set({ dungeonsFocus }),
  setCommandPaletteOpen: (commandPaletteOpen) => set({ commandPaletteOpen }),
  setSettingsOpen: (settingsOpen) => set({ settingsOpen }),
  setHelpOpen: (helpOpen) => set({ helpOpen }),
}));
