/**
 * Minecraft 1.21.11-specific constants.
 *
 * 1.21.9+ uses the new pack.mcmeta schema with `min_format` / `max_format`.
 * Datapack format 75 corresponds to 1.21.11. Keep these in one place so a future
 * version bump is a one-line change.
 */

export const MINECRAFT_VERSION = '1.21.11';

/** Datapack format number for 1.21.11. */
export const DATAPACK_FORMAT = 75;

/** Build the pack.mcmeta contents for 1.21.11 (new min_format/max_format schema). */
export function buildPackMeta(description: string): string {
  return JSON.stringify(
    {
      pack: {
        description,
        min_format: DATAPACK_FORMAT,
        max_format: DATAPACK_FORMAT,
      },
    },
    null,
    2,
  );
}
