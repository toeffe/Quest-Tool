import { findQuestIdsInChainCycles } from '../chain/chainGraph';
import {
  getEnchantmentMaxLevel,
  isKnownEnchantment,
  normalizeEnchantmentId,
} from '../data/enchantments';
import { supportsCustomSkin } from '../data/mobVariantRegistry';
import { getAppLocale } from '../i18n';
import { tValidation } from '../i18n/translate';
import type { AppLocale } from '../i18n/types';
import type { PortalEndpoint } from '../types/dimension';
import { type BoundingBox, normalizeBounds } from '../types/dungeon';
import { toIdentifier } from '../types/ids';
import { TYPED_JOB_ACTIONS } from '../types/job';
import type { Project, Quest } from '../types/quest';
import { endpointToSelector } from './coordinates';
import { isRewardSupported } from './platform';

export type IssueLevel = 'error' | 'warning';

export interface ValidationIssue {
  level: IssueLevel;
  message: string;
  questId?: string;
  questName?: string;
  jobId?: string;
  jobName?: string;
  dungeonId?: string;
  dungeonRoomId?: string;
  dimensionId?: string;
  teleportPadId?: string;
  /** Field path for editor tab routing and focus (e.g. npc.name, objectives, chain.requires). */
  field?: string;
}

function objectiveWhere(multi: boolean, i: number, locale: AppLocale): string {
  if (!multi) return tValidation('objective', undefined, locale);
  return tValidation('objectiveN', { n: i + 1 }, locale);
}

function rewardWhere(multi: boolean, i: number, locale: AppLocale): string {
  if (!multi) return tValidation('reward', undefined, locale);
  return tValidation('rewardN', { n: i + 1 }, locale);
}

function objectiveIssues(quest: Quest, locale: AppLocale): string[] {
  const out: string[] = [];
  if (quest.objectives.length === 0) {
    out.push(tValidation('noObjective', undefined, locale));
    return out;
  }

  const multi = quest.objectives.length > 1;
  quest.objectives.forEach((o, i) => {
    const where = objectiveWhere(multi, i, locale);
    switch (quest.type) {
      case 'kill':
      case 'gather':
      case 'delivery':
      case 'daily':
        if (quest.type === 'kill') {
          if (!o.target && !o.eliteMobId)
            out.push(tValidation('missingTargetMob', { where }, locale));
        } else if (!o.target && !o.customItemId) {
          out.push(tValidation('missingTargetItem', { where }, locale));
        }
        if (!o.amount || o.amount < 1) out.push(tValidation('amountMin', { where }, locale));
        if ((quest.type === 'kill' || quest.type === 'gather') && o.spawnZone && !o.location) {
          out.push(tValidation('spawnZoneNoLocation', { where }, locale));
        }
        if (
          (quest.type === 'kill' || quest.type === 'gather') &&
          o.spawnZone &&
          o.zoneCap != null &&
          o.zoneCap < 1
        ) {
          out.push(tValidation('spawnCapMin', { where }, locale));
        }
        if (quest.type === 'gather' && o.spawnZone && !o.zoneMob) {
          out.push(tValidation('spawnZoneNoMob', { where }, locale));
        }
        if (
          (quest.type === 'kill' || quest.type === 'gather') &&
          o.spawnZone &&
          o.zoneDropMode === 'custom'
        ) {
          const drops = o.zoneDrops ?? [];
          if (!drops.length) {
            out.push(tValidation('customDropsEmpty', { where }, locale));
          }
          drops.forEach((d, di) => {
            const dropWhere =
              drops.length > 1
                ? tValidation('dropN', { where, n: di + 1 }, locale)
                : tValidation('drop', { where }, locale);
            if (!d.target && !d.customItemId) {
              out.push(tValidation('dropMissingItem', { where: dropWhere }, locale));
            }
            if (d.amount != null && d.amount < 1) {
              out.push(tValidation('dropAmountMin', { where: dropWhere }, locale));
            }
            if (d.chance != null && (d.chance < 1 || d.chance > 100)) {
              out.push(tValidation('dropChanceRange', { where: dropWhere }, locale));
            }
          });
        }
        break;
      case 'exploration':
        if (!o.location) out.push(tValidation('missingLocation', { where }, locale));
        break;
      case 'talk':
        break;
    }
  });
  return out;
}

