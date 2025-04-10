import type { Metadata } from "next";
import PlausibleProvider from "next-plausible";
import "./globals.css";

let title = "WebSynx";
let description = "Generate your next app with WebSynx";
let url = "https://websynx.vercel.app";
let ogimage = "https://websynx.vercel.app/og-image.png";
let sitename = "websynx.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(url),
  title,
  description,
  icons: {
    icon: "/websynx-logo.png",
  },
  openGraph: {
    images: [ogimage],
    title,
    description,
    url: url,
    siteName: sitename,
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    images: [ogimage],
    title,
    description,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full scrollbar-hide">
      <head>
        <PlausibleProvider domain="llamacoder.io" />
      </head>

      <body suppressHydrationWarning className="flex min-h-full flex-col bg-gray-900 text-gray-100 antialiased relative scrollbar-hide">
        {children}
      </body>
    </html>
  );
}
