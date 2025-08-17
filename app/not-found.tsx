export default function NotFound() {
  return (
    <main className="max-w-2xl mx-auto px-6 py-24 text-center">
      <h1 className="text-3xl font-bold">Seite nicht gefunden</h1>
      <p className="mt-4 text-gray-600">
        Die angeforderte Seite existiert nicht oder wurde verschoben.
      </p>
      <a href="/" className="inline-block mt-6 underline">Zurück zur Startseite</a>
    </main>
  );
}
