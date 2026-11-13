'use client';
import React from 'react';

/**
 * Uber-style bottom sheet chrome — pinned to the bottom of the phone frame.
 * `overlay` renders floating above the sheet (GO button, ETA chip).
 */
export default function BottomSheet({
  children,
  overlay,
}: {
  children: React.ReactNode;
  overlay?: React.ReactNode;
}) {
  return (
    <div
      className="absolute inset-x-0 bottom-0 z-[700] lg:bottom-6 lg:left-1/2 lg:right-auto lg:w-[min(92vw,480px)] lg:-translate-x-1/2"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {overlay && (
        <div className="pointer-events-none absolute bottom-full left-1/2 z-[710] -translate-x-1/2">
          {overlay}
        </div>
      )}
      <div className="rounded-t-3xl bg-white text-ink shadow-[0_-10px_30px_rgba(27,21,38,0.22)] lg:rounded-3xl lg:shadow-[0_20px_60px_rgba(27,21,38,0.35)]">
        <div className="mx-auto mt-2.5 h-1.5 w-10 rounded-full bg-ink/15" aria-hidden="true" />
        {children}
      </div>
    </div>
  );
}
