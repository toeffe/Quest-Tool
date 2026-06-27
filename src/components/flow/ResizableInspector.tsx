import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  clampInspectorWidth,
  DEFAULT_INSPECTOR_WIDTH,
  getFlowInspectorWidth,
  setFlowInspectorWidth,
} from './flowStorage';

interface Props {
  children: ReactNode;
}

export function ResizableInspector({ children }: Props) {
  const [width, setWidth] = useState(getFlowInspectorWidth);
  const dragging = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(width);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      dragging.current = true;
      startX.current = e.clientX;
      startWidth.current = width;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      e.preventDefault();
    },
    [width],
  );

  const widthRef = useRef(width);
  widthRef.current = width;

  useEffect(() => {
    function onPointerMove(e: PointerEvent) {
      if (!dragging.current) return;
      const delta = startX.current - e.clientX;
      const next = clampInspectorWidth(startWidth.current + delta);
      setWidth(next);
    }

    function onPointerUp() {
      if (!dragging.current) return;
      dragging.current = false;
      setFlowInspectorWidth(widthRef.current);
    }

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, []);

  const onDoubleClick = useCallback(() => {
    setWidth(DEFAULT_INSPECTOR_WIDTH);
    setFlowInspectorWidth(DEFAULT_INSPECTOR_WIDTH);
  }, []);

  return (
    <div className="flow-inspector-wrap" style={{ width, ['--flow-inspector-width' as string]: `${width}px` }}>
      <div
        className="flow-inspector-resize-handle"
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize inspector"
        onPointerDown={onPointerDown}
        onDoubleClick={onDoubleClick}
        title="Drag to resize · double-click to reset"
      />
      {children}
    </div>
  );
}
