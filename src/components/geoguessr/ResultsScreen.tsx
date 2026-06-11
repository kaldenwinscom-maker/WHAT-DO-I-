'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { LatLng, Player, RoundGuess, RoundResult } from '@/types/geo';
import { Location } from '@/data/locations';
import { buildChallengeUrl, formatDistance } from '@/lib/gameUtils';

const WorldMap = dynamic(() => import('./WorldMap'), { ssr: false });

const PLAYER_COLORS = ['#f59e0b','#3b82f6','#ec4899','#10b981','#8b5cf6','#f97316','#06b6d4','#84cc16'];
const MEDALS = ['🥇','🥈','🥉'];

interface Props {
  players: Player[];
  myId: string;
  locations: Location[];
  roundResults: RoundResult[];
  scores: Record<string, number>;
  seed: number;
  roundCount: number;
  timerSec: number;
  soundEnabled: boolean;
  onPlayAgain: () => void;
  onHome: () => void;
}

function useCountUp(target: number, delay = 0, duration = 1500): number {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const timeout = setTimeout(() => {
      let start: number;
      const step = (ts: number) => {
        if (!start) start = ts;
        const p = Math.min((ts - start) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 4);
        setVal(Math.round(eased * target));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, delay);
    return () => clearTimeout(timeout);
  }, [target, delay, duration]);
  return val;
}

function PodiumPlayer({ player, score, rank, delay }: { player: Player; score: number; rank: number; delay: number }) {
  const animated = useCountUp(score, delay);
  return (
    <div className={`flex flex-col items-center gap-2 transition-all ${rank === 0 ? 'scale-110' : ''}`}
         style={{ animation: `geo-slide-up 0.5s ${delay}ms both` }}>
      <div className="text-2xl">{rank < 3 ? MEDALS[rank] : `#${rank + 1}`}</div>
      <div className="text-3xl">{player.avatar}</div>
      <div className={`text-sm font-bold text-white truncate max-w-[80px] text-center`}>{player.name}</div>
      <div className={`font-black text-lg ${rank === 0 ? 'text-amber-400' : rank === 1 ? 'text-slate-300' : rank === 2 ? 'text-amber-700' : 'text-white/60'}`}>
        {animated.toLocaleString()}
      </div>
    </div>
  );
}

