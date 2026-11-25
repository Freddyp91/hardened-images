'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

export function CopyButton({ text, label = 'Copy', ariaLabel, className = 'copy' }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }
  return (
    <button type="button" className={className} onClick={copy} aria-label={ariaLabel}>
      {copied ? 'Copied' : label}
    </button>
  );
}

function relative(iso) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 48) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

// Renders the absolute UTC time at build, then switches to a relative time in the browser,
// so the static page never shows a stale "10m ago".
export function TimeAgo({ iso }) {
  const [text, setText] = useState(null);
  useEffect(() => {
    setText(relative(iso));
    const t = setInterval(() => setText(relative(iso)), 60000);
    return () => clearInterval(t);
  }, [iso]);
  return (
    <time dateTime={iso} title={iso}>
      {text ?? `${iso.replace('T', ' ').slice(0, 16)} UTC`}
    </time>
  );
}

export function PullTabs({ tagCmd, digestCmd }) {
  const [mode, setMode] = useState('tag');
  const cmd = mode === 'tag' ? tagCmd : digestCmd;
  return (
    <div className="term">
      <div className="term-bar">
        <div role="tablist" aria-label="Pull by" className="term-tabs">
          <button type="button" role="tab" aria-selected={mode === 'tag'} onClick={() => setMode('tag')}>Tag</button>
          <button type="button" role="tab" aria-selected={mode === 'digest'} onClick={() => setMode('digest')}>Digest (pinned)</button>
        </div>
        <CopyButton text={cmd} className="copy dark" ariaLabel="Copy pull command" />
      </div>
      <pre><code>{cmd}</code></pre>
    </div>
  );
}

export function CatalogTable({ images, roadmap }) {
  const [q, setQ] = useState('');
  const query = q.trim().toLowerCase();
  const match = (i) => !query || `${i.name} ${i.title} ${i.description}`.toLowerCase().includes(query);
  const rows = useMemo(() => images.filter(match), [images, query]);
  const upcoming = useMemo(() => roadmap.filter(match), [roadmap, query]);

  return (
    <>
      <div className="catalog-bar">
        <h2>Catalog</h2>
        <label htmlFor="q" className="sr-only">Search images</label>
        <input id="q" type="search" placeholder="Search images, e.g. keycloak" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="table-box">
        <table className="catalog">
          <thead>
            <tr>
              <th>Image</th>
              <th>Latest</th>
              <th>CVEs, ours vs official</th>
              <th>Packages</th>
              <th>Rebuilt</th>
              <th><span className="sr-only">Pull</span></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((img) => (
              <tr key={img.name}>
                <td>
                  <Link href={`/images/${img.name}/`} className="img-name">{img.title}</Link>
                  <div className="muted small">{img.description}</div>
                </td>
                <td><span className="pill-mono">{img.version}</span></td>
                <td>
                  <div className="vs">
                    <span className="num ours">{img.ours}</span>
                    {img.theirs != null && (
                      <>
                        <span className="muted">vs</span>
                        <span className="num theirs">{img.theirs}</span>
                        {img.reduction != null && <span className="chip good">{img.reduction}% fewer</span>}
                      </>
                    )}
                  </div>
                </td>
                <td className="mono">{img.packageCount ?? 'n/a'}</td>
                <td className="muted"><TimeAgo iso={img.builtAt} /></td>
                <td className="right">
                  <CopyButton text={`docker pull ${img.image}:${img.version}`} label="Copy pull" ariaLabel={`Copy pull command for ${img.title}`} />
                </td>
              </tr>
            ))}
            {upcoming.map((r) => (
              <tr key={r.name} className="upcoming">
                <td>
                  <span className="img-name muted-strong">{r.title}</span>
                  <div className="muted small">{r.description}</div>
                </td>
                <td colSpan={5}><span className="chip info">{r.status}</span></td>
              </tr>
            ))}
            {rows.length === 0 && upcoming.length === 0 && (
              <tr><td colSpan={6} className="muted">No images match &ldquo;{q}&rdquo;. <a href="https://github.com/Freddyp91/hardened-images/issues">Request it</a>.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
