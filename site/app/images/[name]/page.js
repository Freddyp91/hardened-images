import { notFound } from 'next/navigation';
import { getImages, getImage, repoUrl } from '../../../lib/data';
import { VulnBadges, CodeBlock } from '../../components';

export const dynamicParams = false;

export function generateStaticParams() {
  const images = getImages();
  // Static export needs at least one param; the placeholder renders a 404.
  return images.length ? images.map((i) => ({ name: i.name })) : [{ name: '_none' }];
}

export function generateMetadata({ params }) {
  return params.then(({ name }) => ({ title: `${name} | Hardened Images` }));
}

export default async function ImagePage({ params }) {
  const { name } = await params;
  const img = getImage(name);
  if (!img) notFound();
  const { latest } = img;
  const workflowIdentity = repoUrl
    ? `${repoUrl}/.github/workflows/build.yml@refs/heads/main`
    : '<repo-url>/.github/workflows/build.yml@refs/heads/main';

  return (
    <article>
      <h1>
        {img.title} <span className="version">{latest.version}</span>
      </h1>
      <p>{img.description}</p>

      <h3>Pull</h3>
      <CodeBlock>{`docker pull ${img.image}:${latest.version}\n# or pin the exact build\ndocker pull ${img.image}@${latest.digest}`}</CodeBlock>

      {img.usage && (
        <>
          <h3>Run</h3>
          <CodeBlock>{img.usage.replaceAll('{image}', `${img.image}:${latest.version}`)}</CodeBlock>
        </>
      )}

      <h3>Verify the signature</h3>
      <CodeBlock>{`cosign verify ${img.image}@${latest.digest} \\\n  --certificate-identity ${workflowIdentity} \\\n  --certificate-oidc-issuer https://token.actions.githubusercontent.com`}</CodeBlock>

      <h3>Download the SBOM</h3>
      <CodeBlock>{`cosign verify-attestation --type spdxjson ${img.image}@${latest.digest} \\\n  --certificate-identity ${workflowIdentity} \\\n  --certificate-oidc-issuer https://token.actions.githubusercontent.com \\\n  | jq -r .payload | base64 -d | jq .predicate > sbom.spdx.json`}</CodeBlock>

      <h3>Vulnerabilities</h3>
      <table>
        <thead>
          <tr><th>Image</th><th>Total</th><th>By severity</th></tr>
        </thead>
        <tbody>
          <tr><td>This image</td><td>{latest.vulns.total}</td><td><VulnBadges vulns={latest.vulns} /></td></tr>
          {latest.upstreamVulns && (
            <tr>
              <td>{img.upstream.image}:{latest.version}</td>
              <td>{latest.upstreamVulns.total}</td>
              <td><VulnBadges vulns={latest.upstreamVulns} /></td>
            </tr>
          )}
        </tbody>
      </table>

      {latest.topVulns?.length > 0 && (
        <details>
          <summary>Open findings in this image ({latest.topVulns.length})</summary>
          <table>
            <thead><tr><th>ID</th><th>Package</th><th>Severity</th><th>Installed</th><th>Fixed in</th></tr></thead>
            <tbody>
              {latest.topVulns.map((v) => (
                <tr key={`${v.id}-${v.pkg}`}>
                  <td>{v.id}</td><td>{v.pkg}</td><td>{v.severity}</td><td>{v.installed}</td><td>{v.fixed || 'no fix yet'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      )}

      <h3>Rebuild history</h3>
      <table>
        <thead><tr><th>Built (UTC)</th><th>Version</th><th>Digest</th><th>CVEs</th><th>Upstream CVEs</th></tr></thead>
        <tbody>
          {img.history.slice(0, 40).map((h) => (
            <tr key={h.builtAt + h.digest}>
              <td>{h.runUrl ? <a href={h.runUrl}>{h.builtAt.replace('T', ' ').slice(0, 16)}</a> : h.builtAt.slice(0, 16)}</td>
              <td>{h.version}</td>
              <td className="mono">{h.digest.slice(0, 19)}…</td>
              <td>{h.vulns.total}</td>
              <td>{h.upstreamVulns?.total ?? 'n/a'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </article>
  );
}
