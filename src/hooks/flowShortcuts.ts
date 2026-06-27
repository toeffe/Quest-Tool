export interface FlowShortcutHandlers {
  onEscape?: () => boolean;
  onAutoArrange?: () => void;
  onFitView?: () => void;
  onNextError?: () => void;
}

let handlers: FlowShortcutHandlers | null = null;

export function registerFlowShortcuts(next: FlowShortcutHandlers): () => void {
  handlers = next;
  return () => {
    if (handlers === next) handlers = null;
  };
}

export function getFlowShortcuts(): FlowShortcutHandlers | null {
  return handlers;
}
