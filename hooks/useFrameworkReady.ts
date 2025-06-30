import { useEffect, useState } from 'react';

declare global {
  interface Window {
    frameworkReady?: () => void;
  }
}

export function useFrameworkReady() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Set ready to true after a short delay to allow framework initialization
    const timer = setTimeout(() => {
      setReady(true);
      window.frameworkReady?.();
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return { ready };
}
