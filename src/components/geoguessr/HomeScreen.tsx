'use client';

import { useState } from 'react';
import { GameConfig, MultiMode } from '@/types/geo';

const AVATARS = ['🦁','🐯','🦊','🐺','🐻','🐼','🐨','🦅','🦋','🐙','🦈','🐲','🦄','🐬','🦩','🌍','🗺️','🧭','🌊','⛰️'];

interface Props {
  onCreateGame: (name: string, avatar: string, config: GameConfig) => void;
  onJoinGame: (code: string, name: string, avatar: string) => void;
  onPlayChallenge: (name: string, avatar: string) => void;
  challengeDetected: boolean;
}

type Tab = 'host' | 'join' | 'solo';

export default function HomeScreen({ onCreateGame, onJoinGame, onPlayChallenge, challengeDetected }: Props) {
  const [tab, setTab] = useState<Tab>(challengeDetected ? 'join' : 'host');
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [joinCode, setJoinCode] = useState('');
  const [rounds, setRounds] = useState(5);
  const [timer, setTimer] = useState(90);
  const [sound, setSound] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [avatarPicker, setAvatarPicker] = useState(false);

  const config: GameConfig = { roundCount: rounds, timerSeconds: timer, soundEnabled: sound };

  const handleHost = () => {
    if (!name.trim()) return;
    onCreateGame(name.trim(), avatar, config);
  };

  const handleJoin = () => {
    if (!name.trim() || !joinCode.trim()) return;
    onJoinGame(joinCode.trim().toUpperCase(), name.trim(), avatar);
  };

  const handleSolo = () => {
    if (!name.trim()) return;
    onPlayChallenge(name.trim(), avatar);
  };

  return (
    <div className="min-h-screen bg-geo-dark flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Logo */}
      <div className="text-center mb-8 z-10">
        <div className="text-6xl mb-3">🌍</div>
        <h1 className="text-4xl font-black text-white tracking-tight">
          Geo<span className="text-emerald-400">Guess</span>
        </h1>
        <p className="text-white/50 text-sm mt-1">Explore the world, one guess at a time</p>
      </div>

      {/* Tab pills */}
      <div className="flex gap-2 mb-6 z-10 bg-white/5 rounded-2xl p-1">
        {(['host', 'join', 'solo'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
              tab === t
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                : 'text-white/50 hover:text-white/80'
            }`}
          >
            {t === 'host' ? '🏠 Host' : t === 'join' ? '🚪 Join' : '🧍 Solo'}
          </button>
        ))}
      </div>

      {/* Card */}
      <div className="w-full max-w-sm z-10 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-6 shadow-2xl">
        {/* Name + Avatar row */}
        <div className="flex items-center gap-3 mb-5">
          <button
            onClick={() => setAvatarPicker(v => !v)}
            className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 text-2xl flex-shrink-0 hover:bg-white/20 transition-colors"
          >
            {avatar}
          </button>
          <input
            className="flex-1 bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm outline-none focus:border-emerald-500/60 transition-colors"
            placeholder="Your name…"
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={20}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                if (tab === 'host') handleHost();
                else if (tab === 'join') handleJoin();
                else handleSolo();
              }
            }}
          />
        </div>

        {/* Avatar picker */}
        {avatarPicker && (
          <div className="flex flex-wrap gap-2 mb-4 p-3 bg-white/5 rounded-2xl border border-white/10">
            {AVATARS.map(a => (
              <button
                key={a}
                onClick={() => { setAvatar(a); setAvatarPicker(false); }}
                className={`w-9 h-9 rounded-xl text-xl flex items-center justify-center transition-all ${
                  avatar === a ? 'bg-emerald-500/30 ring-2 ring-emerald-400' : 'hover:bg-white/10'
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        )}

        {/* Tab-specific inputs */}
        {tab === 'join' && (
          <input
            className="w-full bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm outline-none focus:border-emerald-500/60 transition-colors mb-4 uppercase tracking-widest font-mono text-center text-lg"
            placeholder="ROOM CODE"
            value={joinCode}
            onChange={e => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
            maxLength={6}
            onKeyDown={e => { if (e.key === 'Enter') handleJoin(); }}
          />
        )}

        {/* Settings (host + solo) */}
        {(tab === 'host' || tab === 'solo') && (
          <button
            onClick={() => setShowSettings(v => !v)}
            className="w-full flex items-center justify-between text-white/50 text-xs hover:text-white/70 transition-colors mb-3 px-1"
          >
            <span>⚙️ Game settings</span>
            <span>{showSettings ? '▲' : '▼'}</span>
          </button>
        )}

        {showSettings && (tab === 'host' || tab === 'solo') && (
          <div className="mb-4 space-y-3 p-4 bg-white/5 rounded-2xl border border-white/10">
            <label className="flex items-center justify-between text-white/70 text-sm">
              <span>Rounds</span>
              <div className="flex gap-2">
                {[3, 5, 10].map(r => (
                  <button
                    key={r}
                    onClick={() => setRounds(r)}
                    className={`w-9 h-7 rounded-lg text-xs font-semibold transition-all ${
                      rounds === r ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </label>
            <label className="flex items-center justify-between text-white/70 text-sm">
              <span>Timer</span>
              <div className="flex gap-2">
                {[0, 60, 90, 180].map(s => (
                  <button
                    key={s}
                    onClick={() => setTimer(s)}
                    className={`px-2 h-7 rounded-lg text-xs font-semibold transition-all ${
                      timer === s ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'
                    }`}
                  >
                    {s === 0 ? '∞' : `${s}s`}
                  </button>
                ))}
              </div>
            </label>
            <label className="flex items-center justify-between text-white/70 text-sm">
              <span>Sound effects</span>
              <button
                onClick={() => setSound(v => !v)}
                className={`w-12 h-6 rounded-full transition-all relative ${sound ? 'bg-emerald-500' : 'bg-white/15'}`}
              >
                <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${sound ? 'left-6' : 'left-0.5'}`} />
              </button>
            </label>
          </div>
        )}

        {/* Action button */}
        <button
          onClick={tab === 'host' ? handleHost : tab === 'join' ? handleJoin : handleSolo}
          disabled={!name.trim() || (tab === 'join' && joinCode.length < 6)}
          className="w-full py-3.5 rounded-2xl font-bold text-sm bg-emerald-500 hover:bg-emerald-400 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-lg shadow-emerald-500/30 transition-all"
        >
          {tab === 'host' ? '🏠 Create Room' : tab === 'join' ? '🚀 Join Room' : '🎮 Play Solo Challenge'}
        </button>

        {challengeDetected && tab !== 'join' && (
          <p className="text-center text-xs text-amber-400/70 mt-3">
            Challenge link detected — switch to Solo to play it!
          </p>
        )}
      </div>

      {/* Footer */}
      <p className="text-white/20 text-xs mt-6 z-10 text-center">
        40+ real-world locations · Works offline · No API key needed
      </p>
    </div>
  );
}
