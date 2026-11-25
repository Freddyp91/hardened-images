import Link from 'next/link';
import { getImages, reduction } from '../lib/data';
import { roadmap, site } from '../lib/site';
import { CatalogTable } from './client';
import { SeverityBars } from './components';

export default function Home() {
  const images = getImages();
  // Feature the image with the biggest absolute CVE gap.
  const featured = images
    .filter((i) => i.latest.upstreamVulns)
    .sort((a, b) => (b.latest.upstreamVulns.total - b.latest.vulns.total) - (a.latest.upstreamVulns.total - a.latest.vulns.total))[0];

  const rows = images.map((img) => ({
    name: img.name,
    title: img.title,
    description: img.description,
    image: img.image,
    version: img.latest.version,
    ours: img.latest.vulns.total,
    theirs: img.latest.upstreamVulns?.total ?? null,
    reduction: reduction(img),
    packageCount: img.latest.packageCount,
    builtAt: img.latest.builtAt,
  }));
  const names = new Set(images.map((i) => i.name));
  const upcoming = roadmap.filter((r) => !names.has(r.name));

  return (
    <>
      <section className="wrap hero">
        <div className="hero-copy">
          <div className="eyebrow mono">Rebuilt {site.rebuildCadence} · signed · SBOM attached</div>
          <h1>{site.tagline}</h1>
          <p className="lede">
            Drop-in replacements built from upstream source on a minimal Wolfi base. Every build is scanned next to the
            official image so you can see the difference, not take our word for it.
          </p>
        </div>
        {featured && (
          <div className="proof">
            <div className="muted small">{featured.title} {featured.latest.version}, latest scan</div>
            <div className="proof-nums">
              <div>
                <div className="huge theirs">{featured.latest.upstreamVulns.total}</div>
                <div className="muted small">official image</div>
              </div>
              <svg width="40" height="24" viewBox="0 0 40 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" className="arrow"><path d="M2 12h34M28 4l8 8-8 8" /></svg>
              <div>
                <div className="huge ours">{featured.latest.vulns.total}</div>
                <div className="muted small">ours</div>
              </div>
            </div>
            <SeverityBars ours={featured.latest.vulns} theirs={featured.latest.upstreamVulns} />
            <Link href={`/images/${featured.name}/#security`} className="more">See the full scan →</Link>
          </div>
        )}
      </section>

      <section className="wrap">
        {images.length === 0 && upcoming.length === 0 ? (
          <p className="empty">The first build hasn&apos;t finished yet. Check back in a few minutes.</p>
        ) : (
          <CatalogTable images={rows} roadmap={upcoming} />
        )}
        <p className="muted small note">
          Scanned with Trivy against the official image of the same version. Counts include critical, high, medium and low findings.
        </p>
      </section>

      <section className="wrap pillars">
        <div>
          <h3>Built from source</h3>
          <p>The official release, pinned by sha256 and packaged on Wolfi. Only the runtime packages it needs, and no package manager.</p>
        </div>
        <div>
          <h3>Signed and attested</h3>
          <p>Keyless cosign signatures, an SPDX SBOM and build provenance on every digest. Verify in one command.</p>
        </div>
        <div>
          <h3>Tested before publish</h3>
          <p>Each image runs a real smoke test before it ships. If the test fails, nothing is published.</p>
        </div>
        <div>
          <h3>Rebuilt continuously</h3>
          <p>New upstream releases are picked up hourly, and every image is rebuilt {site.rebuildCadence} to pull in patched packages.</p>
        </div>
      </section>
    </>
  );
}
