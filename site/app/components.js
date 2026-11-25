import { CopyButton } from './client';
import { SEVERITIES } from '../lib/data';

export function ShieldMark({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true" className="mark">
      <path d="M12 2l8 3v6c0 5-3.4 9.4-8 11-4.6-1.6-8-6-8-11V5l8-3z" />
      <path d="M8.5 12l2.5 2.5 4.5-5" />
    </svg>
  );
}

export function CodeBlock({ children, copy = true }) {
  const text = String(children);
  return (
    <div className="term">
      {copy && <CopyButton text={text} className="copy dark floating" ariaLabel="Copy command" />}
      <pre><code>{text}</code></pre>
    </div>
  );
}

export function SeverityLine({ vulns }) {
  if (!vulns) return <span className="muted">n/a</span>;
  return (
    <span className="mono small-mono">
      {SEVERITIES.map(([k, label], i) => (
        <span key={k} title={label}>{i > 0 && ' · '}{label[0]} {vulns[k] ?? 0}</span>
      ))}
    </span>
  );
}

// Horizontal bars per severity. Scale is shared across both images so lengths compare.
export function SeverityBars({ ours, theirs }) {
  const max = Math.max(1, ...SEVERITIES.flatMap(([k]) => [ours?.[k] ?? 0, theirs?.[k] ?? 0]));
  const pct = (n) => `${Math.max(n ? 2 : 0, Math.round((n / max) * 100))}%`;
  return (
    <div className="sev-bars">
      <div className="legend">
        {theirs && <span><i className="sw theirs" />Official image</span>}
        <span><i className="sw ours" />Ours</span>
      </div>
      {SEVERITIES.map(([k, label]) => (
        <div className="sev-row" key={k}>
          <span className="muted">{label}</span>
          <div className="sev-tracks">
            {theirs && (
              <div className="track"><span className="bar theirs" style={{ width: pct(theirs[k] ?? 0) }} /><span className="mono">{theirs[k] ?? 0}</span></div>
            )}
            <div className="track"><span className="bar ours" style={{ width: pct(ours?.[k] ?? 0) }} /><span className="mono">{ours?.[k] ?? 0}</span></div>
          </div>
        </div>
      ))}
    </div>
  );
}
