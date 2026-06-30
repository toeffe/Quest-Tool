/** System scoreboard objective used for global constants and gametime. */
export const SYS_OBJECTIVE = 'qt_sys';

/** Fake-player holder for the global gametime read (daily cooldowns). */
export const NOW_HOLDER = '#now';

/** Shared post-teleport immunity so players do not instantly trigger overlapping return pads. */
export const PAD_GRACE_OBJECTIVE = 'qt_pad_grace';

/** Per-tick pad request: -1 = none, 0+ = pad index to teleport on execute phase. */
export const PAD_REQ_OBJECTIVE = 'qt_pad_req';

/** Set to 1 after {@link PAD_INIT_OBJECTIVE} init so joiners get pad scores. */
export const PAD_INIT_OBJECTIVE = 'qt_pad_init';
