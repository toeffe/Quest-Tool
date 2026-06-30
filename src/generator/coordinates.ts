import { type CompileContext } from './context';
import { type PortalEndpoint } from '../types/dimension';
import { toIdentifier } from '../types/ids';

export const OVERWORLD_DIMENSION = 'minecraft:overworld';

/** Resolve a project dimension id to a Minecraft dimension resource location. */
export function resolveDimensionId(
  ctx: CompileContext,
  dimensionId?: string,
): string {
  if (!dimensionId) return OVERWORLD_DIMENSION;
  const dim = (ctx.project.dimensions ?? []).find((d) => d.id === dimensionId);
  if (!dim) return OVERWORLD_DIMENSION;
  const tag = toIdentifier(dim.tag, 'dimension');
  return `${ctx.namespace}:${tag}`;
}

export function executeInDimension(dimensionId: string, inner: string): string {
  return `execute in ${dimensionId} run ${inner}`;
}

export function endpointToSelector(endpoint: Pick<PortalEndpoint, 'x' | 'y' | 'z' | 'radius'>): {
  x: number;
  y: number;
  z: number;
  dx: number;
  dy: number;
  dz: number;
} {
  const r = Math.max(1, endpoint.radius ?? 1);
  return {
    x: endpoint.x - r,
    y: endpoint.y - r,
    z: endpoint.z - r,
    dx: r * 2,
    dy: r * 2,
    dz: r * 2,
  };
}

export function playerBoxSelector(
  endpoint: Pick<PortalEndpoint, 'x' | 'y' | 'z' | 'radius'>,
): string {
  const s = endpointToSelector(endpoint);
  return `@a[x=${s.x},y=${s.y},z=${s.z},dx=${s.dx},dy=${s.dy},dz=${s.dz}]`;
}

/** Absolute AABB args for `if entity @s[x=...,dx=...]` checks (per-player, dimension-safe). */
export function endpointBoxArgs(
  endpoint: Pick<PortalEndpoint, 'x' | 'y' | 'z' | 'radius'>,
): string {
  const s = endpointToSelector(endpoint);
  return `x=${s.x},y=${s.y},z=${s.z},dx=${s.dx},dy=${s.dy},dz=${s.dz}`;
}

/**
 * Spherical detection radius from pad center. Wider than the editor radius so walking
 * players (feet ~1 block above floor Y) still match; landing from above already worked.
 */
export function padDetectionDistance(radius?: number): number {
  const r = Math.max(1, radius ?? 1);
  return r + 1;
}

/**
 * Run pad detection in a dimension, anchored at the pad center.
 * `distance=..N` is measured from the positioned point in that dimension only.
 */
export function scopePadDetectionAt(
  dimensionId: string,
  x: number,
  y: number,
  z: number,
  command: string,
): string {
  return `execute in ${dimensionId} positioned ${x} ${y} ${z} run ${command}`;
}

/** @deprecated Use {@link scopePadDetectionAt} for pad detection. */
export function scopePadDetection(dimensionId: string, command: string): string {
  return `execute in ${dimensionId} run ${command}`;
}

/** Snap integer coords to block center on X/Z so teleports match how players land in-game. */
export function blockCenterCoord(value: number): number {
  return Math.floor(value) + 0.5;
}

export function tpLine(dimensionId: string, x: number, y: number, z: number): string {
  const tx = Number.isInteger(x) ? blockCenterCoord(x) : x;
  const tz = Number.isInteger(z) ? blockCenterCoord(z) : z;
  return executeInDimension(dimensionId, `tp @s ${tx} ${y} ${tz}`);
}

/** Wrap a command that uses world coordinates so it runs in the given dimension. */
export function scopeCommandInDimension(
  ctx: CompileContext,
  projectDimensionId: string | undefined,
  command: string,
): string {
  const dim = resolveDimensionId(ctx, projectDimensionId);
  if (dim === OVERWORLD_DIMENSION) return command;
  return executeInDimension(dim, command);
}
