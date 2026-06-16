import { useState } from 'react';

interface Props {
  value: string;
  label?: string;
}

export function CopyButton({ value, label = 'Copy' }: Props) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      // Clipboard may be unavailable (e.g. insecure context); ignore.
    }
  }

  return (
    <button className="btn small" onClick={copy}>
      {copied ? 'Copied!' : label}
    </button>
  );
}
