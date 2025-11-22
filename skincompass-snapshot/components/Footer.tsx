// components/Footer.tsx
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-gray-200">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 text-sm text-gray-600">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-6">
            <Link href="/impressum" className="hover:text-gray-900">
              Impressum
            </Link>
            <Link href="/datenschutz" className="hover:text-gray-900">
              Datenschutz
            </Link>
          </div>

          <p className="text-gray-500">
            © {new Date().getFullYear()} SkinCompass
          </p>
        </div>
      </div>
    </footer>
  );
}