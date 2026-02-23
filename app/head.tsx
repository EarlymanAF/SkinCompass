import { OG_DESCRIPTION, SEO_DESCRIPTION, SEO_TITLE } from "@/lib/seo";

export default function Head() {
  return (
    <>
      <title>{SEO_TITLE}</title>
      <meta name="description" content={SEO_DESCRIPTION} />
      <meta
        name="keywords"
        content="cs2 skins, cs2 skins preisvergleich, cs2 inventar wert, cs2 skin trading, cs2 skins kaufen, cs2 skins verkaufen, cs2 skin preise, digitale assets"
      />
      <meta name="robots" content="index, follow" />

      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={SEO_TITLE} />
      <meta property="og:description" content={OG_DESCRIPTION} />
      <meta property="og:url" content="https://skincompass.de/" />
      <meta property="og:site_name" content="SkinCompass" />
      <meta property="og:image" content="https://skincompass.de/og-image.png" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={SEO_TITLE} />
      <meta name="twitter:description" content={OG_DESCRIPTION} />
      <meta name="twitter:image" content="https://skincompass.de/og-image.png" />

      <link rel="icon" href="/favicon.svg" type="image/svg+xml" sizes="any" />
      <link rel="icon" href="/favicon-48x48.png" sizes="48x48" type="image/png" />
      <link rel="icon" href="/favicon-96x96.png" sizes="96x96" type="image/png" />
    </>
  );
}
