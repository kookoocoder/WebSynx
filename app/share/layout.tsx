export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <body suppressHydrationWarning className="min-h-screen h-screen w-full overflow-hidden">
      {children}
    </body>
  );
}
