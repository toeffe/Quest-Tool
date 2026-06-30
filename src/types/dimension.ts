/**
 * Project-level custom dimensions and teleport pads.
 */

import { uid, toIdentifier } from './ids';
import { type AppLocale, DEFAULT_LOCALE } from '../i18n/types';
import { defaultsT } from '../i18n/useLabels';

export interface Dimension {
  id: string;
  name: string;
  /** Slug for datapack paths and execute in (namespace:tag). */
  tag: string;
  description?: string;
}

export interface DimensionRef {
  /** undefined = overworld (minecraft:overworld) */
  dimensionId?: string;
}

export interface PortalEndpoint extends DimensionRef {
  x: number;
  y: number;
  z: number;
  /** Half-extent for cubic AABB detection. */
  radius: number;
}

export interface TeleportDestination extends DimensionRef {
  x: number;
  y: number;
  z: number;
}

export interface TeleportPad {
  id: string;
  name: string;
  at: PortalEndpoint;
  to: TeleportDestination;
  cooldownSeconds?: number;
}

export function createPortalEndpoint(
  overrides: Partial<PortalEndpoint> = {},
): PortalEndpoint {
  return {
    x: 0,
    y: 64,
    z: 0,
    radius: 2,
    ...overrides,
  };
}

export function createDimension(
  name?: string,
  locale: AppLocale = DEFAULT_LOCALE,
): Dimension {
  const t = defaultsT(locale);
  const dimensionName = name ?? t('dimension.name');
  const tag = toIdentifier(dimensionName, 'dimension');
  return {
    id: uid(),
    name: dimensionName,
    tag,
  };
}

export function createTeleportPad(
  name?: string,
  locale: AppLocale = DEFAULT_LOCALE,
): TeleportPad {
  const t = defaultsT(locale);
  const padName = name ?? t('pad.name');
  return {
    id: uid(),
    name: padName,
    at: createPortalEndpoint({ radius: 1 }),
    to: { x: 0, y: 64, z: 0 },
    cooldownSeconds: 1,
  };
}

/** @deprecated Removed in schema v10 — used only during migration from portal links. */
export interface LegacyPortalLink {
  id: string;
  name: string;
  from: PortalEndpoint;
  to: PortalEndpoint;
  bidirectional: boolean;
}
