import type { Metadata } from 'next';
import PlausibleProvider from 'next-plausible';
import './globals.css';
import { Inter } from 'next/font/google';
// import { ThemeProvider } from "@/components/theme-provider"; // Commented out - Fix path
import { cn } from '@/lib/utils';

// Define the font instance
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter', // Ensure this matches CSS variable if used
});

const title = 'WebSynx - AI Chat';
const description = 'Interact with advanced AI models.';
const url = 'https://websynx.vercel.app'; // Ensure this is your production URL
const ogimage = `${url}/og-image.png`; // Use template literal for consistency
const sitename = 'WebSynx'; // Or your actual site name

export const metadata: Metadata = {
  metadataBase: new URL(url),
  title,
  description,
  icons: {
    icon: '/websynx-logo.png', // Ensure this path is correct in /public
  },
  openGraph: {
    images: [ogimage],
    title,
    description,
    url,
    siteName: sitename,
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
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
    <html className="scrollbar-hide h-full" lang="en" suppressHydrationWarning>
      {/* Ensure no whitespace directly inside head */}
      <head>
        <PlausibleProvider domain="websynx.vercel.app" />
        {/* Add other essential head elements like charset, viewport if needed */}
        {/* <meta charSet="utf-8" /> */}
        {/* <meta name="viewport" content="width=device-width, initial-scale=1" /> */}
      </head>
      {/* Only ONE body tag should exist, defined here */}
      <body
        className={cn(
          'min-h-screen bg-background font-sans antialiased',
          'bg-gray-900 text-gray-100', // Base styles
          inter.variable // Use the defined font variable
        )}
      >
        {/* ThemeProvider wrapper commented out - Fix path and uncomment later */}
        {/* <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        > */}
        {children}{' '}
        {/* Child components should NOT render <html>, <head>, or <body> */}
        {/* </ThemeProvider> */}
      </body>
    </html>
  );
}