function customItemIssues(project: Project, locale: AppLocale): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const items = project.customItems ?? [];
  const tagCounts = new Map<string, number>();
  const referenced = new Set<string>();

  for (const quest of project.quests) {
    for (const o of quest.objectives) {
      if (o.customItemId) referenced.add(o.customItemId);
      for (const d of o.zoneDrops ?? []) {
        if (d.customItemId) referenced.add(d.customItemId);
      }
    }
    for (const r of quest.rewards) {
      if (r.customItemId) referenced.add(r.customItemId);
    }
  }

  for (const item of items) {
    const tag = toIdentifier(item.tag);
    tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
    if (!item.displayName.trim()) {
      issues.push({
        level: 'error',
        message: tValidation('customItemNoDisplayName', { name: item.name }, locale),
      });
    }
    if (!item.baseItem.trim()) {
      issues.push({
        level: 'error',
        message: tValidation('customItemNoBaseItem', { name: item.name }, locale),
      });
    }
    if (!referenced.has(item.id)) {
      issues.push({
        level: 'warning',
        message: tValidation('customItemUnused', { name: item.name }, locale),
      });
    }

    const enchantIds = new Set<string>();
    for (const enchant of item.enchantments ?? []) {
      const normId = normalizeEnchantmentId(enchant.enchantmentId);
      if (!normId) continue;

      if (enchant.level < 1) {
        issues.push({
          level: 'error',
          message: tValidation(
            'customItemEnchantmentLevel',
            { name: item.name, enchant: normId },
            locale,
          ),
        });
      }

      const maxLevel = getEnchantmentMaxLevel(normId);
      if (maxLevel != null && enchant.level > maxLevel) {
        issues.push({
          level: 'warning',
          message: tValidation(
            'customItemEnchantmentMaxLevel',
            { name: item.name, enchant: normId, max: maxLevel },
            locale,
          ),
        });
      }

      if (!isKnownEnchantment(normId)) {
        issues.push({
          level: 'warning',
          message: tValidation(
            'customItemUnknownEnchantment',
            { name: item.name, enchant: normId },
            locale,
          ),
        });
      }

      if (enchantIds.has(normId)) {
        issues.push({
          level: 'error',
          message: tValidation(
            'customItemDuplicateEnchantment',
            { name: item.name, enchant: normId },
            locale,
          ),
        });
      }
      enchantIds.add(normId);
    }
  }

  for (const [tag, count] of tagCounts) {
    if (count > 1) {
      issues.push({
        level: 'error',
        message: tValidation('duplicateItemTag', { tag, count }, locale),
      });
    }
  }

  return issues;
}

