import { useEffect, useRef } from 'react';
import { supabase } from './supabase';

/**
 * Admin-only: subscribes to new orders via Supabase realtime and plays an
 * alarm sound. Returns nothing. Only call this from the admin panel so
 * customers never hear the sound.
 *
 * Browsers block audio until the user has interacted with the page. We
 * unlock the AudioContext on the first click/touch/keypress inside the
 * admin panel, then keep it ready for incoming order events.
 */
export function useOrderAlarm(enabled: boolean) {
  const ctxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const unlock = () => {
      try {
        if (!ctxRef.current) {
          const AudioCtx =
            window.AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
          if (AudioCtx) ctxRef.current = new AudioCtx();
        }
        if (ctxRef.current?.state === 'suspended') {
          ctxRef.current.resume();
        }
      } catch {
        // ignore
      }
    };

    // Unlock on first user interaction (covers click, touch, keyboard)
    window.addEventListener('pointerdown', unlock, { once: false });
    window.addEventListener('keydown', unlock, { once: false });
    unlock();

    const channel = supabase
      .channel('admin-order-alarm')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        () => playAlarm(ctxRef.current),
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        (payload) => {
          // Only play on status changes (not every column update)
          const oldRow = payload.old_record as Record<string, unknown> | undefined;
          const newRow = payload.new as Record<string, unknown> | undefined;
          if (oldRow?.status !== newRow?.status) {
            playAlarm(ctxRef.current);
          }
        },
      )
      .subscribe();

    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
      supabase.removeChannel(channel);
    };
  }, [enabled]);
}

/**
 * Generates and plays a short two-tone notification sound using the Web Audio
 * API. No audio file needed; the browser synthesizes the tones on the fly.
 */
function playAlarm(ctx: AudioContext | null) {
  try {
    if (!ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      ctx = new AudioCtx();
    }
    if (ctx.state === 'suspended') ctx.resume();

    const playTone = (freq: number, start: number, duration: number) => {
      const osc = ctx!.createOscillator();
      const gain = ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      osc.connect(gain);
      gain.connect(ctx!.destination);
      gain.gain.setValueAtTime(0, ctx!.currentTime + start);
      gain.gain.linearRampToValueAtTime(0.35, ctx!.currentTime + start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx!.currentTime + start + duration);
      osc.start(ctx!.currentTime + start);
      osc.stop(ctx!.currentTime + start + duration);
    };

    playTone(880, 0, 0.25);
    playTone(1175, 0.3, 0.35);
    playTone(880, 0.65, 0.3);
  } catch {
    // ignore audio errors silently
  }
}
