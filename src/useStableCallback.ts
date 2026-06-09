import { useCallback, useEffect, useRef } from "react";

export function useStableCallback<T extends (...args: any[]) => any>(
  callback?: T,
) {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useCallback(
    (...args: Parameters<T>) => callbackRef.current?.(...args),
    [],
  );
}
