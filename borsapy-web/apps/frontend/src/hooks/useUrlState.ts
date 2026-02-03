"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback, useMemo } from "react";

type UrlStateValue = string | string[] | null;

interface UseUrlStateOptions {
  defaultValue?: UrlStateValue;
}

export function useUrlState<T extends UrlStateValue = string | null>(
  key: string,
  options: UseUrlStateOptions = {}
): [T, (value: T) => void] {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const value = useMemo(() => {
    const paramValue = searchParams?.get(key);
    if (paramValue === null || paramValue === undefined) {
      return (options.defaultValue ?? null) as T;
    }
    return paramValue as T;
  }, [searchParams, key, options.defaultValue]);

  const setValue = useCallback(
    (newValue: T) => {
      const params = new URLSearchParams(searchParams?.toString() || "");

      if (newValue === null || newValue === "" || (Array.isArray(newValue) && newValue.length === 0)) {
        params.delete(key);
      } else if (Array.isArray(newValue)) {
        params.set(key, newValue.join(","));
      } else {
        params.set(key, newValue as string);
      }

      const queryString = params.toString();
      const path = pathname || "/";
      router.push(queryString ? `${path}?${queryString}` : path, { scroll: false });
    },
    [searchParams, router, pathname, key]
  );

  return [value, setValue];
}

export function useUrlArrayState(
  key: string,
  defaultValue: string[] = []
): [string[], (value: string[]) => void] {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const value = useMemo(() => {
    const paramValue = searchParams?.get(key);
    if (!paramValue) {
      return defaultValue;
    }
    return paramValue.split(",").filter(Boolean);
  }, [searchParams, key, defaultValue]);

  const setValue = useCallback(
    (newValue: string[]) => {
      const params = new URLSearchParams(searchParams?.toString() || "");

      if (newValue.length === 0) {
        params.delete(key);
      } else {
        params.set(key, newValue.join(","));
      }

      const queryString = params.toString();
      const path = pathname || "/";
      router.push(queryString ? `${path}?${queryString}` : path, { scroll: false });
    },
    [searchParams, router, pathname, key]
  );

  return [value, setValue];
}
