const INSPECTOR_WIDTH_KEY = 'quest-tool-flow-inspector-width';
const TIP_DISMISSED_KEY = 'quest-tool-flow-tip-dismissed';
const LEGEND_DISMISSED_KEY = 'quest-tool-flow-legend-dismissed';

const DEFAULT_INSPECTOR_WIDTH = 440;
const MIN_INSPECTOR_WIDTH = 360;
const MAX_INSPECTOR_WIDTH = 900;

export function getFlowInspectorWidth(): number {
  try {
    const stored = localStorage.getItem(INSPECTOR_WIDTH_KEY);
    if (stored) {
      const n = Number(stored);
      if (!Number.isNaN(n)) return clampInspectorWidth(n);
    }
  } catch {
    // ignore
  }
  return DEFAULT_INSPECTOR_WIDTH;
}

export function setFlowInspectorWidth(width: number): void {
  try {
    localStorage.setItem(INSPECTOR_WIDTH_KEY, String(clampInspectorWidth(width)));
  } catch {
    // ignore
  }
}

export function clampInspectorWidth(width: number): number {
  const max = typeof window !== 'undefined' ? Math.min(MAX_INSPECTOR_WIDTH, window.innerWidth * 0.6) : MAX_INSPECTOR_WIDTH;
  return Math.min(max, Math.max(MIN_INSPECTOR_WIDTH, width));
}

export function isFlowTipDismissed(): boolean {
  try {
    return localStorage.getItem(TIP_DISMISSED_KEY) === '1';
  } catch {
    return false;
  }
}

export function dismissFlowTip(): void {
  try {
    localStorage.setItem(TIP_DISMISSED_KEY, '1');
  } catch {
    // ignore
  }
}

export function isFlowLegendDismissed(): boolean {
  try {
    return localStorage.getItem(LEGEND_DISMISSED_KEY) === '1';
  } catch {
    return false;
  }
}

export function dismissFlowLegend(): void {
  try {
    localStorage.setItem(LEGEND_DISMISSED_KEY, '1');
  } catch {
    // ignore
  }
}

export { DEFAULT_INSPECTOR_WIDTH };
