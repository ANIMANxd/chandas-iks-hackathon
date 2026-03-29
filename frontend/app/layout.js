import './globals.css';

export const metadata = {
  title: 'Chandas — Sanskrit Prosody Engine',
  description:
    'Chanda-Melodic Constrained Sanskrit Recitation — analyze and synthesize metrically precise Sanskrit verse audio.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="sa" className="h-[100vh] overflow-hidden antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {/* Core Typography */}
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400&family=IBM+Plex+Mono:wght@400;700&family=Instrument+Sans:wght@300&display=swap"
          rel="stylesheet"
        />
        {/* Devanagari specific font with exact requested subset parameter */}
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Serif+Devanagari:wght@400&subset=devanagari&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className="h-[100vh] overflow-hidden m-0 p-0 flex flex-col"
        style={{
          backgroundColor: 'var(--color-base)',
          color: 'var(--color-text-primary)',
          fontFamily: 'var(--font-display)',
        }}
      >
        {children}
      </body>
    </html>
  );
}
