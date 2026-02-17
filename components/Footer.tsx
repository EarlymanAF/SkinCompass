// components/Footer.tsx
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-10 border-t border-border bg-surface">
      <div className="mx-auto max-w-7xl px-6 md:px-8 py-6 text-sm text-secondary">
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
