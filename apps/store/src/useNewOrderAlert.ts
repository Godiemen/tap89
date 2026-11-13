'use client';
import { useEffect, useRef, useState } from 'react';

const MUTE_KEY = 'sd-merchant-alert-muted';

/** Repeating WebAudio beep while `active` (orders waiting) until muted or handled. */
export function useNewOrderAlert(active: boolean) {
  const [muted, setMuted] = useState<boolean>(() =>
    typeof window === 'undefined' ? false : localStorage.getItem(MUTE_KEY) === '1',
  );
  const ctxRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const armedRef = useRef(false); // becomes true after first user gesture

  // browsers gate audio behind a user gesture — arm on first interaction
  useEffect(() => {
    const arm = () => {
      armedRef.current = true;
      ctxRef.current ??= new AudioContext();
      if (ctxRef.current.state === 'suspended') void ctxRef.current.resume();
    };
    window.addEventListener('pointerdown', arm, { once: true });
    window.addEventListener('keydown', arm, { once: true });
    return () => {
      window.removeEventListener('pointerdown', arm);
      window.removeEventListener('keydown', arm);
    };
  }, []);

  useEffect(() => {
    const stop = () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    };

    if (active && !muted) {
      const beep = () => {
        const ctx = ctxRef.current;
        if (!armedRef.current || !ctx || ctx.state === 'suspended') return;
        const t0 = ctx.currentTime;
        for (const [offset, freq] of [
          [0, 880],
          [0.18, 1174.66],
        ] as const) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(0.0001, t0 + offset);
          gain.gain.exponentialRampToValueAtTime(0.18, t0 + offset + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, t0 + offset + 0.16);
          osc.connect(gain).connect(ctx.destination);
          osc.start(t0 + offset);
          osc.stop(t0 + offset + 0.18);
        }
      };
      beep();
      timerRef.current = setInterval(beep, 4000);
      return stop;
    }
    stop();
  }, [active, muted]);

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
    void ctxRef.current?.close();
  }, []);

  const toggleMuted = () =>
    setMuted((m) => {
      const next = !m;
      localStorage.setItem(MUTE_KEY, next ? '1' : '0');
      return next;
    });

  return { muted, toggleMuted };
}
