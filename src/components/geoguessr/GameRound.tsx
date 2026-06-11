'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { LatLng, GameConfig } from '@/types/geo';
import { Location } from '@/data/locations';

const WorldMap = dynamic(() => import('./WorldMap'), { ssr: false, loading: () => (
  <div className="w-full h-[220px] sm:h-[260px] rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
    <span className="text-white/30 text-sm">Loading map…</span>
  </div>
) });

interface Props {
  location: Location;
  roundIndex: number;
  totalRounds: number;
  config: GameConfig;
  playersWaiting?: number; // how many opponents haven't guessed yet
  onSubmitGuess: (guess: LatLng | null) => void;
  soundEnabled: boolean;
}

export default function GameRound({
  location, roundIndex, totalRounds, config, playersWaiting = 0, onSubmitGuess, soundEnabled,
}: Props) {
  const [guess, setGuess] = useState<LatLng | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [timeLeft, setTimeLeft] = useState(config.timerSeconds);
  const [submitted, setSubmitted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reset state when round changes
  useEffect(() => {
    setGuess(null);
    setExpanded(false);
    setImgError(false);
    setTimeLeft(config.timerSeconds);
    setSubmitted(false);
  }, [roundIndex, config.timerSeconds]);

  // Timer
  useEffect(() => {
    if (config.timerSeconds === 0 || submitted) return;

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          if (!submitted) {
            if (soundEnabled) {
              import('@/lib/sounds').then(s => s.playTimesUp());
            }
            setSubmitted(true);
            onSubmitGuess(null);
          }
          return 0;
        }
        if (prev <= 6 && soundEnabled) {
          import('@/lib/sounds').then(s => s.playTick());
        }
        return prev - 1;
      });
    }, 1000);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [roundIndex, config.timerSeconds, submitted, soundEnabled, onSubmitGuess]);

  const handleGuess = useCallback((latlng: LatLng) => {
    if (submitted) return;
    setGuess(latlng);
    if (soundEnabled) {
      import('@/lib/sounds').then(s => s.playPinDrop());
    }
  }, [submitted, soundEnabled]);

  const handleLockIn = () => {
    if (submitted) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setSubmitted(true);
    onSubmitGuess(guess);
  };

  const pct = config.timerSeconds > 0 ? (timeLeft / config.timerSeconds) * 100 : 100;
  const urgentTimer = config.timerSeconds > 0 && timeLeft <= 10 && !submitted;

  return (
    <div className="min-h-screen bg-geo-dark flex flex-col relative overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 pt-safe-top pt-4 pb-2 z-10">
        <div className="flex items-center gap-3">
          <div className="bg-white/10 rounded-xl px-3 py-1.5 text-white text-xs font-semibold">
            Round {roundIndex + 1} / {totalRounds}
          </div>
          {location.difficulty && (
            <div className={`rounded-xl px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${
              location.difficulty === 'easy' ? 'bg-emerald-500/20 text-emerald-400' :
              location.difficulty === 'medium' ? 'bg-amber-500/20 text-amber-400' :
              'bg-red-500/20 text-red-400'
            }`}>
              {location.difficulty}
            </div>
          )}
        </div>

        {/* Timer */}
        {config.timerSeconds > 0 && (
          <div className={`flex items-center gap-2 ${urgentTimer ? 'animate-pulse' : ''}`}>
            <div className={`font-mono font-black text-xl ${
              urgentTimer ? 'text-red-400' : timeLeft <= 30 ? 'text-amber-400' : 'text-white/70'
            }`}>
              {timeLeft}s
            </div>
          </div>
        )}
      </div>

      {/* Timer progress bar */}
      {config.timerSeconds > 0 && (
        <div className="h-0.5 bg-white/10 mx-4 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${
              urgentTimer ? 'bg-red-500' : timeLeft <= 30 ? 'bg-amber-500' : 'bg-emerald-500'
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}

      {/* Image */}
      <div className="relative flex-1 min-h-0">
        {!imgError ? (
          <img
            src={location.imageUrl}
            alt="Where in the world?"
            className="w-full h-full object-cover"
            style={{ maxHeight: 'calc(100vh - 280px)', minHeight: '200px' }}
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full flex items-center justify-center bg-gradient-to-br from-emerald-900/30 to-blue-900/30"
               style={{ height: 'calc(100vh - 280px)', minHeight: '200px' }}>
            <div className="text-center text-white/40">
              <div className="text-5xl mb-3">🌍</div>
              <p className="text-sm">Image unavailable</p>
              <p className="text-xs mt-1 opacity-60">Make your best guess!</p>
            </div>
          </div>
        )}

        {/* Submitted overlay */}
        {submitted && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm">
            <div className="text-center">
              <div className="text-4xl mb-2">{guess ? '📍' : '⏱️'}</div>
              <p className="text-white font-bold text-lg">
                {guess ? 'Guess locked in!' : "Time's up!"}
              </p>
              {playersWaiting > 0 && (
                <p className="text-white/50 text-sm mt-1 animate-pulse">
                  Waiting for {playersWaiting} other player{playersWaiting > 1 ? 's' : ''}…
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom panel: Map + Lock In */}
      <div className={`px-4 pb-4 pt-3 bg-geo-dark border-t border-white/8 transition-all ${expanded ? 'absolute inset-0 z-30 pt-4 flex flex-col' : ''}`}>
        {expanded && (
          <div className="flex items-center justify-between mb-3">
            <span className="text-white/60 text-sm font-semibold">Place your pin</span>
            <button onClick={() => setExpanded(false)} className="text-white/40 text-sm">
              ✕ Close
            </button>
          </div>
        )}

        <WorldMap
          onGuess={handleGuess}
          guess={guess}
          disabled={submitted}
          expanded={expanded}
          onToggleExpand={() => setExpanded(v => !v)}
        />

        <div className="flex gap-3 mt-3">
          {guess && !submitted && (
            <button
              onClick={() => setGuess(null)}
              className="px-4 py-3 rounded-xl bg-white/8 border border-white/15 text-white/60 text-sm font-semibold hover:bg-white/12 transition-colors"
            >
              Remove pin
            </button>
          )}
          <button
            onClick={handleLockIn}
            disabled={submitted}
            className={`flex-1 py-3 rounded-2xl font-bold text-sm transition-all active:scale-95 ${
              guess
                ? 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/30'
                : 'bg-white/8 border border-white/15 text-white/40 cursor-default'
            } disabled:opacity-60 disabled:cursor-not-allowed`}
          >
            {submitted
              ? (guess ? '✓ Locked in!' : "Time's up!")
              : guess
              ? '🔒 Lock In Guess'
              : 'Click map to guess'}
          </button>
        </div>
      </div>
    </div>
  );
}
