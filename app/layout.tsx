export const metadata = {
  title: "SkinCompass – Dein Wegweiser zum fairsten Preis",
  description:
    "Vergleiche Marktplätze in Echtzeit, erkenne Gebühren & Trends. Precision engineered in Germany.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body className="min-h-screen bg-white text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}
