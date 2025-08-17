export default function Footer() {
  return (
    <footer className="mt-20 pt-8 border-t border-gray-200 text-sm text-gray-600">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between">
        <p>© {new Date().getFullYear()} SkinCompass – Precision engineered in Germany</p>
        <div className="flex space-x-4 mt-2 md:mt-0">
          <a href="/impressum" className="hover:underline">Impressum</a>
          <a href="/datenschutz" className="hover:underline">Datenschutz</a>
        </div>
      </div>
    </footer>
  );
}
