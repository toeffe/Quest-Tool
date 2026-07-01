/**

 * Minecraft 1.21.11-specific constants.

 *

 * 1.21.9+ uses the new pack.mcmeta schema with `min_format` / `max_format`.

 * Datapack format 94.1 corresponds to 1.21.11. Formats with major version below 82

 * still require legacy `pack_format` and `supported_formats`. Keep these in one place

 * so a future version bump is a one-line change.

 */

export const MINECRAFT_VERSION = '1.21.11';

/** Major datapack format for 1.21.11. */

export const DATAPACK_FORMAT_MAJOR = 94;

/** Minor datapack format for 1.21.11. */

export const DATAPACK_FORMAT_MINOR = 1;

/** `[major, minor]` tuple written to pack.mcmeta. */

export const DATAPACK_FORMAT = [DATAPACK_FORMAT_MAJOR, DATAPACK_FORMAT_MINOR] as const;

/** Major versions below this still require legacy `pack_format` / `supported_formats`. */

export const DATAPACK_LEGACY_FORMAT_THRESHOLD = 82;

/** Build the pack.mcmeta contents for 1.21.11. */

export function buildPackMeta(description: string): string {
  const pack: Record<string, unknown> = {
    description,

    min_format: [...DATAPACK_FORMAT],

    max_format: [...DATAPACK_FORMAT],
  };

  if (DATAPACK_FORMAT_MAJOR < DATAPACK_LEGACY_FORMAT_THRESHOLD) {
    pack.pack_format = DATAPACK_FORMAT_MAJOR;

    pack.supported_formats = [DATAPACK_FORMAT_MAJOR, DATAPACK_FORMAT_MAJOR];
  }

  return JSON.stringify({ pack }, null, 2);
}