function customMobIssues(project: Project, locale: AppLocale): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const mobs = project.customMobs ?? [];
  const tagCounts = new Map<string, number>();
  const referenced = new Set<string>();

  for (const quest of project.quests) {
    if (quest.type !== 'kill') continue;
    for (const o of quest.objectives) {
      if (o.eliteMobId) referenced.add(o.eliteMobId);
    }
  }

  for (const mob of mobs) {
    const tag = toIdentifier(mob.tag);
    tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
    if (!mob.name.trim()) {
      issues.push({
        level: 'error',
        message: tValidation('customMobNoName', { name: mob.name || mob.tag }, locale),
      });
    }
    if (!tag) {
      issues.push({
        level: 'error',
        message: tValidation('customMobNoTag', { name: mob.name }, locale),
      });
    }
    if (!mob.baseEntity.trim()) {
      issues.push({
        level: 'error',
        message: tValidation('customMobNoBaseEntity', { name: mob.name }, locale),
      });
    }
    if (!referenced.has(mob.id)) {
      issues.push({
        level: 'warning',
        message: tValidation('customMobUnused', { name: mob.name }, locale),
      });
    }
    if (mob.health != null && mob.health > 500) {
      issues.push({
        level: 'warning',
        message: tValidation('customMobHighHealth', { name: mob.name, health: mob.health }, locale),
      });
    }
    if (mob.skinTexture?.trim() && !supportsCustomSkin(mob.baseEntity)) {
      issues.push({
        level: 'error',
        message: tValidation(
          'customMobSkinUnsupported',
          { name: mob.name, entity: mob.baseEntity },
          locale,
        ),
      });
    }
    if (mob.scale != null && mob.scale > 0 && (mob.scale < 0.25 || mob.scale > 4)) {
      issues.push({
        level: 'warning',
        message: tValidation('customMobScaleExtreme', { name: mob.name, scale: mob.scale }, locale),
      });
    }
    if (mob.skinTexture?.trim() && supportsCustomSkin(mob.baseEntity)) {
      issues.push({
        level: 'warning',
        message: tValidation('customMobSkinResourcePack', { name: mob.name }, locale),
      });
    }
    if (mob.skinTexture?.trim() && mob.baseEntity.trim() === 'minecraft:wolf') {
      issues.push({
        level: 'warning',
        message: tValidation('customMobWolfSkinInfo', { name: mob.name }, locale),
      });
    }
    for (const phase of mob.phases ?? []) {
      if (phase.skinTexture?.trim() && !supportsCustomSkin(mob.baseEntity)) {
        issues.push({
          level: 'error',
          message: tValidation(
            'customMobSkinUnsupported',
            { name: mob.name, entity: mob.baseEntity },
            locale,
          ),
        });
      }
    }
    if ((mob.drops ?? []).length > 0) {
      for (const [di, d] of mob.drops!.entries()) {
        const dropLabel =
          mob.drops!.length > 1
            ? tValidation('dropN', { where: mob.name, n: di + 1 }, locale)
            : tValidation('drop', { where: mob.name }, locale);
        if (!d.target?.trim() && !d.customItemId) {
          issues.push({
            level: 'error',
            message: tValidation('dropMissingItem', { where: dropLabel }, locale),
          });
        }
        if (d.customItemId && !(project.customItems ?? []).some((i) => i.id === d.customItemId)) {
          issues.push({
            level: 'error',
            message: tValidation(
              'customMobDropMissingCustomItem',
              { mob: mob.name, where: dropLabel, itemId: d.customItemId },
              locale,
            ),
          });
        }
        if (d.amount != null && d.amount < 1) {
          issues.push({
            level: 'error',
            message: tValidation('dropAmountMin', { where: dropLabel }, locale),
          });
        }
        if (d.chance != null && (d.chance < 1 || d.chance > 100)) {
          issues.push({
            level: 'error',
            message: tValidation('dropChanceRange', { where: dropLabel }, locale),
          });
        }
      }
      const usedInSpawnZone = project.quests.some(
        (q) =>
          q.type === 'kill' && q.objectives.some((o) => o.eliteMobId === mob.id && o.spawnZone),
      );
      if (!usedInSpawnZone) {
        issues.push({
          level: 'warning',
          message: tValidation('customMobDropsNoSpawnZone', { name: mob.name }, locale),
        });
      }
    }

    const phases = mob.phases ?? [];
    if (phases.length >= 2) {
      let prevThreshold = 100;
      for (let i = 0; i < phases.length; i++) {
        const phase = phases[i];
        if (i === 0) continue;
        const pct = phase.atHealthPercent;
        const phaseLabel = phase.name || String(i + 1);
        if (pct == null) {
          issues.push({
            level: 'error',
            message: tValidation(
              'customMobPhaseThresholdMissing',
              { name: mob.name, phase: phaseLabel },
              locale,
            ),
          });
          continue;
        }
        if (pct < 1 || pct > 99) {
          issues.push({
            level: 'error',
            message: tValidation(
              'customMobPhaseThresholdInvalid',
              { name: mob.name, phase: phaseLabel },
              locale,
            ),
          });
        }
        if (pct >= prevThreshold) {
          issues.push({
            level: 'error',
            message: tValidation(
              'customMobPhaseThresholdOrder',
              { name: mob.name, phase: phaseLabel },
              locale,
            ),
          });
        }
        prevThreshold = pct;
      }
    }
  }

  for (const [tag, count] of tagCounts) {
    if (count > 1) {
      issues.push({
        level: 'error',
        message: tValidation('duplicateMobTag', { tag, count }, locale),
      });
    }
  }

  return issues;
}

function boxesOverlap(a: BoundingBox, b: BoundingBox): boolean {
  const na = normalizeBounds(a);
  const nb = normalizeBounds(b);
  return (
    na.x1 <= nb.x2 &&
    na.x2 >= nb.x1 &&
    na.y1 <= nb.y2 &&
    na.y2 >= nb.y1 &&
    na.z1 <= nb.z2 &&
    na.z2 >= nb.z1
  );
}

