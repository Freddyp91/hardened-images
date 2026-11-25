import Link from 'next/link';

export default function NotFound() {
  return (
    <section className="wrap page-hero">
      <h1>That image isn&apos;t in the catalog yet.</h1>
      <p className="lede"><Link href="/">Browse the catalog</Link> or request it on GitHub.</p>
    </section>
  );
}
