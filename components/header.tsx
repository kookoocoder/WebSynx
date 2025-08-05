import Image from 'next/image';
import Link from 'next/link';
import GithubIcon from '@/components/icons/github-icon';

export default function Header() {
  return (
    <header className="relative mx-auto flex w-full shrink-0 items-center justify-center py-6">
      <Link href="/">
        <div className="flex items-center gap-2">
          <Image
            alt="WebSynx Logo"
            height={32}
            src="/websynx-logo.png"
            width={32}
          />
          <span className="bg-gradient-to-r from-purple-600 via-pink-500 to-indigo-600 bg-clip-text font-semibold text-transparent text-xl">
            WebSynx
          </span>
        </div>
      </Link>

      <div className="absolute right-3">
        <a
          className="ml-auto hidden items-center gap-3 rounded-full border border-purple-700/20 bg-gray-800/50 px-5 py-2 font-medium text-gray-200 text-sm shadow-sm backdrop-blur-sm transition-all hover:border-purple-700/30 hover:bg-gray-800/70 hover:shadow-md sm:flex"
          href="https://github.com/websynx/websynx"
          rel="noopener"
          target="_blank"
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
