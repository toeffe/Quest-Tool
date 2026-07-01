import { BaseEdge, EdgeLabelRenderer, type EdgeProps, getSmoothStepPath } from '@xyflow/react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import type { FlowEdgeData } from './chainEdges';

export const StoryEdge = memo(function StoryEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
  selected,
}: EdgeProps) {
  const { t } = useTranslation('flow');
  const edgeData = data as FlowEdgeData | undefined;
  const broken = edgeData?.broken;
  const autoStart = edgeData?.autoStart;
  const requiresOnly = edgeData?.requiresOnly;
  const world = edgeData?.world;

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  const className = [
    'flow-edge-path',
    broken ? 'broken' : '',
    autoStart ? 'auto-start' : '',
    requiresOnly ? 'requires-only' : '',
    world ? 'world' : '',
    selected ? 'selected' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const labelText = edgeData?.label ? t(`edges.${edgeData.label}`) : '';

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        className={className}
        interactionWidth={24}
      />
      {labelText && (
        <EdgeLabelRenderer>
          <div
            className={`flow-edge-label ${broken ? 'broken' : ''} ${autoStart ? 'auto-start' : ''} ${world ? 'world' : ''} ${selected ? 'selected' : ''}`}
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: 'all',
            }}
          >
            {labelText}
            {!broken && !world && (
              <span className="flow-edge-label-hint">{t('edges.clickToUnlink')}</span>
            )}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
});
