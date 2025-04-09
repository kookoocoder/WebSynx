import Link from "next/link";
import GithubIcon from "@/components/icons/github-icon";

export default function Header() {
  return (
    <header className="relative mx-auto flex w-full shrink-0 items-center justify-center py-6">
      <Link href="/">
        <div className="flex items-center gap-2">
          <span className="text-xl font-semibold bg-gradient-to-r from-purple-600 via-pink-500 to-indigo-600 bg-clip-text text-transparent">
            WebSynx
          </span>
        </div>
      </Link>

      <div className="absolute right-3">
        <a
          href="https://github.com/websynx/websynx"
          target="_blank"
          className="ml-auto hidden items-center gap-3 rounded-full bg-gray-800/50 backdrop-blur-sm border border-purple-700/20 px-5 py-2 text-sm font-medium text-gray-200 shadow-sm transition-all hover:bg-gray-800/70 hover:border-purple-700/30 hover:shadow-md sm:flex"
        >
          <GithubIcon className="h-[18px] w-[18px]" />
          <div className="flex items-center gap-1.5">
            <span className="font-medium">GitHub</span>
          </div>
        </a>
      </div>
    </header>
  );
}
