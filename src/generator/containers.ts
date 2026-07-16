import type { WorldContainer } from '../types/container';
import { toIdentifier } from '../types/ids';
import type { CompileContext } from './context';
import { scopeCommandInDimension } from './coordinates';
import type { FileMap } from './dungeons';
import { buildZoneDropLootTable } from './lootTables';
import { SYS_OBJECTIVE } from './sys';
import { sanitizeMcComment } from './text';

export function containerSlug(container: WorldContainer): string {
  return toIdentifier(container.name, `ctr_${container.id.slice(0, 8)}`);
}

export function containerLootTableId(namespace: string, slug: string): string {
  return `${namespace}:containers/${slug}`;
}

export function containerLootTablePath(namespace: string, slug: string): string {
  return `data/${namespace}/loot_table/containers/${slug}.json`;
}

export function containerTimerHolder(index: number): string {
  return `#ctr_${index}`;
}

export function containerIntervalTicks(container: WorldContainer): number {
  const seconds =
    container.refillIntervalSeconds > 0 ? Math.floor(container.refillIntervalSeconds) : 300;
  return Math.max(20, seconds * 20);
}

function containerPos(container: WorldContainer): string {
  const { x, y, z } = container.location;
  return `${x} ${y} ${z}`;
}

/** Commands that clear then refill a container from its loot table. */
export function buildContainerRefillCommands(
  ctx: CompileContext,
  container: WorldContainer,
  index: number,
): string[] {
  const pos = containerPos(container);
  const slug = containerSlug(container);
  const lootId = containerLootTableId(ctx.namespace, slug);
  const ticks = containerIntervalTicks(container);
  const holder = containerTimerHolder(index);
  const clear = scopeCommandInDimension(
    ctx,
    container.location.dimensionId,
    `data remove block ${pos} Items`,
  );
  const fill = scopeCommandInDimension(
    ctx,
    container.location.dimensionId,
    `loot replace block ${pos} container.0 loot ${lootId}`,
  );
  return [clear, fill, `scoreboard players set ${holder} ${SYS_OBJECTIVE} ${ticks}`];
}

/** Commands that place the block then refill it. */
export function buildContainerPlaceCommands(
  ctx: CompileContext,
  container: WorldContainer,
  index: number,
): string[] {
  const pos = containerPos(container);
  const place = scopeCommandInDimension(
    ctx,
    container.location.dimensionId,
    `setblock ${pos} ${container.blockType}`,
  );
  return [place, ...buildContainerRefillCommands(ctx, container, index)];
}

export function buildContainerLoadLines(ctx: CompileContext): string[] {
  const containers = ctx.project.containers ?? [];
  if (!containers.length) return [];
  const lines: string[] = [`# World container refill timers`];
  containers.forEach((container, i) => {
    const ticks = containerIntervalTicks(container);
    lines.push(`scoreboard players set ${containerTimerHolder(i)} ${SYS_OBJECTIVE} ${ticks}`);
  });
  return lines;
}

export function buildContainersTickHook(ctx: CompileContext): string | undefined {
  if (!(ctx.project.containers ?? []).length) return undefined;
  return `function ${ctx.namespace}:containers/tick`;
}

export function compileContainers(ctx: CompileContext): FileMap {
  const containers = ctx.project.containers ?? [];
  if (!containers.length) return {};

  const ns = ctx.namespace;
  const fnRoot = `data/${ns}/function`;
  const files: FileMap = {};

  const placeAll: string[] = [`# Place and fill every world container`];
  const refillAll: string[] = [`# Force-refill every world container`];
  const tick: string[] = [`# World container refill timers`];

  containers.forEach((container, i) => {
    const slug = containerSlug(container);
    const holder = containerTimerHolder(i);
    const base = `containers/${slug}`;

    files[containerLootTablePath(ns, slug)] =
      `${JSON.stringify(buildZoneDropLootTable(ctx.project, container.stock ?? []), null, 2)}\n`;

    const placeLines = [
      `# Place ${sanitizeMcComment(container.name)}`,
      ...buildContainerPlaceCommands(ctx, container, i),
    ];
    files[`${fnRoot}/${base}/place.mcfunction`] = `${placeLines.join('\n')}\n`;

    const refillLines = [
      `# Refill ${sanitizeMcComment(container.name)}`,
      ...buildContainerRefillCommands(ctx, container, i),
    ];
    files[`${fnRoot}/${base}/refill.mcfunction`] = `${refillLines.join('\n')}\n`;

    placeAll.push(`function ${ns}:${base}/place`);
    refillAll.push(`function ${ns}:${base}/refill`);

    tick.push(
      `execute if score ${holder} ${SYS_OBJECTIVE} matches 1.. run scoreboard players remove ${holder} ${SYS_OBJECTIVE} 1`,
      `execute if score ${holder} ${SYS_OBJECTIVE} matches 0 run function ${ns}:${base}/refill`,
    );
  });

  files[`${fnRoot}/containers/place_all.mcfunction`] = `${placeAll.join('\n')}\n`;
  files[`${fnRoot}/containers/refill_all.mcfunction`] = `${refillAll.join('\n')}\n`;
  files[`${fnRoot}/containers/tick.mcfunction`] = `${tick.join('\n')}\n`;

  return files;
}
