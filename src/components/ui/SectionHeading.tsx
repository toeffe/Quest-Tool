import type { ReactNode } from 'react';
import { HintTooltip } from './HintTooltip';

interface Props {
  title: string;
  hint?: string;
  actions?: ReactNode;
  as?: 'h2' | 'h3' | 'h4';
}

export function SectionHeading({ title, hint, actions, as: Tag = 'h3' }: Props) {
  return (
    <div className={`section-heading row-between${actions ? '' : ' section-heading-solo'}`}>
      <div className="section-heading-title">
        <Tag className="section-heading-text">{title}</Tag>
        {hint && <HintTooltip text={hint} label={title} />}
      </div>
      {actions}
    </div>
  );
}