function dungeonIssues(project: Project, locale: AppLocale): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const dungeons = project.dungeons ?? [];
  const questNames = new Set(project.quests.map((q) => q.name));
  const customMobIds = new Set((project.customMobs ?? []).map((m) => m.id));
  const tagCounts = new Map<string, number>();

  for (const dungeon of dungeons) {
    const tag = toIdentifier(dungeon.tag);
    tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);

    if (!dungeon.name.trim()) {
      issues.push({
        level: 'error',
        message: tValidation('dungeonNoName', undefined, locale),
        dungeonId: dungeon.id,
        field: `dungeons.${dungeon.id}.name`,
      });
    }
    if (!tag) {
      issues.push({
        level: 'error',
        message: tValidation('dungeonNoTag', { name: dungeon.name }, locale),
        dungeonId: dungeon.id,
        field: `dungeons.${dungeon.id}.tag`,
      });
    }
    if (dungeon.rooms.length === 0) {
      issues.push({
        level: 'error',
        message: tValidation('dungeonNoRooms', { name: dungeon.name }, locale),
        dungeonId: dungeon.id,
      });
    }

    const dimensionIds = new Set((project.dimensions ?? []).map((d) => d.id));
    if (dungeon.dimensionId && !dimensionIds.has(dungeon.dimensionId)) {
      issues.push({
        level: 'error',
        message: tValidation('dungeonDimensionMissing', { name: dungeon.name }, locale),
        dungeonId: dungeon.id,
        field: `dungeons.${dungeon.id}.dimensionId`,
      });
    }

    let hasQuestRef = false;

    for (const room of dungeon.rooms) {
      if (!room.name.trim()) {
        issues.push({
          level: 'error',
          message: tValidation('dungeonRoomNoName', { dungeon: dungeon.name }, locale),
          dungeonId: dungeon.id,
          dungeonRoomId: room.id,
          field: `dungeons.${dungeon.id}.rooms.${room.id}.name`,
        });
      }

      if (room.questGate) {
        hasQuestRef = true;
        if (!questNames.has(room.questGate.questName)) {
          issues.push({
            level: 'error',
            message: tValidation(
              'dungeonGateMissingQuest',
              {
                room: room.name,
                quest: room.questGate.questName,
              },
              locale,
            ),
            dungeonId: dungeon.id,
            dungeonRoomId: room.id,
          });
        }
      }

      for (const spawn of room.spawns) {
        if (
          spawn.sourceType === 'customMob' &&
          spawn.customMobId &&
          !customMobIds.has(spawn.customMobId)
        ) {
          issues.push({
            level: 'error',
            message: tValidation('dungeonSpawnMissingMob', { room: room.name }, locale),
            dungeonId: dungeon.id,
            dungeonRoomId: room.id,
          });
        }
      }

      for (const trigger of room.triggers) {
        if (trigger.action.type === 'set_quest_state') {
          hasQuestRef = true;
          if (!questNames.has(trigger.action.questName)) {
            issues.push({
              level: 'error',
              message: tValidation(
                'dungeonTriggerMissingQuest',
                {
                  room: room.name,
                  quest: trigger.action.questName,
                },
                locale,
              ),
              dungeonId: dungeon.id,
              dungeonRoomId: room.id,
            });
          }
        }
      }

      const hasOnAllKilled = room.triggers.some((t) => t.event === 'on_all_mobs_killed');
      const hasNonRespawnSpawns = room.spawns.some((s) => !s.respawn && s.count > 0);
      if (hasNonRespawnSpawns && !hasOnAllKilled && room.spawns.length > 0) {
        issues.push({
          level: 'warning',
          message: tValidation('dungeonSpawnsNoOutcome', { room: room.name }, locale),
          dungeonId: dungeon.id,
          dungeonRoomId: room.id,
        });
      }
      if (room.type === 'boss_room' && !hasOnAllKilled) {
        issues.push({
          level: 'warning',
          message: tValidation('dungeonBossNoTrigger', { room: room.name }, locale),
          dungeonId: dungeon.id,
          dungeonRoomId: room.id,
        });
      }
    }

    for (let i = 0; i < dungeon.rooms.length; i++) {
      for (let j = i + 1; j < dungeon.rooms.length; j++) {
        if (boxesOverlap(dungeon.rooms[i].bounds, dungeon.rooms[j].bounds)) {
          issues.push({
            level: 'warning',
            message: tValidation(
              'dungeonOverlappingRooms',
              {
                a: dungeon.rooms[i].name,
                b: dungeon.rooms[j].name,
                dungeon: dungeon.name,
              },
              locale,
            ),
            dungeonId: dungeon.id,
          });
        }
      }
    }

    if (!hasQuestRef && dungeon.rooms.length > 0) {
      issues.push({
        level: 'warning',
        message: tValidation('dungeonUnreferenced', { name: dungeon.name }, locale),
        dungeonId: dungeon.id,
      });
    }
  }

  for (const [tag, count] of tagCounts) {
    if (count > 1) {
      issues.push({
        level: 'error',
        message: tValidation('duplicateDungeonTag', { tag, count }, locale),
      });
    }
  }

  return issues;
}

