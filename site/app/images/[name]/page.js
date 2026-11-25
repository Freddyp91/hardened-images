import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getImages, getImage, repoUrl, upstreamRef, formatUtc, shortDigest } from '../../../lib/data';
import { site } from '../../../lib/site';
import { CodeBlock, SeverityBars, SeverityLine } from '../../components';
import { CopyButton, PullTabs, TimeAgo } from '../../client';

export const dynamicParams = false;

export function generateStaticParams() {
  const images = getImages();
  // Static export needs at least one param; the placeholder renders a 404.
  return images.length ? images.map((i) => ({ name: i.name })) : [{ name: '_none' }];
}

export async function generateMetadata({ params }) {
  const { name } = await params;
  const img = getImage(name);
  return { title: img ? `${img.title} ${img.latest.version}` : name };
}

export default async function ImagePage({ params }) {
  const { name } = await params;
  const img = getImage(name);
  if (!img) notFound();
  const { latest } = img;
  const upstream = upstreamRef(img);
  const tagRef = `${img.image}:${latest.version}`;
  const digestRef = `${img.image}@${latest.digest}`;
  const identity = `${repoUrl}/.github/workflows/build.yml@refs/heads/main`;
  const ours = latest.vulns.total;
  const findings = latest.topVulns ?? [];

  const facts = [
    ['Latest build', <TimeAgo key="t" iso={latest.builtAt} />],
    ['Packages', latest.packageCount ?? 'n/a'],
    ['Architectures', site.platforms],
    ['Base', site.base],
    ['Rebuild cadence', site.rebuildCadence],
  ];

  return (
    <>
      <div className="wrap detail-head">
        <div className="crumbs muted small"><Link href="/">Catalog</Link> / {img.title}</div>
        <div className="title-row">
          <h1>{img.title}</h1>
          <span className="pill-mono">{latest.version}</span>
          <span className={`chip ${ours === 0 ? 'good' : 'warn'}`}>{ours === 0 ? '0 known CVEs' : `${ours} known CVEs`}</span>
        </div>
        <p className="muted lede-sm">
          {img.description}
          {upstream && <> Drop-in for <span className="mono">{upstream}</span>.</>}
        </p>
        <nav aria-label="Image sections" className="section-nav">
          <a href="#use">Use</a>
          <a href="#security">Security</a>
          <a href="#verify">Verify</a>
          <a href="#history">History</a>
        </nav>
      </div>

      <div className="wrap detail-body">
        <div className="detail-main">
          <section id="use">
            <h2>Pull</h2>
            <PullTabs tagCmd={`docker pull ${tagRef}`} digestCmd={`docker pull ${digestRef}`} />
            {img.usage && (
              <>
                <h2>Run</h2>
                <CodeBlock>{img.usage.replaceAll('{image}', tagRef)}</CodeBlock>
              </>
            )}
            <p className="muted small">Runs as a non-root user with no package manager inside.</p>
          </section>

          <section id="security">
            <div className="section-title">
              <h2>Security</h2>
              <span className="muted small">
                Trivy scan, <TimeAgo iso={latest.builtAt} />
                {latest.runUrl && <> · <a href={latest.runUrl}>build log</a></>}
              </span>
            </div>
            <div className="stat-grid">
              <div className="stat">
                <div className="muted small">This image</div>
                <div className="big ours">{ours}</div>
                <SeverityLine vulns={latest.vulns} />
              </div>
              {latest.upstreamVulns && (
                <div className="stat">
                  <div className="muted small mono-wrap">{upstream}</div>
                  <div className="big theirs">{latest.upstreamVulns.total}</div>
                  <SeverityLine vulns={latest.upstreamVulns} />
                </div>
              )}
            </div>
            <div className="panel">
              <SeverityBars ours={latest.vulns} theirs={latest.upstreamVulns} />
            </div>
            <details className="panel">
              <summary>Open findings in this image ({findings.length})</summary>
              {findings.length === 0 ? (
                <p className="muted">Nothing to show. When a finding appears it is listed here with its package, installed version and fixed version.</p>
              ) : (
                <div className="table-box flat">
                  <table>
                    <thead><tr><th>ID</th><th>Package</th><th>Severity</th><th>Installed</th><th>Fixed in</th></tr></thead>
                    <tbody>
                      {findings.map((v) => (
                        <tr key={`${v.id}-${v.pkg}`}>
                          <td className="mono">{v.id}</td><td>{v.pkg}</td><td>{v.severity}</td><td className="mono">{v.installed}</td><td className="mono">{v.fixed || 'no fix yet'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </details>
          </section>

          <section id="verify">
            <h2>Verify</h2>
            <p className="muted">Every digest is signed keyless by this repository&apos;s build workflow. Check it before you deploy.</p>
            <div className="mini-grid">
              <div className="mini"><strong>Signature</strong><span className="muted small">cosign, Sigstore keyless</span></div>
              <div className="mini"><strong>SBOM</strong><span className="muted small">SPDX JSON attestation</span></div>
              <div className="mini"><strong>Provenance</strong><span className="muted small">GitHub build attestation</span></div>
            </div>
            <h3>Verify the signature</h3>
            <CodeBlock>{`cosign verify ${digestRef} \\\n  --certificate-identity ${identity} \\\n  --certificate-oidc-issuer https://token.actions.githubusercontent.com`}</CodeBlock>
            <h3>Download the SBOM</h3>
            <CodeBlock>{`cosign verify-attestation --type spdxjson ${digestRef} \\\n  --certificate-identity ${identity} \\\n  --certificate-oidc-issuer https://token.actions.githubusercontent.com \\\n  | jq -r .payload | base64 -d | jq .predicate > sbom.spdx.json`}</CodeBlock>
          </section>

          <section id="history">
            <h2>Rebuild history</h2>
            <div className="table-box">
              <table>
                <thead><tr><th>Built (UTC)</th><th>Version</th><th>Digest</th><th>Ours</th><th>Official</th></tr></thead>
                <tbody>
                  {img.history.slice(0, 40).map((h) => (
                    <tr key={h.builtAt + h.digest}>
                      <td>{h.runUrl ? <a href={h.runUrl}>{formatUtc(h.builtAt)}</a> : formatUtc(h.builtAt)}</td>
                      <td className="mono">{h.version}</td>
                      <td className="mono" title={h.digest}>{shortDigest(h.digest)}…</td>
                      <td className="ours strong">{h.vulns.total}</td>
                      <td className="theirs">{h.upstreamVulns?.total ?? 'n/a'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <aside className="facts">
          <h2>At a glance</h2>
          <dl>
            {facts.map(([k, v]) => (
              <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
            ))}
          </dl>
          <div>
            <div className="muted small">Digest</div>
            <div className="digest-row">
              <span className="mono truncate" title={latest.digest}>{latest.digest}</span>
              <CopyButton text={latest.digest} ariaLabel="Copy digest" />
            </div>
          </div>
          {img.upstream?.github && <a href={`https://github.com/${img.upstream.github}`} className="small">Upstream project: {img.upstream.github}</a>}
        </aside>
      </div>
    </>
  );
}
