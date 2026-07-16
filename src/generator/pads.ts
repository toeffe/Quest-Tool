import type { TeleportPad } from '../types/dimension';
import { toIdentifier } from '../types/ids';
import type { CompileContext } from './context';
import {
  padDetectionDistance,
  resolveDimensionId,
  scopePadDetectionAt,
  tpLine,
} from './coordinates';
import type { FileMap } from './dungeons';
import {
  NOW_HOLDER,
  PAD_GRACE_OBJECTIVE,
  PAD_INIT_OBJECTIVE,
  PAD_REQ_OBJECTIVE,
  SYS_OBJECTIVE,
} from './sys';

const PAD_REQ_NONE = -1;

function padSlug(pad: TeleportPad): string {
  return toIdentifier(pad.name, `pad_${pad.id.slice(0, 8)}`);
}

function padGraceTicks(cooldownTicks: number): number {
  return Math.max(40, cooldownTicks + 20);
}

function sameDimensionRef(a?: string, b?: string): boolean {
  return (a ?? '') === (b ?? '');
}

/** Nudge landing coords away from nearby pad detection zones (round-trip layouts). */
function landingPosition(
  pad: TeleportPad,
  padIndex: number,
  pads: TeleportPad[],
): { x: number; y: number; z: number } {
  let { x, y, z } = pad.to;
  for (let j = 0; j < pads.length; j++) {
    if (j === padIndex) continue;
    const other = pads[j];
    if (!sameDimensionRef(pad.to.dimensionId, other.at.dimensionId)) continue;

    const ox = other.at.x;
    const oy = other.at.y;
    const oz = other.at.z;
    const dx = x - ox;
    const dy = y - oy;
    const dz = z - oz;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    const minSeparation = Math.max(8, (other.at.radius ?? 1) * 2 + 6);

    if (dist < minSeparation && dist > 0.01) {
      const push = Math.ceil(minSeparation - dist + 1);
      x += Math.round((dx / dist) * push);
      y += Math.round((dy / dist) * push);
      z += Math.round((dz / dist) * push);
    } else if (dist <= 0.01) {
      x += minSeparation + 1;
    }
  }
  return { x, y, z };
}

export function buildPadLoadLines(ctx: CompileContext): string[] {
  const pads = ctx.project.teleportPads ?? [];
  if (!pads.length) return [];

  const lines: string[] = [
    `scoreboard objectives add ${PAD_GRACE_OBJECTIVE} dummy`,
    `scoreboard objectives add ${PAD_REQ_OBJECTIVE} dummy`,
    `scoreboard objectives add ${PAD_INIT_OBJECTIVE} dummy`,
    `scoreboard players set @a ${PAD_GRACE_OBJECTIVE} 0`,
    `scoreboard players set @a ${PAD_REQ_OBJECTIVE} ${PAD_REQ_NONE}`,
    `scoreboard players set @a ${PAD_INIT_OBJECTIVE} 1`,
  ];

  pads.forEach((pad, i) => {
    void pad;
    const cdObjective = `pad${i}_cd`;
    lines.push(`scoreboard objectives add ${cdObjective} dummy`);
    lines.push(`scoreboard players set @a ${cdObjective} 0`);
  });
  return lines;
}

