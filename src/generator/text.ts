/**
 * Text component builders for Minecraft 1.21.5+ (and therefore 1.21.11).
 *
 * Since 1.21.5 text components are stored as NBT and passed to commands as SNBT.
 * JSON written with double-quoted keys/strings is still valid SNBT, so we emit
 * JSON objects, but using the NEW field names introduced in 1.21.5:
 *   - clickEvent -> click_event ; for run_command the `value` field is now `command`
 *   - hoverEvent -> hover_event ; show_text content lives in the `value` field
 */

export type Color =
  | 'black' | 'dark_blue' | 'dark_green' | 'dark_aqua' | 'dark_red'
  | 'dark_purple' | 'gold' | 'gray' | 'dark_gray' | 'blue' | 'green'
  | 'aqua' | 'red' | 'light_purple' | 'yellow' | 'white';

export interface TextPart {
  text: string;
  color?: Color | string;
  bold?: boolean;
  italic?: boolean;
  underlined?: boolean;
  /** Run a command when clicked (no operator permission needed for /trigger). */
  runCommand?: string;
  /** Suggest a command in the chat input when clicked. */
  suggestCommand?: string;
  /** Tooltip shown when hovering. */
  hover?: string;
}

/** Escape a value for use inside SNBT/JSON double-quoted strings in commands. */
export function escapeSnbtString(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}

/** Serialize a single text part to a 1.21.5+ SNBT/JSON text component object. */
export function partToComponent(part: TextPart): string {
  const fields: string[] = [`"text":"${escapeSnbtString(part.text)}"`];
  if (part.color) fields.push(`"color":"${part.color}"`);
  if (part.bold) fields.push(`"bold":true`);
  if (part.italic) fields.push(`"italic":true`);
  if (part.underlined) fields.push(`"underlined":true`);

  if (part.runCommand) {
    fields.push(
      `"click_event":{"action":"run_command","command":"${escapeSnbtString(part.runCommand)}"}`,
    );
  } else if (part.suggestCommand) {
    fields.push(
      `"click_event":{"action":"suggest_command","command":"${escapeSnbtString(part.suggestCommand)}"}`,
    );
  }

  if (part.hover) {
    fields.push(
      `"hover_event":{"action":"show_text","value":"${escapeSnbtString(part.hover)}"}`,
    );
  }

  return `{${fields.join(',')}}`;
}

/** Serialize an array of parts to a text-component list, e.g. `["",{...},{...}]`. */
export function partsToComponent(parts: TextPart[]): string {
  return `["",${parts.map(partToComponent).join(',')}]`;
}

/** `tellraw <target> <component>` for a sequence of styled parts. */
export function tellraw(target: string, parts: TextPart[]): string {
  return `tellraw ${target} ${partsToComponent(parts)}`;
}

/** `title <target> actionbar <component>` for a single styled message. */
export function actionbar(target: string, parts: TextPart[]): string {
  return `title ${target} actionbar ${partsToComponent(parts)}`;
}