function sameDimensionRef(a?: string, b?: string): boolean {
  return (a ?? '') === (b ?? '');
}

function pointInEndpointBox(
  px: number,
  py: number,
  pz: number,
  endpoint: Pick<PortalEndpoint, 'x' | 'y' | 'z' | 'radius'>,
): boolean {
  const s = endpointToSelector(endpoint);
  return (
    px >= s.x && px <= s.x + s.dx && py >= s.y && py <= s.y + s.dy && pz >= s.z && pz <= s.z + s.dz
  );
}

function dimensionIssues(project: Project, locale: AppLocale): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const dimensions = project.dimensions ?? [];
  const dimensionIds = new Set(dimensions.map((d) => d.id));
  const tagCounts = new Map<string, number>();

  const checkDimensionRef = (
    refId: string | undefined,
    entityLabel: string,
    field: string,
    extra?: Partial<ValidationIssue>,
  ) => {
    if (refId && !dimensionIds.has(refId)) {
      issues.push({
        level: 'error',
        message: tValidation('dimensionRefMissing', { entity: entityLabel }, locale),
        field,
        ...extra,
      });
    }
  };

  for (const dimension of dimensions) {
    const tag = toIdentifier(dimension.tag);
    tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);

    if (!dimension.name.trim()) {
      issues.push({
        level: 'error',
        message: tValidation('dimensionNoName', undefined, locale),
        dimensionId: dimension.id,
        field: `dimensions.${dimension.id}.name`,
      });
    }
    if (!tag) {
      issues.push({
        level: 'error',
        message: tValidation('dimensionNoTag', { name: dimension.name }, locale),
        dimensionId: dimension.id,
        field: `dimensions.${dimension.id}.tag`,
      });
    }
  }

  for (const [tag, count] of tagCounts) {
    if (count > 1) {
      issues.push({
        level: 'error',
        message: tValidation('duplicateDimensionTag', { tag, count }, locale),
      });
    }
  }

  for (const pad of project.teleportPads ?? []) {
    if (!pad.name.trim()) {
      issues.push({
        level: 'error',
        message: tValidation('padNoName', undefined, locale),
        teleportPadId: pad.id,
        field: `teleportPads.${pad.id}.name`,
      });
    }
    checkDimensionRef(pad.at.dimensionId, pad.name, `teleportPads.${pad.id}.at.dimensionId`, {
      teleportPadId: pad.id,
    });
    checkDimensionRef(pad.to.dimensionId, pad.name, `teleportPads.${pad.id}.to.dimensionId`, {
      teleportPadId: pad.id,
    });
    if (pad.cooldownSeconds != null && pad.cooldownSeconds < 1) {
      issues.push({
        level: 'warning',
        message: tValidation('padCooldownTooShort', { name: pad.name }, locale),
        teleportPadId: pad.id,
        field: `teleportPads.${pad.id}.cooldownSeconds`,
      });
    }
  }

  const pads = project.teleportPads ?? [];
  for (let i = 0; i < pads.length; i++) {
    for (let j = 0; j < pads.length; j++) {
      if (i === j) continue;
      const from = pads[i];
      const to = pads[j];
      if (!sameDimensionRef(from.to.dimensionId, to.at.dimensionId)) continue;
      if (!pointInEndpointBox(from.to.x, from.to.y, from.to.z, to.at)) continue;
      issues.push({
        level: 'warning',
        message: tValidation('padDestinationOverlapsAt', { from: from.name, to: to.name }, locale),
        teleportPadId: from.id,
        field: `teleportPads.${from.id}.to`,
      });
    }
  }

  return issues;
}