export function compilePads(ctx: CompileContext): FileMap {
  const files: FileMap = {};
  const pads = ctx.project.teleportPads ?? [];
  if (!pads.length) return files;

  const ns = ctx.namespace;
  const fnRoot = `data/${ns}/function`;
  const tickLines: string[] = [
    '# Teleport pad detection (two-phase: detect then execute — prevents same-tick bounce)',
    `scoreboard players set @a[scores={${PAD_REQ_OBJECTIVE}=0..}] ${PAD_REQ_OBJECTIVE} ${PAD_REQ_NONE}`,
    `execute as @a unless score @s ${PAD_INIT_OBJECTIVE} matches 1.. run function ${ns}:pads/init_scores`,
    '# --- detect phase ---',
  ];

  const initLines = [
    `scoreboard players set @s ${PAD_GRACE_OBJECTIVE} 0`,
    `scoreboard players set @s ${PAD_REQ_OBJECTIVE} ${PAD_REQ_NONE}`,
    `scoreboard players set @s ${PAD_INIT_OBJECTIVE} 1`,
  ];
  pads.forEach((_, i) => {
    initLines.push(`scoreboard players set @s pad${i}_cd 0`);
  });
  files[`${fnRoot}/pads/init_scores.mcfunction`] = initLines.join('\n') + '\n';

  const executeLines: string[] = ['# --- execute phase ---'];

  pads.forEach((pad, i) => {
    const slug = padSlug(pad);
    const base = `pads/${slug}`;
    const cdObjective = `pad${i}_cd`;
    const cooldownTicks = Math.max(1, Math.round((pad.cooldownSeconds ?? 1) * 20));
    const graceTicks = padGraceTicks(cooldownTicks);
    const land = landingPosition(pad, i, pads);
    const destDimId = pad.to.dimensionId;

    const teleportLines = [
      `scoreboard players operation @s ${PAD_GRACE_OBJECTIVE} = ${NOW_HOLDER} ${SYS_OBJECTIVE}`,
      `scoreboard players add @s ${PAD_GRACE_OBJECTIVE} ${graceTicks}`,
      tpLine(resolveDimensionId(ctx, destDimId), land.x, land.y, land.z),
    ];
    if (pad.cooldownSeconds && pad.cooldownSeconds > 0) {
      teleportLines.push(
        `scoreboard players operation @s ${cdObjective} = ${NOW_HOLDER} ${SYS_OBJECTIVE}`,
        `scoreboard players add @s ${cdObjective} ${cooldownTicks}`,
      );
    }
    for (let j = 0; j < pads.length; j++) {
      if (j === i) continue;
      const otherCd = `pad${j}_cd`;
      const otherCooldown = Math.max(1, Math.round((pads[j].cooldownSeconds ?? 1) * 20));
      const lockTicks = Math.max(graceTicks, otherCooldown);
      teleportLines.push(
        `scoreboard players operation @s ${otherCd} = ${NOW_HOLDER} ${SYS_OBJECTIVE}`,
        `scoreboard players add @s ${otherCd} ${lockTicks}`,
      );
    }
    files[`${fnRoot}/${base}/teleport.mcfunction`] = teleportLines.join('\n') + '\n';

    const dim = resolveDimensionId(ctx, pad.at.dimensionId);
    const detectDist = padDetectionDistance(pad.at.radius);
    const detectAs = `as @a[scores={${PAD_REQ_OBJECTIVE}=${PAD_REQ_NONE}},distance=..${detectDist}] if score @s ${PAD_GRACE_OBJECTIVE} <= ${NOW_HOLDER} ${SYS_OBJECTIVE}`;
    const detectRun = `run scoreboard players set @s ${PAD_REQ_OBJECTIVE} ${i}`;
    if (pad.cooldownSeconds && pad.cooldownSeconds > 0) {
      tickLines.push(
        scopePadDetectionAt(
          dim,
          pad.at.x,
          pad.at.y,
          pad.at.z,
          `${detectAs} if score @s ${cdObjective} <= ${NOW_HOLDER} ${SYS_OBJECTIVE} ${detectRun}`,
        ),
      );
    } else {
      tickLines.push(
        scopePadDetectionAt(dim, pad.at.x, pad.at.y, pad.at.z, `${detectAs} ${detectRun}`),
      );
    }

    executeLines.push(
      `execute as @a[scores={${PAD_REQ_OBJECTIVE}=${i}}] run function ${ns}:${base}/teleport`,
    );
  });

  tickLines.push(...executeLines);
  files[`${fnRoot}/pads/tick.mcfunction`] = tickLines.join('\n') + '\n';
  return files;
}

export function buildPadsTickHook(ctx: CompileContext): string | undefined {
  if (!(ctx.project.teleportPads ?? []).length) return undefined;
  return `function ${ctx.namespace}:pads/tick`;
}
