'use client';
import { useRouter, useParams } from 'next/navigation';

let _router: ReturnType<typeof useRouter> | null = null;

export const router = {
  push: (p: string) => (_router ? _router.push(p) : window.location.assign(p)),
  replace: (p: string) => (_router ? _router.replace(p) : window.location.assign(p)),
  back: () => (_router ? _router.back() : window.history.back()),
};

export function useLocalSearchParams<T = Record<string, string>>(): T {
  return useParams() as T;
}

export function NavCapture() {
  _router = useRouter();
  return null;
}
