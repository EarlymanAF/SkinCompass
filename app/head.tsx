export default function Head() {
  return (
    <>
      <title>SkinCompass – Coming Soon</title>
      <meta
        name="description"
        content="SkinCompass baut Portfolio-Tracking und Preisvergleich für CS-Skins und weitere digitale Märkte."
      />
      <meta name="robots" content="index, follow" />

      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content="SkinCompass – Coming Soon" />
      <meta
        property="og:description"
        content="Portfolio-Tracking und Preisvergleich für CS-Skins und weitere digitale Märkte."
      />
      <meta property="og:url" content="https://skincompass.de/" />
      <meta property="og:site_name" content="SkinCompass" />
      <meta property="og:image" content="https://skincompass.de/og-image.png" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="SkinCompass – Coming Soon" />
      <meta
        name="twitter:description"
        content="Portfolio-Tracking und Preisvergleich für CS-Skins und weitere digitale Märkte."
      />
      <meta name="twitter:image" content="https://skincompass.de/og-image.png" />

      <link rel="icon" href="/favicon.ico" />
    </>
  );
}