function jobIssues(project: Project, locale: AppLocale): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const jobs = project.jobs ?? [];
  const jobIds = new Set(jobs.map((j) => j.id));
  const nameCounts = new Map<string, number>();

  for (const job of jobs) {
    const name = job.name.trim();
    if (!name) {
      issues.push({
        level: 'error',
        message: tValidation('jobEmptyName', undefined, locale),
        jobId: job.id,
        jobName: job.name,
      });
    }
    nameCounts.set(name, (nameCounts.get(name) ?? 0) + 1);
    if (job.xpPerAction < 1) {
      issues.push({
        level: 'error',
        message: tValidation('jobXpPerActionMin', { name: job.name }, locale),
        jobId: job.id,
        jobName: job.name,
      });
    }
    if (job.xpPerLevel < 1) {
      issues.push({
        level: 'error',
        message: tValidation('jobXpPerLevelMin', { name: job.name }, locale),
        jobId: job.id,
        jobName: job.name,
      });
    }
    if (job.maxLevel < 1) {
      issues.push({
        level: 'error',
        message: tValidation('jobMaxLevelMin', { name: job.name }, locale),
        jobId: job.id,
        jobName: job.name,
      });
    }
    if (job.advancementIcon && !job.advancementIcon.includes(':')) {
      issues.push({
        level: 'warning',
        message: tValidation('jobAdvIconWarning', { name: job.name }, locale),
        jobId: job.id,
        jobName: job.name,
      });
    }
    if (job.advancementBackground && !job.advancementBackground.includes(':')) {
      issues.push({
        level: 'warning',
        message: tValidation('jobAdvBackgroundWarning', { name: job.name }, locale),
        jobId: job.id,
        jobName: job.name,
      });
    }
    if (job.action === 'custom' && !job.customCriterion?.trim()) {
      issues.push({
        level: 'error',
        message: tValidation('jobCustomCriterion', { name: job.name }, locale),
        jobId: job.id,
        jobName: job.name,
        field: 'jobs.customCriterion',
      });
    }
    if (TYPED_JOB_ACTIONS.includes(job.action)) {
      const preset = job.statPreset ?? 'single';
      if (preset === 'single' && !job.statTarget?.trim()) {
        issues.push({
          level: 'error',
          message: tValidation('jobSingleTarget', { name: job.name }, locale),
          jobId: job.id,
          jobName: job.name,
          field: 'jobs.statTarget',
        });
      }
    }
    const milestoneLevels = new Set<number>();
    for (const milestone of job.milestones ?? []) {
      if (milestone.level < 1 || milestone.level > job.maxLevel) {
        issues.push({
          level: 'error',
          message: tValidation(
            'jobMilestoneLevelRange',
            { name: job.name, level: milestone.level, maxLevel: job.maxLevel },
            locale,
          ),
          jobId: job.id,
          jobName: job.name,
          field: 'jobs.milestones',
        });
      }
      if (milestoneLevels.has(milestone.level)) {
        issues.push({
          level: 'error',
          message: tValidation(
            'jobDuplicateMilestone',
            { name: job.name, level: milestone.level },
            locale,
          ),
          jobId: job.id,
          jobName: job.name,
          field: 'jobs.milestones',
        });
      }
      milestoneLevels.add(milestone.level);
      for (const reward of milestone.rewards) {
        if (reward.type === 'item' && !reward.value && !reward.customItemId) {
          issues.push({
            level: 'error',
            message: tValidation(
              'jobMilestoneEmptyItem',
              { name: job.name, level: milestone.level },
              locale,
            ),
            jobId: job.id,
            jobName: job.name,
            field: 'jobs.milestones',
          });
        }
      }
    }
  }

  const customItemIds = new Set((project.customItems ?? []).map((i) => i.id));
  for (const job of jobs) {
    for (const milestone of job.milestones ?? []) {
      for (const reward of milestone.rewards) {
        if (reward.customItemId && !customItemIds.has(reward.customItemId)) {
          issues.push({
            level: 'error',
            message: tValidation(
              'jobMilestoneMissingItem',
              { name: job.name, level: milestone.level, itemId: reward.customItemId },
              locale,
            ),
            jobId: job.id,
            jobName: job.name,
            field: 'jobs.milestones',
          });
        }
      }
    }
  }

  for (const [name, count] of nameCounts) {
    if (count > 1) {
      issues.push({
        level: 'error',
        message: tValidation('duplicateJobName', { name, count }, locale),
      });
    }
  }

  for (const quest of project.quests) {
    const jobReq = quest.chain.requiresJob;
    if (jobReq) {
      if (!jobIds.has(jobReq.jobId)) {
        issues.push({
          level: 'error',
          message: tValidation(
            'chainRequiresMissingJob',
            { quest: quest.name, jobId: jobReq.jobId },
            locale,
          ),
          questId: quest.id,
          questName: quest.name,
          field: 'chain.requiresJob',
        });
      }
      if (jobReq.level < 1) {
        issues.push({
          level: 'error',
          message: tValidation('jobLevelMin', { quest: quest.name }, locale),
          questId: quest.id,
          questName: quest.name,
          field: 'chain.requiresJob',
        });
      }
    }

    const multiRewards = quest.rewards.length > 1;
    for (const [ri, reward] of quest.rewards.entries()) {
      const rewardLabel = rewardWhere(multiRewards, ri, locale);
      if (reward.type === 'jobXp') {
        if (!reward.jobId || !jobIds.has(reward.jobId)) {
          issues.push({
            level: 'error',
            message: tValidation(
              'jobXpRewardMissingJob',
              { quest: quest.name, where: rewardLabel, jobId: reward.jobId ?? '?' },
              locale,
            ),
            questId: quest.id,
            questName: quest.name,
            field: 'rewards',
          });
        }
        if (!reward.amount || reward.amount < 1) {
          issues.push({
            level: 'error',
            message: tValidation('jobXpRewardMin', { quest: quest.name, where: rewardLabel }, locale),
            questId: quest.id,
            questName: quest.name,
            field: 'rewards',
          });
        }
      }
    }
  }

  return issues;
}

