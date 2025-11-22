export default function Head() {
  return (
    <>
      <title>SkinCompass – CS2-Skins fair vergleichen</title>
      <meta
        name="description"
        content="Echte Endpreise für CS2-Skins – inkl. Gebühren & Währungsumrechnung. Live-Vergleich von Marktplätzen & 7-Tage-Preistrend."
      />
      <meta name="robots" content="index, follow" />

      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content="SkinCompass – CS2-Skins fair vergleichen" />
      <meta
        property="og:description"
        content="Vergleiche CS2-Skins in Sekunden – Endpreise, Gebührenübersicht & Preistrends."
      />
      <meta property="og:url" content="https://skincompass.de/" />
      <meta property="og:site_name" content="SkinCompass" />
      <meta property="og:image" content="https://skincompass.de/og-image.png" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="SkinCompass – CS2-Skins fair vergleichen" />
      <meta
        name="twitter:description"
        content="Alle CS2-Skinpreise auf einen Blick – fair, transparent & mit Preistrend."
      />
      <meta name="twitter:image" content="https://skincompass.de/og-image.png" />

      <link rel="icon" href="/favicon.ico" />
    </>
  );
}