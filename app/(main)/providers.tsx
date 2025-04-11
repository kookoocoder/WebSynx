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
      // TEMPORARY LOGGING: Log all arguments coming to console.error
      console.log("Suppressor Check - Incoming args:", args);
      
      const message = args[0];

      // Check if this is the <think> tag error we want to suppress
      if (
        message && 
        typeof message === 'string' && 
        (message.includes("The tag <think> is unrecognized in this browser") ||
         (message.includes("React.createElement: type is invalid") && args[1]?.includes("<think>")))
      ) {
        // TEMPORARY LOGGING: Indicate suppression
        console.log("Suppressor Check: Matched and suppressing <think> error.");
        // Suppress this specific error
        return;
      }
      
      // TEMPORARY LOGGING: Indicate passthrough
      console.log("Suppressor Check: Did not match, passing error through.");
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