/** Validate the whole project; returns errors (block export) and warnings. */
export function validateProject(project: Project, locale?: AppLocale): ValidationIssue[] {
  const effectiveLocale = locale ?? getAppLocale();
  const issues: ValidationIssue[] = [];
  const add = (level: IssueLevel, message: string, quest?: Quest, field?: string) =>
    issues.push({ level, message, questId: quest?.id, questName: quest?.name, field });

  if (project.quests.length === 0) {
    add('error', tValidation('projectNoQuests', undefined, effectiveLocale));
    return issues;
  }

  issues.push(...customItemIssues(project, effectiveLocale));
  issues.push(...customMobIssues(project, effectiveLocale));
  issues.push(...dungeonIssues(project, effectiveLocale));
  issues.push(...dimensionIssues(project, effectiveLocale));
  issues.push(...jobIssues(project, effectiveLocale));

  const customItemIds = new Set((project.customItems ?? []).map((i) => i.id));
  const customMobIds = new Set((project.customMobs ?? []).map((m) => m.id));
  const dimensionIds = new Set((project.dimensions ?? []).map((d) => d.id));

  const nameCounts = new Map<string, number>();
  const npcTagCounts = new Map<string, number>();

  for (const quest of project.quests) {
    const name = quest.name.trim();
    if (!name)
      add('error', tValidation('questEmptyName', undefined, effectiveLocale), quest, 'name');
    nameCounts.set(name, (nameCounts.get(name) ?? 0) + 1);

    if (!quest.npc.name.trim()) {
      add('error', tValidation('npcNoName', undefined, effectiveLocale), quest, 'npc.name');
    }

    const npcTag = toIdentifier(quest.npc.tag);
    npcTagCounts.set(npcTag, (npcTagCounts.get(npcTag) ?? 0) + 1);

    for (const msg of objectiveIssues(quest, effectiveLocale)) {
      add('error', msg, quest, 'objectives');
    }

    const multiObjectives = quest.objectives.length > 1;
    for (const [oi, o] of quest.objectives.entries()) {
      const objWhere = objectiveWhere(multiObjectives, oi, effectiveLocale);
      if (o.customItemId && !customItemIds.has(o.customItemId)) {
        add(
          'error',
          tValidation(
            'objectiveMissingCustomItem',
            { quest: quest.name, where: objWhere, itemId: o.customItemId },
            effectiveLocale,
          ),
          quest,
          'objectives',
        );
      }
      if (o.eliteMobId && !customMobIds.has(o.eliteMobId)) {
        add(
          'error',
          tValidation(
            'objectiveMissingCustomMob',
            { quest: quest.name, where: objWhere, mobId: o.eliteMobId },
            effectiveLocale,
          ),
          quest,
          'objectives',
        );
      }
      const drops = o.zoneDrops ?? [];
      for (const [di, d] of drops.entries()) {
        if (d.customItemId && !customItemIds.has(d.customItemId)) {
          const dropWhere =
            drops.length > 1
              ? tValidation('dropN', { where: objWhere, n: di + 1 }, effectiveLocale)
              : tValidation('drop', { where: objWhere }, effectiveLocale);
          add(
            'error',
            tValidation(
              'spawnDropMissingCustomItem',
              { quest: quest.name, where: dropWhere, itemId: d.customItemId },
              effectiveLocale,
            ),
            quest,
            'objectives',
          );
        }
      }
    }

    if (quest.npc.spawnMode === 'fixed' && !quest.npc.coordinates) {
      add(
        'error',
        tValidation('npcFixedNoCoords', undefined, effectiveLocale),
        quest,
        'npc.coordinates',
      );
    }
    if (
      quest.npc.coordinates?.dimensionId &&
      !dimensionIds.has(quest.npc.coordinates.dimensionId)
    ) {
      add(
        'error',
        tValidation(
          'dimensionRefMissing',
          { entity: quest.npc.name || quest.name },
          effectiveLocale,
        ),
        quest,
        'npc.coordinates.dimensionId',
      );
    }

    if (quest.type === 'talk' && quest.targetNpc) {
      if (!quest.targetNpc.name.trim()) {
        add(
          'error',
          tValidation('targetNpcNoName', undefined, effectiveLocale),
          quest,
          'targetNpc.name',
        );
      }
      if (quest.targetNpc.spawnMode === 'fixed' && !quest.targetNpc.coordinates) {
        add(
          'error',
          tValidation('targetNpcFixedNoCoords', undefined, effectiveLocale),
          quest,
          'targetNpc.coordinates',
        );
      }
      if (
        quest.targetNpc.coordinates?.dimensionId &&
        !dimensionIds.has(quest.targetNpc.coordinates.dimensionId)
      ) {
        add(
          'error',
          tValidation(
            'dimensionRefMissing',
            { entity: quest.targetNpc.name || quest.name },
            effectiveLocale,
          ),
          quest,
          'targetNpc.coordinates.dimensionId',
        );
      }
    }

    for (const [oi, o] of quest.objectives.entries()) {
      if (o.location?.dimensionId && !dimensionIds.has(o.location.dimensionId)) {
        add(
          'error',
          tValidation(
            'dimensionRefMissing',
            { entity: `${quest.name} objective ${oi + 1}` },
            effectiveLocale,
          ),
          quest,
          `objectives.${oi}.location.dimensionId`,
        );
      }
    }

    if (quest.chain.requires) {
      const exists = project.quests.some((q) => q.name === quest.chain.requires);
      if (!exists) {
        add(
          'error',
          tValidation('chainRequiresNotFound', { name: quest.chain.requires }, effectiveLocale),
          quest,
          'chain.requires',
        );
      }
      if (quest.chain.requires === quest.name) {
        add(
          'error',
          tValidation('chainSelfRequire', undefined, effectiveLocale),
          quest,
          'chain.requires',
        );
      }
    }
    if (quest.chain.unlocks) {
      const exists = project.quests.some((q) => q.name === quest.chain.unlocks);
      if (!exists) {
        add(
          'error',
          tValidation('chainUnlocksNotFound', { name: quest.chain.unlocks }, effectiveLocale),
          quest,
          'chain.unlocks',
        );
      }
    }

    const multiRewards = quest.rewards.length > 1;
    for (const [ri, reward] of quest.rewards.entries()) {
      const rewardLabel = rewardWhere(multiRewards, ri, effectiveLocale);
      const support = isRewardSupported(project.platform, reward, effectiveLocale);
      if (support.note) {
        add(support.ok ? 'warning' : 'warning', support.note, quest);
      }
      if (reward.type === 'item' && !reward.value && !reward.customItemId) {
        add(
          'error',
          tValidation('rewardMissingItem', { quest: quest.name, where: rewardLabel }, effectiveLocale),
          quest,
          'rewards',
        );
      }
      if (reward.customItemId && !customItemIds.has(reward.customItemId)) {
        add(
          'error',
          tValidation(
            'rewardMissingCustomItem',
            { quest: quest.name, where: rewardLabel, itemId: reward.customItemId },
            effectiveLocale,
          ),
          quest,
          'rewards',
        );
      }
      if (reward.type === 'command' && !reward.value) {
        add(
          'error',
          tValidation(
            'rewardMissingCommand',
            { quest: quest.name, where: rewardLabel },
            effectiveLocale,
          ),
          quest,
          'rewards',
        );
      }
    }

    if (quest.rewards.length === 0) {
      add('warning', tValidation('questNoRewards', undefined, effectiveLocale), quest, 'rewards');
    }
  }

  for (const [name, count] of nameCounts) {
    if (count > 1) {
      add('error', tValidation('duplicateQuestName', { name, count }, effectiveLocale));
    }
  }
  for (const [tag, count] of npcTagCounts) {
    if (count > 1) {
      add('error', tValidation('duplicateNpcTag', { tag, count }, effectiveLocale));
    }
  }

  const cyclicQuestIds = findQuestIdsInChainCycles(project.quests);
  for (const quest of project.quests) {
    if (cyclicQuestIds.has(quest.id)) {
      add('error', tValidation('chainCycleDetected', undefined, effectiveLocale), quest, 'chain');
    }
  }

  return issues;
}

export function hasBlockingErrors(issues: ValidationIssue[]): boolean {
  return issues.some((i) => i.level === 'error');
}
