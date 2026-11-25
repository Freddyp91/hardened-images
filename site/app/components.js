export function VulnBadges({ vulns }) {
  if (!vulns) return <span className="muted">n/a</span>;
  return (
    <span className="badges">
      <span className={`badge crit ${vulns.critical ? '' : 'zero'}`} title="Critical">C {vulns.critical}</span>
      <span className={`badge high ${vulns.high ? '' : 'zero'}`} title="High">H {vulns.high}</span>
      <span className={`badge med ${vulns.medium ? '' : 'zero'}`} title="Medium">M {vulns.medium}</span>
      <span className={`badge low ${vulns.low ? '' : 'zero'}`} title="Low">L {vulns.low}</span>
    </span>
  );
}

export function CodeBlock({ children }) {
  return <pre className="code"><code>{children}</code></pre>;
}
