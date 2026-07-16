/**
 * Project-level world containers that are placed and periodically refilled.
 */

import { type AppLocale, DEFAULT_LOCALE } from '../i18n/types';
import { defaultsT } from '../i18n/useLabels';
import { uid } from './ids';
import type { Coordinates, ZoneDrop } from './quest';

export const CONTAINER_BLOCK_TYPES = [
  'minecraft:chest',
  'minecraft:trapped_chest',
  'minecraft:barrel',
] as const;

export type ContainerBlockType = (typeof CONTAINER_BLOCK_TYPES)[number];

export interface WorldContainer {
  id: string;
  name: string;
  blockType: ContainerBlockType;
  location: Coordinates;
  /** Seconds between refills (default 300). */
  refillIntervalSeconds: number;
  /** Items placed into the container on each refill (reuse ZoneDrop shape). */
  stock: ZoneDrop[];
}

const DEFAULT_REFILL_SECONDS = 300;

export function createWorldContainer(
  name?: string,
  locale: AppLocale = DEFAULT_LOCALE,
): WorldContainer {
  const t = defaultsT(locale);
  return {
    id: uid(),
    name: name ?? t('container.name'),
    blockType: 'minecraft:chest',
    location: { x: 0, y: 64, z: 0 },
    refillIntervalSeconds: DEFAULT_REFILL_SECONDS,
    stock: [],
  };
}

export function isContainerBlockType(value: string): value is ContainerBlockType {
  return (CONTAINER_BLOCK_TYPES as readonly string[]).includes(value);
}
