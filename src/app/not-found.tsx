import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-black text-white">
      <div className="text-center px-4">
        <p className="text-6xl font-bold text-primary mb-4">404</p>
        <h1 className="text-2xl font-bold mb-2">Page Not Found</h1>
        <p className="text-gray-400 mb-8 text-sm">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          Go back home
        </Link>
      </div>
    </div>
  );
}
