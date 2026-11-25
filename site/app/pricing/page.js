import Link from 'next/link';
import { repoUrl } from '../../lib/data';

export const metadata = { title: 'Pricing' };

export default function Pricing() {
  return (
    <>
      <section className="wrap page-hero center">
        <h1>Free today. A flat team plan is coming.</h1>
        <p className="lede">
          The latest tag of every image is free. Paid plans will add pinned versions, private pulls and someone on the
          hook for fixes.
        </p>
      </section>

      <section className="wrap tiers">
        <div className="tier">
          <div className="tier-name">Free</div>
          <div className="tier-price">$0</div>
          <p className="muted small">For trying images out and for open source projects.</p>
          <ul>
            <li>Latest tag of every image</li>
            <li>Signatures, SBOMs and provenance</li>
            <li>Public scan history</li>
          </ul>
          <Link href="/" className="btn outline">Browse the catalog</Link>
        </div>
        <div className="tier featured">
          <div className="tier-top"><span className="tier-name">Team</span><span className="chip info">Coming soon</span></div>
          <div className="tier-price">Flat monthly</div>
          <p className="muted small">For teams running hardened images in production.</p>
          <ul>
            <li>Every version tag, kept pullable</li>
            <li>Private pulls with access tokens</li>
            <li>A fix target for critical CVEs</li>
            <li>Request new images</li>
          </ul>
          <a href={`${repoUrl}/issues`} className="btn accent">Tell us you&apos;re interested</a>
        </div>
        <div className="tier">
          <div className="tier-name">Custom</div>
          <div className="tier-price">Let&apos;s talk</div>
          <p className="muted small">For regulated environments and custom images.</p>
          <ul>
            <li>Images built to your spec</li>
            <li>Compliance options</li>
            <li>Invoicing and security reviews</li>
          </ul>
          <a href={`${repoUrl}/issues`} className="btn outline">Get in touch</a>
        </div>
      </section>

      <section className="wrap faq">
        <h2>Questions</h2>
        <details>
          <summary>Are these the same as the official images?</summary>
          <p className="muted">Same upstream release, rebuilt from source on a smaller base. The scan comparison on each image page shows the difference.</p>
        </details>
        <details>
          <summary>Can I request an image?</summary>
          <p className="muted">Yes. <a href={`${repoUrl}/issues`}>Open an issue on GitHub</a>.</p>
        </details>
      </section>
    </>
  );
}
