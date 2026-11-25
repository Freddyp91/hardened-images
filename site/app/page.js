import Link from 'next/link';
import { getImages, timeAgo } from '../lib/data';
import { VulnBadges } from './components';

export default function Home() {
  const images = getImages();
  return (
    <>
      <section className="hero">
        <h1>Container images with fewer CVEs</h1>
        <p>
          Each image is built from the upstream release on a minimal Wolfi base, signed with Sigstore cosign, shipped
          with an SBOM and build provenance, and rebuilt several times a day so fixes land fast.
        </p>
      </section>

      {images.length === 0 ? (
        <p className="empty">The first build hasn&apos;t finished yet. Check back in a few minutes.</p>
      ) : (
        <div className="grid">
          {images.map((img) => {
            const ours = img.latest.vulns.total;
            const theirs = img.latest.upstreamVulns?.total;
            return (
              <Link key={img.name} href={`/images/${img.name}/`} className="card">
                <div className="card-head">
                  <h2>{img.title}</h2>
                  <span className="version">{img.latest.version}</span>
                </div>
                <p>{img.description}</p>
                <div className="compare">
                  <div>
                    <div className="big">{ours}</div>
                    <div className="muted">CVEs in ours</div>
                  </div>
                  {theirs != null && (
                    <div>
                      <div className="big dim">{theirs}</div>
                      <div className="muted">in upstream image</div>
                    </div>
                  )}
                </div>
                <VulnBadges vulns={img.latest.vulns} />
                <div className="muted small">Rebuilt {timeAgo(img.latest.builtAt)}</div>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
