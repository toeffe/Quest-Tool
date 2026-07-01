import { useId } from 'react';

interface Props {
  text: string;
  /** Accessible label for the trigger; defaults to "More info". */
  label?: string;
}

export function HintTooltip({ text, label = 'More info' }: Props) {
  const id = useId();

  return (
    <span className="hint-tooltip">
      <button
        type="button"
        className="hint-tooltip-trigger"
        aria-label={label}
        aria-describedby={id}
      >
        i
      </button>
      <span id={id} role="tooltip" className="hint-tooltip-popover">
        {text}
      </span>
    </span>
  );
}
