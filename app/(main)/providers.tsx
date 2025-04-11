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

  // Add error suppression for <think> tag and rate limit errors
  useEffect(() => {
    // Store the original console.error function
    const originalConsoleError = console.error;
    
    // Replace console.error with a filtered version
    console.error = function (...args) {
      // TEMPORARY LOGGING: Log all arguments coming to console.error
      console.log("Suppressor Check - Incoming args:", args);
      
      const errorOrMessage = args[0];
      let messageString = "";

      if (typeof errorOrMessage === 'string') {
        messageString = errorOrMessage;
      } else if (errorOrMessage && typeof errorOrMessage === 'object' && typeof errorOrMessage.message === 'string') {
        // Handle cases where the first arg is an Error object
        messageString = errorOrMessage.message;
      }

      // Check if this is one of the errors we want to suppress
      if (
        messageString && 
        ( // Check for <think> tag errors
          messageString.includes("The tag <think> is unrecognized in this browser") ||
          (messageString.includes("React.createElement: type is invalid") && args[1]?.includes("<think>")) ||
          // Check for Supabase rate limit error
          messageString.includes("Request rate limit reached")
        )
      ) {
        // TEMPORARY LOGGING: Indicate suppression
        console.log("Suppressor Check: Matched and suppressing known error:", messageString);
        // Suppress this specific error
        return;
      }
      
      // TEMPORARY LOGGING: Indicate passthrough
      console.log("Suppressor Check: Did not match, passing error through:", args);
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
