import Link from 'next/link';
import { Inter, JetBrains_Mono, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { ShieldMark } from './components';
import { site } from '../lib/site';
import { repoUrl } from '../lib/data';

const inter = Inter({ subsets: ['latin'], variable: '--font-body', display: 'swap' });
const grotesk = Space_Grotesk({ subsets: ['latin'], weight: ['500', '600', '700'], variable: '--font-head', display: 'swap' });
const mono = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-mono', display: 'swap' });

export const metadata = {
  title: { default: `${site.name}: container images with fewer CVEs`, template: `%s | ${site.name}` },
  description: 'Minimal, signed, continuously rebuilt container images built from upstream source on Wolfi, scanned side by side with the official images.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${grotesk.variable} ${mono.variable}`}>
      <body>
        <a href="#content" className="skip">Skip to content</a>
        <header className="site-header">
          <div className="wrap header-row">
            <Link href="/" className="brand">
              <ShieldMark />
              <span>{site.name}</span>
            </Link>
            <nav aria-label="Main" className="main-nav">
              <Link href="/">Catalog</Link>
              <Link href="/trust/">How we build</Link>
              <Link href="/pricing/">Pricing</Link>
              <a href={repoUrl}>GitHub</a>
            </nav>
            <div className="spacer" />
            <a href={`${repoUrl}/issues`} className="btn primary">Request an image</a>
          </div>
        </header>
        <main id="content">{children}</main>
        <footer className="site-footer">
          <div className="wrap footer-row">
            <span>Built from upstream open source on <a href="https://github.com/wolfi-dev">Wolfi</a> with melange and apko. Scanned with Trivy. Not derived from Chainguard Images.</span>
            <span><Link href="/trust/">How we build</Link> · <a href={repoUrl}>Source</a></span>
          </div>
        </footer>
      </body>
    </html>
  );
}
