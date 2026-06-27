import { useTranslation } from 'react-i18next';
import { type Quest } from '../../types/quest';
import { getDatapackStrings } from '../../generator/strings';
import { useProjectStore } from '../../store/useProjectStore';

interface Props {
  quest: Quest;
  variant?: 'dialogue' | 'objective';
}

function objectiveLine(quest: Quest, o: Quest['objectives'][number]): string {
  const desc = o.description || quest.name;
  const zoneHint =
    (quest.type === 'kill' || quest.type === 'gather') && o.spawnZone && o.location
      ? ` @ ${o.location.x},${o.location.y},${o.location.z} r=${o.radius ?? 5} cap=${o.zoneCap ?? Math.min(Math.max(1, o.amount ?? 1), 5)}` +
        (o.zoneDropMode === 'vanilla'
          ? ' drops=vanilla'
          : o.zoneDropMode === 'custom'
            ? ` drops=${o.zoneDrops?.length ?? 0} custom`
            : ' drops=none')
      : '';
  switch (quest.type) {
    case 'kill':
    case 'gather':
    case 'delivery':
    case 'daily':
      return `${desc}: 0/${o.amount ?? 1}${zoneHint}`;
    default:
      return desc;
  }
}

/**
 * A lightweight in-game preview: NPC dialogue rendered as Minecraft-style chat,
 * or the objective(s) rendered like the on-screen action bar. The preview keeps
 * a dark "in-game" look in both app themes.
 */
export function QuestPreview({ quest, variant = 'dialogue' }: Props) {
  const { t } = useTranslation('editor');
  const projectLocale = useProjectStore((s) => s.project.locale ?? 'da');
  const STR = getDatapackStrings(projectLocale);

  if (variant === 'objective') {
    const objectives = quest.objectives.length ? quest.objectives : [{}];
    return (
      <div className="card" style={{ marginBottom: 0 }}>
        <h3>{t('preview.title')}</h3>
        <div className="mc-screen">
          {objectives.map((o, i) => (
            <div key={i} className="mc-actionbar">
              {objectiveLine(quest, o)}
            </div>
          ))}
        </div>
        <div className="hint" style={{ marginTop: 8 }}>
          {t('preview.actionBarHint')}
        </div>
      </div>
    );
  }

  const d = quest.npc.dialogue;
  const lines: { text: string; tone: string }[] = [
    { text: d.greeting, tone: 'white' },
    { text: d.offer, tone: 'yellow' },
    { text: d.inProgress, tone: 'white' },
    { text: d.completion, tone: 'green' },
  ];

  return (
    <div className="card" style={{ marginBottom: 0 }}>
      <h3>{t('preview.title')}</h3>
      <div className="mc-screen">
        {lines.map((line, i) => (
          <div key={i} className="mc-chat-line">
            <span className="mc-name">&lt;{quest.npc.name || t('preview.npcFallback')}&gt;</span>{' '}
            <span className={`mc-text ${line.tone}`}>{line.text || t('preview.ellipsis')}</span>
          </div>
        ))}
        <div className="mc-chat-line">
          <span className="mc-button">{STR.acceptQuestButton}</span>
        </div>
      </div>
      <div className="hint" style={{ marginTop: 8 }}>
        {t('preview.dialogueHint')}
      </div>
    </div>
  );
}
