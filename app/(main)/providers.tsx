"use client";

import { createContext, useRef, useState, useEffect } from "react";

export const Context = createContext<{
  streamPromise: Promise<Response> | null;
  setStreamPromise: (promise: Promise<Response> | null) => void;
}>({
  streamPromise: null,
  setStreamPromise: () => {},
});

export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  const [streamPromise, _setStreamPromise] = useState<Promise<Response> | null>(
    null,
  );
  const ref = useRef(streamPromise);

  const setStreamPromise = (promise: Promise<Response> | null) => {
    ref.current = promise;
    _setStreamPromise(promise);
  };

  // Add error suppression for <think> tag errors
  useEffect(() => {
    // Store the original console.error function
    const originalConsoleError = console.error;
    
    // Replace console.error with a filtered version
    console.error = function (...args) {
      // Check if this is the <think> tag error we want to suppress
      if (
        args[0] && 
        typeof args[0] === 'string' && 
        (args[0].includes("The tag <think> is unrecognized in this browser") ||
         args[0].includes("React.createElement: type is invalid") && args[1]?.includes("<think>"))
      ) {
        // Suppress this specific error
        return;
      }
      
      // Let other errors pass through to the original console.error
      return originalConsoleError.apply(console, args);
    };
    
    // Restore the original console.error when the component unmounts
    return () => {
      console.error = originalConsoleError;
    };
  }, []);

  return (
    <Context.Provider value={{ streamPromise: ref.current, setStreamPromise }}>
      {children}
    </Context.Provider>
  );
}
