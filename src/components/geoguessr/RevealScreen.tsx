'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { LatLng, Player, RoundGuess } from '@/types/geo';
import { Location } from '@/data/locations';
import { formatDistance } from '@/lib/gameUtils';

const WorldMap = dynamic(() => import('./WorldMap'), { ssr: false, loading: () => (
  <div className="w-full h-[300px] rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
    <span className="text-white/30 text-sm">Loading map…</span>
  </div>
) });

const PLAYER_COLORS = ['#f59e0b','#3b82f6','#ec4899','#10b981','#8b5cf6','#f97316','#06b6d4','#84cc16'];

interface Props {
  location: Location;
  roundIndex: number;
  totalRounds: number;
  myId: string;
  players: Player[];
  guesses: RoundGuess[];
  scores: Record<string, number>;
  isLastRound: boolean;
  onNext: () => void;
}

function useCountUp(target: number, duration = 1200): number {
  const [val, setVal] = useState(0);
  useEffect(() => {
    setVal(0);
    let start: number;
    const step = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setVal(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    const raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return val;
}

function ScoreCard({ score, myScore, label }: { score: number; myScore: number; label: string }) {
  const animated = useCountUp(myScore);
  return (
    <div className="bg-white/5 rounded-2xl border border-white/10 p-4 text-center">
      <div className={`text-3xl font-black ${myScore === 0 ? 'text-white/30' : 'text-emerald-400'}`}>
        +{animated.toLocaleString()}
      </div>
      <div className="text-white/40 text-xs mt-1">{label}</div>
    </div>
  );
}

export default function RevealScreen({
  location, roundIndex, totalRounds, myId, players, guesses, scores, isLastRound, onNext,
}: Props) {
  const myGuess = guesses.find(g => g.playerId === myId);
  const sortedPlayers = [...players].sort((a, b) => (scores[b.id] ?? 0) - (scores[a.id] ?? 0));
  const myRoundScore = myGuess?.score ?? 0;
  const myTotalScore = scores[myId] ?? 0;

  // Build map data
  const answer: LatLng = { lat: location.lat, lng: location.lng };
  const myGuessLatLng: LatLng | null = myGuess ? { lat: myGuess.lat, lng: myGuess.lng } : null;

  const allGuessesMapData = guesses.map((g, i) => {
    const player = players.find(p => p.id === g.playerId);
    return {
      latlng: { lat: g.lat, lng: g.lng },
      color: PLAYER_COLORS[i % PLAYER_COLORS.length],
      name: player?.name ?? 'Unknown',
    };
  });

  return (
    <div className="min-h-screen bg-geo-dark flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="px-4 pt-safe-top pt-6 pb-4 text-center">
        <div className="text-white/40 text-xs uppercase tracking-widest mb-1">
          Round {roundIndex + 1} / {totalRounds} — Revealed
        </div>
        <h2 className="text-2xl font-black text-white">{location.name}</h2>
        <p className="text-white/50 text-sm">{location.city}, {location.country}</p>
      </div>

      {/* My result */}
      {myGuess ? (
        <div className="mx-4 mb-4 grid grid-cols-2 gap-3">
          <div className="bg-white/5 rounded-2xl border border-white/10 p-4 text-center">
            <div className="text-white/40 text-xs mb-1">Distance</div>
            <div className="text-xl font-black text-white">{formatDistance(myGuess.distanceKm)}</div>
          </div>
          <ScoreCard score={myTotalScore} myScore={myRoundScore} label="Points this round" />
        </div>
      ) : (
        <div className="mx-4 mb-4 bg-white/5 rounded-2xl border border-white/10 p-4 text-center">
          <div className="text-white/30 text-sm">No pin placed — 0 points</div>
        </div>
      )}

      {/* Map */}
      <div className="mx-4 mb-4">
        <WorldMap
          onGuess={() => {}}
          guess={myGuessLatLng}
          answer={answer}
          revealed
          disabled
          allGuesses={allGuessesMapData}
          allAnswers={[{ latlng: answer, name: location.name }]}
        />
      </div>

      {/* Scoreboard */}
      <div className="mx-4 mb-6">
        <div className="text-white/40 text-xs uppercase tracking-widest mb-3">Standings</div>
        <div className="space-y-2">
          {sortedPlayers.map((p, rank) => {
            const pg = guesses.find(g => g.playerId === p.id);
            const color = PLAYER_COLORS[guesses.findIndex(g => g.playerId === p.id) % PLAYER_COLORS.length];
            return (
              <div
                key={p.id}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl border ${
                  p.id === myId ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/10'
                }`}
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs ${
                  rank === 0 ? 'bg-amber-400 text-black' :
                  rank === 1 ? 'bg-slate-400 text-black' :
                  rank === 2 ? 'bg-amber-700 text-white' :
                  'bg-white/10 text-white/50'
                }`}>
                  {rank + 1}
                </div>
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ background: color }}
                />
                <div className="text-xl">{p.avatar}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-white font-semibold text-sm truncate">
                    {p.name} {p.id === myId && <span className="text-emerald-400 text-xs">YOU</span>}
                  </div>
                  {pg && (
                    <div className="text-white/40 text-xs">{formatDistance(pg.distanceKm)} away</div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-white font-bold text-sm">{(scores[p.id] ?? 0).toLocaleString()}</div>
                  {pg && (
                    <div className={`text-xs font-semibold ${pg.score > 0 ? 'text-emerald-400' : 'text-white/30'}`}>
                      +{pg.score.toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Next button */}
      <div className="px-4 pb-8 mt-auto">
        <button
          onClick={onNext}
          className="w-full py-4 rounded-2xl font-bold text-sm bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-white shadow-lg shadow-emerald-500/25 transition-all"
        >
          {isLastRound ? '🏆 See Final Results' : '➡️ Next Round'}
        </button>
      </div>
    </div>
  );
}