export default function ResultsScreen({
  players, myId, locations, roundResults, scores, seed, roundCount, timerSec, soundEnabled, onPlayAgain, onHome,
}: Props) {
  const [shareMsg, setShareMsg] = useState('');
  const [showAllRounds, setShowAllRounds] = useState(false);

  const sorted = [...players].sort((a, b) => (scores[b.id] ?? 0) - (scores[a.id] ?? 0));
  const myRank = sorted.findIndex(p => p.id === myId);
  const myScore = scores[myId] ?? 0;

  useEffect(() => {
    if (soundEnabled) {
      import('@/lib/sounds').then(s => s.playFanfare());
    }
  }, [soundEnabled]);

  const handleShare = async () => {
    const url = buildChallengeUrl(seed, roundCount, timerSec);
    const text = `I scored ${myScore.toLocaleString()} / ${roundCount * 5000} on GeoGuess! Can you beat me? ${url}`;
    try {
      await navigator.clipboard.writeText(text);
      setShareMsg('Copied to clipboard!');
    } catch {
      setShareMsg('Copy the URL from your address bar');
    }
    setTimeout(() => setShareMsg(''), 3000);
  };

  // Build summary map data
  const allAnswers = locations.map(l => ({ latlng: { lat: l.lat, lng: l.lng }, name: l.name }));
  const myAllGuesses = roundResults.map((rr, i) => {
    const g = rr.guesses.find(g => g.playerId === myId);
    if (!g) return null;
    return { latlng: { lat: g.lat, lng: g.lng }, color: PLAYER_COLORS[i % PLAYER_COLORS.length], name: locations[i]?.name ?? '' };
  }).filter(Boolean) as Array<{ latlng: LatLng; color: string; name: string }>;

  return (
    <div className="min-h-screen bg-geo-dark flex flex-col overflow-y-auto pb-8">
      {/* Header */}
      <div className="px-4 pt-safe-top pt-8 pb-6 text-center">
        <div className="text-5xl mb-3">🏆</div>
        <h1 className="text-3xl font-black text-white">Final Results</h1>
        <p className="text-white/40 text-sm mt-1">
          {roundCount} rounds · {roundCount * 5000} points possible
        </p>
      </div>

      {/* Podium (top 3) */}
      <div className="flex justify-center items-end gap-6 px-4 mb-8">
        {/* Reorder to show 2nd, 1st, 3rd for visual podium effect */}
        {[sorted[1], sorted[0], sorted[2]].filter(Boolean).map((p, visualIndex) => {
          const realRank = sorted.indexOf(p);
          return (
            <PodiumPlayer
              key={p.id}
              player={p}
              score={scores[p.id] ?? 0}
              rank={realRank}
              delay={visualIndex * 150}
            />
          );
        })}
      </div>

      {/* My stats */}
      <div className="mx-4 mb-4">
        <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-2xl p-4 text-center">
          <div className="text-white/50 text-xs mb-1">
            {myRank === 0 ? '🎉 You won!' : `You placed #${myRank + 1}`}
          </div>
          <div className="text-3xl font-black text-emerald-400">{myScore.toLocaleString()}</div>
          <div className="text-white/40 text-xs">out of {(roundCount * 5000).toLocaleString()} possible</div>
        </div>
      </div>

      {/* Full leaderboard */}
      {sorted.length > 3 && (
        <div className="mx-4 mb-4">
          <div className="text-white/40 text-xs uppercase tracking-widest mb-2 px-1">Full Standings</div>
          <div className="space-y-2">
            {sorted.slice(3).map((p, i) => (
              <div key={p.id} className={`flex items-center gap-3 px-4 py-3 rounded-2xl border ${
                p.id === myId ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/10'
              }`}>
                <div className="w-6 text-white/30 text-sm font-bold">#{i + 4}</div>
                <div className="text-xl">{p.avatar}</div>
                <div className="flex-1 text-sm font-semibold text-white truncate">
                  {p.name} {p.id === myId && <span className="text-emerald-400 text-xs">YOU</span>}
                </div>
                <div className="font-bold text-white">{(scores[p.id] ?? 0).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Round-by-round breakdown */}
      <div className="mx-4 mb-4">
        <button
          onClick={() => setShowAllRounds(v => !v)}
          className="w-full flex items-center justify-between text-white/40 text-xs uppercase tracking-widest px-1 mb-2 hover:text-white/60 transition-colors"
        >
          <span>Round breakdown</span>
          <span>{showAllRounds ? '▲' : '▼'}</span>
        </button>

        {showAllRounds && (
          <div className="space-y-2">
            {roundResults.map((rr, i) => {
              const loc = locations[i];
              const myG = rr.guesses.find(g => g.playerId === myId);
              return (
                <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/5 border border-white/10">
                  <div className="text-white/30 font-bold text-xs w-5">#{i + 1}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-sm font-semibold truncate">{loc?.name}</div>
                    <div className="text-white/40 text-xs">{loc?.country}</div>
                  </div>
                  {myG ? (
                    <div className="text-right">
                      <div className="text-emerald-400 font-bold text-sm">+{myG.score.toLocaleString()}</div>
                      <div className="text-white/30 text-xs">{formatDistance(myG.distanceKm)}</div>
                    </div>
                  ) : (
                    <div className="text-white/30 text-xs">No guess</div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Summary map */}
      {myAllGuesses.length > 0 && (
        <div className="mx-4 mb-6">
          <div className="text-white/40 text-xs uppercase tracking-widest mb-2 px-1">Your guesses on the map</div>
          <WorldMap
            onGuess={() => {}}
            guess={null}
            disabled
            revealed
            allGuesses={myAllGuesses}
            allAnswers={allAnswers}
          />
        </div>
      )}

      {/* Actions */}
      <div className="px-4 space-y-3">
        <button
          onClick={handleShare}
          className="w-full py-3.5 rounded-2xl font-bold text-sm bg-white/10 border border-white/20 text-white hover:bg-white/15 active:scale-95 transition-all"
        >
          🔗 Share Challenge Link
        </button>
        {shareMsg && (
          <p className="text-center text-emerald-400 text-xs animate-fade-in">{shareMsg}</p>
        )}
        <button
          onClick={onPlayAgain}
          className="w-full py-4 rounded-2xl font-bold text-sm bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-white shadow-lg shadow-emerald-500/25 transition-all"
        >
          🎮 Play Again
        </button>
        <button
          onClick={onHome}
          className="w-full py-3 rounded-2xl font-semibold text-sm text-white/40 hover:text-white/60 transition-colors"
        >
          ← Back to Home
        </button>
      </div>
    </div>
  );
}
