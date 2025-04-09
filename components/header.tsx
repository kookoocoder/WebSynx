import Link from "next/link";

export default function Header() {
  return (
    <header className="relative mx-auto flex w-full shrink-0 items-center justify-center py-6">
      <Link href="/">
        <h1 className="text-2xl font-bold text-gray-900">WebSynx</h1>
      </Link>
    </header>
  );
}
