import React from 'react';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen h-screen w-full overflow-hidden flex items-center justify-center bg-gray-900">
      {/* You might want a container div inside if the page content shouldn't always be centered */}
      {children}
    </div>
  );
}
