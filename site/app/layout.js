import './globals.css';

export const metadata = {
  title: 'Hardened Images',
  description: 'Minimal, signed, continuously rebuilt container images on Wolfi.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <header className="top">
          <a href={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/`} className="brand">Hardened Images</a>
          <span className="tag">Minimal. Signed. Rebuilt every 6 hours.</span>
        </header>
        <main>{children}</main>
        <footer>
          Built from upstream source releases on <a href="https://github.com/wolfi-dev">Wolfi</a> with melange and apko.
          Scanned with Trivy.
        </footer>
      </body>
    </html>
  );
}
