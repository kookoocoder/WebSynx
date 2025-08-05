import type React from 'react';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen min-h-screen w-full items-center justify-center overflow-hidden bg-gray-900">
      {/* You might want a container div inside if the page content shouldn't always be centered */}
      {children}
    </div>
  );
}
