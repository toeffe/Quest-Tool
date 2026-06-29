/**
 * Project-level custom mob definitions for Minecraft 1.21.11.
 * Custom mobs are stat-modified vanilla entities identified by entity tags.
 */

import { type ZoneDrop } from './quest';

export type CustomMobEquipmentSlot =
  | 'head'
  | 'chest'
  | 'legs'
  | 'feet'
  | 'mainhand'
  | 'offhand';

export type CustomMobBossBarColor =
  | 'pink'
  | 'blue'
  | 'red'
  | 'green'
  | 'yellow'
  | 'purple'
  | 'white';

export interface CustomMobEquipment {
  slot: CustomMobEquipmentSlot;
  item: string;
}

export interface CustomMobPhaseEffect {
  effectId: string;
  amplifier?: number;
  /** Duration in ticks. Omit or 0 for infinite while the phase lasts. */
  duration?: number;
}

/** Boss phase: starting phase has no threshold; later phases trigger at or below a health %. */
export interface CustomMobPhase {
  id: string;
  /** Editor label for this phase. */
  name: string;
  /** Enter when HP drops to this percent or below. Omit on the first phase only. */
  atHealthPercent?: number;
  /** In-game name when this phase is active. */
  displayName?: string;
  /** Max health override for this phase (applied on transition). */
  health?: number;
  /** Attack damage override for this phase. */
  damage?: number;
  /** Glowing while this phase is active. */
  glowing?: boolean;
  /** Boss bar color while this phase is active. */
  bossBarColor?: CustomMobBossBarColor;
  /** Appearance overrides for this phase. */
  variants?: Record<string, string>;
  /** Equipment replaced when entering this phase. */
  equipment?: CustomMobEquipment[];
  /** Status effects applied when entering this phase. */
  effects?: CustomMobPhaseEffect[];
  /** Chat message shown to nearby players when this phase begins. */
  announceMessage?: string;
}

export interface CustomMob {
  id: string;
  /** Editor label (not shown in-game). */
  name: string;
  /** Slug used as entity tag, e.g. "undead_captain". Must be unique per project. */
  tag: string;
  /** Vanilla entity ID from data/mobs.ts catalog. */
  baseEntity: string;
  /** CustomName shown above mob in-game. */
  displayName: string;
  /** Max health override via Attributes NBT. */
  health?: number;
  /** Attack damage override via Attributes NBT. */
  damage?: number;
  /** Adds Glowing effect (visible through walls). */
  glowing?: boolean;
  /** Show a boss health bar while this mob is alive (updated each tick). */
  bossBar?: boolean;
  /** Health-threshold phases. First entry is the starting phase. */
  phases?: CustomMobPhase[];
  /** Appearance sub-variants, keyed by NBT field name (reuse mobVariants.ts). */
  variants?: Record<string, string>;
  /** Optional equipment slots. */
  equipment?: CustomMobEquipment[];
  /** Custom drop table when mob dies. */
  drops?: ZoneDrop[];
}
