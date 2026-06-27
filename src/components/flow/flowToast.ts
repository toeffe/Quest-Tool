let toastEl: HTMLDivElement | null = null;
let hideTimer: ReturnType<typeof setTimeout> | null = null;

export function showFlowToast(message: string, durationMs = 4000): void {
  if (typeof document === 'undefined') return;

  if (!toastEl) {
    toastEl = document.createElement('div');
    toastEl.className = 'flow-toast';
    toastEl.setAttribute('role', 'status');
    toastEl.setAttribute('aria-live', 'polite');
    document.body.appendChild(toastEl);
  }

  toastEl.textContent = message;
  toastEl.classList.add('visible');

  if (hideTimer) clearTimeout(hideTimer);
  hideTimer = setTimeout(() => {
    toastEl?.classList.remove('visible');
  }, durationMs);
}
