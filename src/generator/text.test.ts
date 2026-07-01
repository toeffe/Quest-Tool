import { describe, expect, it } from 'vitest';
import { partToComponent, tellraw } from './text';

describe('text components (1.21.5+ format)', () => {
  it('uses click_event with the command field for run_command', () => {
    const c = partToComponent({ text: 'Accept', runCommand: 'trigger q0t' });
    expect(c).toContain('"click_event":{"action":"run_command","command":"trigger q0t"}');
    expect(c).not.toContain('clickEvent');
    expect(c).not.toContain('"value"');
  });

  it('uses hover_event with the value field for show_text', () => {
    const c = partToComponent({ text: 'Hi', hover: 'tooltip' });
    expect(c).toContain('"hover_event":{"action":"show_text","value":"tooltip"}');
    expect(c).not.toContain('hoverEvent');
  });

  it('escapes double quotes in text', () => {
    const c = partToComponent({ text: 'say "hi"' });
    expect(c).toContain('\\"hi\\"');
  });

  it('escapes newlines and tabs in text', () => {
    const c = partToComponent({ text: 'line one\nline two\there' });
    expect(c).toContain('line one\\nline two\\there');
    expect(c).not.toMatch(/"text":"[^"]*\n/);
  });

  it('builds a single-line tellraw command for multiline dialogue', () => {
    const cmd = tellraw('@s', [{ text: 'Han er borte i minen.\nKan du hjelpe?' }]);
    expect(cmd).toContain('\\n');
    expect(cmd.split('\n')).toHaveLength(1);
  });

  it('builds a tellraw command with a list component', () => {
    const cmd = tellraw('@s', [{ text: 'a' }, { text: 'b', color: 'red' }]);
    expect(cmd.startsWith('tellraw @s ["",')).toBe(true);
    expect(cmd).toContain('"color":"red"');
  });
});
