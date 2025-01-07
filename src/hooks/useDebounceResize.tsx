import { useEffect, useRef } from 'react';
import { debounce } from 'lodash';

export function useDebounceResize(callback: () => void, delay = 100) {
  const observer = useRef<ResizeObserver | null>(null);

  useEffect(() => {
    const debouncedCallback = debounce(callback, delay);
    
    observer.current = new ResizeObserver(() => {
      debouncedCallback();
    });

    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
      debouncedCallback.cancel();
    };
  }, [callback, delay]);

  const observe = (element: Element | null) => {
    if (element && observer.current) {
      observer.current.observe(element);
    }
  };

  const unobserve = (element: Element | null) => {
    if (element && observer.current) {
      observer.current.unobserve(element);
    }
  };

  return { observe, unobserve };
}