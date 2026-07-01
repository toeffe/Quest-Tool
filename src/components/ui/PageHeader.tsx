import { HintTooltip } from './HintTooltip';

interface Props {
  title: string;
  lead?: string;
  hint?: string;
}

export function PageHeader({ title, lead, hint }: Props) {
  return (
    <header className="page-header">
      <div className="page-header-title-row">
        <h1 className="step-title">{title}</h1>
        {hint && <HintTooltip text={hint} label={title} />}
      </div>
      {lead && <p className="step-sub">{lead}</p>}
    </header>
  );
}
