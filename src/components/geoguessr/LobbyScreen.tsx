'use client';

import { useEffect, useState } from 'react';
import { Player } from '@/types/geo';

interface Props {
  roomCode: string;
  players: Player[];
  myId: string;
  isHost: boolean;
  onReady: () => void;
  onStart: () => void;
  onLeave: () => void;
  challengeUrl: string;
  isOnline: boolean;
}

export default function LobbyScreen({
  roomCode, players, myId, isHost, onReady, onStart, onLeave, challengeUrl, isOnline,
}: Props) {
  const [copied, setCopied] = useState(false);

  const me = players.find(p => p.id === myId);
  const allReady = players.length > 0 && players.every(p => p.isReady);
  const canStart = isHost && players.length >= 1 && allReady;

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div className="min-h-screen bg-geo-dark flex flex-col items-center px-4 py-8 relative overflow-hidden">
      {/* Background */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/8 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="w-full max-w-sm flex items-center justify-between mb-8">
        <button
          onClick={onLeave}
          className="text-white/40 hover:text-white/70 transition-colors text-sm"
        >
          ← Leave
        </button>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-amber-400'} animate-pulse`} />
          <span className="text-white/40 text-xs">{isOnline ? 'Online room' : 'Local'}</span>
        </div>
      </div>

      {/* Room code */}
      <div className="w-full max-w-sm mb-6">
        <div className="text-center mb-4">
          <div className="text-white/40 text-xs uppercase tracking-widest mb-1">Room Code</div>
          <div className="text-5xl font-black text-white tracking-[0.15em] font-mono">{roomCode}</div>
        </div>

        {/* Share buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => handleCopy(roomCode)}
            className="flex-1 py-2.5 rounded-xl bg-white/8 border border-white/15 text-white/70 text-sm font-semibold hover:bg-white/12 transition-colors"
          >
            {copied ? '✓ Copied!' : '📋 Copy Code'}
          </button>
          <button
            onClick={() => handleCopy(challengeUrl)}
            className="flex-1 py-2.5 rounded-xl bg-white/8 border border-white/15 text-white/70 text-sm font-semibold hover:bg-white/12 transition-colors"
          >
            🔗 Share Link
          </button>
        </div>
      </div>

      {/* Players */}
      <div className="w-full max-w-sm flex-1">
        <div className="text-white/40 text-xs uppercase tracking-widest mb-3 px-1">
          Players ({players.length})
        </div>

        <div className="space-y-2">
          {players.map(p => (
            <div
              key={p.id}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all ${
                p.id === myId
                  ? 'bg-emerald-500/10 border-emerald-500/30'
                  : 'bg-white/5 border-white/10'
              }`}
            >
              <div className="text-2xl w-10 h-10 flex items-center justify-center rounded-xl bg-white/5">
                {p.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-white font-semibold text-sm truncate">{p.name}</span>
                  {p.id === myId && (
                    <span className="text-[10px] text-emerald-400 font-bold">YOU</span>
                  )}
                  {p.isHost && (
                    <span className="text-[10px] text-amber-400 font-bold">HOST</span>
                  )}
                </div>
              </div>
              <div>
                {p.isReady ? (
                  <span className="text-emerald-400 text-xs font-bold bg-emerald-500/15 px-2 py-1 rounded-lg">
                    Ready ✓
                  </span>
                ) : (
                  <span className="text-white/30 text-xs">waiting…</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {players.length === 0 && (
          <div className="text-center text-white/30 text-sm py-8">
            Waiting for players to join…
          </div>
        )}
      </div>

      {/* Bottom actions */}
      <div className="w-full max-w-sm mt-6 space-y-2">
        {!me?.isReady && !isHost && (
          <button
            onClick={onReady}
            className="w-full py-4 rounded-2xl font-bold text-sm bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-white shadow-lg shadow-emerald-500/25 transition-all"
          >
            ✓ Ready Up
          </button>
        )}

        {isHost && (
          <button
            onClick={onStart}
            disabled={!canStart}
            className="w-full py-4 rounded-2xl font-bold text-sm bg-emerald-500 hover:bg-emerald-400 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-lg shadow-emerald-500/25 transition-all"
          >
            {canStart ? '🚀 Start Game!' : allReady ? '🚀 Start Game!' : `Waiting for all players to ready up…`}
          </button>
        )}

        {!isHost && me?.isReady && (
          <div className="text-center text-white/40 text-sm py-2 animate-pulse">
            Waiting for host to start…
          </div>
        )}
      </div>
    </div>
  );
}
