import Link from 'next/link';
import { getImages, repoUrl, upstreamRef } from '../../lib/data';
import { site } from '../../lib/site';
import { CodeBlock } from '../components';

export const metadata = { title: 'How we build' };

const steps = [
  { n: '01 Watch', title: 'Track upstream', body: 'Checks upstream GitHub releases every hour and pins the new version and its sha256.', tool: 'watch-upstream.yml' },
  { n: '02 Package', title: 'Build from source', body: `Packages the official release on ${site.base} for ${site.platforms}.`, tool: 'melange' },
  { n: '03 Assemble', title: 'Minimal image', body: 'Only runtime dependencies, a non-root user and no package manager.', tool: 'apko' },
  { n: '04 Test', title: 'Prove it works', body: 'Package tests plus a smoke test that runs the real image. A failure blocks publishing.', tool: 'melange test · smoke-test.sh' },
  { n: '05 Sign and scan', title: 'Attach evidence', body: 'Keyless signature, SBOM and provenance, then a side-by-side scan with the official image.', tool: 'cosign · Trivy' },
];

export default function Trust() {
  const images = getImages();
  const example = images[0];
  return (
    <>
      <section className="wrap page-hero">
        <h1>Every claim on this site links to a public build log.</h1>
        <p className="lede">
          The pipeline runs in public GitHub Actions. You can read each step, rerun the scan yourself, and verify every
          signature without trusting us.
        </p>
      </section>

      <section className="wrap">
        <ol className="steps">
          {steps.map((s) => (
            <li key={s.n}>
              <span className="mono step-n">{s.n}</span>
              <span className="step-title">{s.title}</span>
              <span className="muted small">{s.body}</span>
              <span className="mono muted step-tool">{s.tool}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="band">
        <div className="wrap two-col">
          <div>
            <h2>How we count CVEs</h2>
            <ul className="plain-list">
              <li>Trivy scans our image and the official image of the same version, in the same run, with the same vulnerability database.</li>
              <li>Totals include critical, high, medium and low findings. We don&apos;t hide findings with VEX statements or allowlists.</li>
              <li>Each scan result is committed to the repository, so the history on every image page is a public record.</li>
            </ul>
          </div>
          <div>
            <h2>Evidence ledger</h2>
            <div className="table-box solid">
              <table>
                <thead><tr><th>Image</th><th>Ours</th><th>Official</th><th>Proof</th></tr></thead>
                <tbody>
                  {images.map((img) => (
                    <tr key={img.name}>
                      <td><Link href={`/images/${img.name}/`} className="strong">{img.title} {img.latest.version}</Link></td>
                      <td className="ours strong">{img.latest.vulns.total}</td>
                      <td className="theirs">{img.latest.upstreamVulns?.total ?? 'n/a'}</td>
                      <td>
                        {img.latest.runUrl && <><a href={img.latest.runUrl}>Build log</a> · </>}
                        <a href={`${repoUrl}/blob/main/data/images/${img.name}.json`}>Raw JSON</a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {example && (
        <section className="wrap two-col check">
          <div>
            <h2>Check it yourself</h2>
            <p className="muted">Run the same scan we run. If your numbers differ, open an issue and we will look at it in public.</p>
          </div>
          <CodeBlock>{`# ours\ntrivy image ${example.image}:${example.latest.version}\n# the official image\ntrivy image ${upstreamRef(example)}`}</CodeBlock>
        </section>
      )}
    </>
  );
}
