'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { GameConfig, GameState, GameView, LatLng, MultiMode, Player, RoundGuess, RoundResult } from '@/types/geo';
import { buildChallengeUrl, calcScore, generateRoomCode, generateSeed, haversineKm, parseChallengeUrl, selectLocations } from '@/lib/gameUtils';
import { supabase, supabaseReady } from '@/lib/supabase';

import HomeScreen from './geoguessr/HomeScreen';
import LobbyScreen from './geoguessr/LobbyScreen';
import GameRound from './geoguessr/GameRound';
import RevealScreen from './geoguessr/RevealScreen';
import ResultsScreen from './geoguessr/ResultsScreen';

// ─── ID generation ────────────────────────────────────────────────────────────

function makeId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

// ─── Default config ───────────────────────────────────────────────────────────

const DEFAULT_CONFIG: GameConfig = { roundCount: 5, timerSeconds: 90, soundEnabled: true };

// ─── Supabase channel name helper ─────────────────────────────────────────────

const channel = (code: string) => `geo-room-${code}`;

// ─── Main component ───────────────────────────────────────────────────────────

export default function GeoGuesserApp() {
  // ── Core state ──────────────────────────────────────────────────────────────
  const [view, setView] = useState<GameView>('home');
  const [mode, setMode] = useState<MultiMode>('solo');
  const [myId] = useState(() => makeId());
  const [myName, setMyName] = useState('');
  const [myAvatar, setMyAvatar] = useState('🌍');
  const [roomCode, setRoomCode] = useState('');
  const [seed, setSeed] = useState(0);
  const [config, setConfig] = useState<GameConfig>(DEFAULT_CONFIG);
  const [players, setPlayers] = useState<Player[]>([]);
  const [locations, setLocations] = useState(selectLocations(0, 5));
  const [currentRound, setCurrentRound] = useState(0);
  const [pendingGuess, setPendingGuess] = useState<LatLng | null>(null);
  const [roundResults, setRoundResults] = useState<RoundResult[]>([]);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Supabase channel ref ─────────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rtChannel = useRef<any>(null);

  // ── Detect challenge link ────────────────────────────────────────────────────
  const challengeParams = useRef(parseChallengeUrl());

  // ── Cleanup Supabase channel ─────────────────────────────────────────────────
  const leaveChannel = useCallback(() => {
    if (rtChannel.current) {
      try { supabase.removeChannel(rtChannel.current); } catch { /* ignore */ }
      rtChannel.current = null;
    }
  }, []);

  // ── Build player list for single-player ─────────────────────────────────────
  const mySoloPlayer = useCallback((name: string, avatar: string): Player => ({
    id: myId, name, avatar, isHost: true, isReady: true, totalScore: 0,
  }), [myId]);

  // ── Reset game state ─────────────────────────────────────────────────────────
  const resetGame = useCallback((newSeed: number, cfg: GameConfig, playerList: Player[]) => {
    const locs = selectLocations(newSeed, cfg.roundCount);
    setLocations(locs);
    setCurrentRound(0);
    setPendingGuess(null);
    setRoundResults([]);
    const s: Record<string, number> = {};
    playerList.forEach(p => { s[p.id] = 0; });
    setScores(s);
  }, []);

  // ══════════════════════════════════════════════════════════════════════════════
  // ── SOLO / CHALLENGE ─────────────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════════

  const handlePlayChallenge = useCallback((name: string, avatar: string) => {
    const cp = challengeParams.current;
    const newSeed = cp ? cp.seed : generateSeed();
    const cfg: GameConfig = cp
      ? { roundCount: cp.rounds, timerSeconds: cp.timer, soundEnabled: true }
      : DEFAULT_CONFIG;

    setMyName(name);
    setMyAvatar(avatar);
    setMode('challenge');
    setSeed(newSeed);
    setConfig(cfg);
    const p = [mySoloPlayer(name, avatar)];
    setPlayers(p);
    setRoomCode(generateRoomCode()); // for share URL
    resetGame(newSeed, cfg, p);
    setView('round');
  }, [mySoloPlayer, resetGame]);

  // ══════════════════════════════════════════════════════════════════════════════
  // ── HOST ─────────────────────────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════════

  const handleCreateGame = useCallback(async (name: string, avatar: string, cfg: GameConfig) => {
    setMyName(name);
    setMyAvatar(avatar);
    setConfig(cfg);
    setIsLoading(true);
    setError(null);

    const code = generateRoomCode();
    const newSeed = generateSeed();
    setRoomCode(code);
    setSeed(newSeed);

    const me: Player = { id: myId, name, avatar, isHost: true, isReady: true, totalScore: 0 };
    setPlayers([me]);

    if (supabaseReady) {
      setMode('online');
      const ch = supabase.channel(channel(code), { config: { presence: { key: myId } } });

      ch.on('presence', { event: 'sync' }, () => {
        const state = ch.presenceState<{ player: Player }>();
        const ps = Object.values(state).flat().map(s => s.player).filter(Boolean);
        setPlayers(ps.length > 0 ? ps : [me]);
      });

      ch.on('broadcast', { event: 'start' }, ({ payload }: { payload: { seed: number; config: GameConfig } }) => {
        const locs = selectLocations(payload.seed, payload.config.roundCount);
        setLocations(locs);
        setSeed(payload.seed);
        setConfig(payload.config);
        setCurrentRound(0);
        setPendingGuess(null);
        setRoundResults([]);
        setView('round');
      });

      ch.on('broadcast', { event: 'guess' }, ({ payload }: { payload: { playerId: string; roundIndex: number; lat: number; lng: number; distanceKm: number; score: number } }) => {
        const { playerId, roundIndex, lat, lng, distanceKm, score: pts } = payload;
        setRoundResults(prev => {
          const next = [...prev];
          while (next.length <= roundIndex) next.push({ locationIndex: next.length, guesses: [] });
          const existing = next[roundIndex].guesses.findIndex(g => g.playerId === playerId);
          const newGuess: RoundGuess = { playerId, lat, lng, distanceKm, score: pts, submittedAt: Date.now() };
          if (existing >= 0) next[roundIndex] = { ...next[roundIndex], guesses: next[roundIndex].guesses.map((g, i) => i === existing ? newGuess : g) };
          else next[roundIndex] = { ...next[roundIndex], guesses: [...next[roundIndex].guesses, newGuess] };
          return next;
        });
        setScores(prev => ({ ...prev, [playerId]: (prev[playerId] ?? 0) + pts }));
      });

      await ch.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await ch.track({ player: me });
        }
      });
      rtChannel.current = ch;
    } else {
      setMode('solo');
      const p = [me];
      setPlayers(p);
    }

    const initScores: Record<string, number> = {};
    initScores[myId] = 0;
    setScores(initScores);
    setIsLoading(false);
    setView('lobby');
  }, [myId]);

  // ── Host marks self ready & starts ───────────────────────────────────────────

  const handleStart = useCallback(async () => {
    if (mode === 'online' && rtChannel.current) {
      await rtChannel.current.send({ type: 'broadcast', event: 'start', payload: { seed, config } });
    }
    const locs = selectLocations(seed, config.roundCount);
    setLocations(locs);
    resetGame(seed, config, players);
    setView('round');
  }, [mode, seed, config, players, resetGame]);

  // ── Host ready (for lobby display) ───────────────────────────────────────────

  const handleReady = useCallback(() => {
    setPlayers(prev => prev.map(p => p.id === myId ? { ...p, isReady: true } : p));
    if (mode === 'online' && rtChannel.current) {
      rtChannel.current.send({ type: 'broadcast', event: 'ready', payload: { playerId: myId } });
    }
  }, [myId, mode]);

  // ══════════════════════════════════════════════════════════════════════════════
  // ── JOIN ─────────────────────────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════════

  const handleJoinGame = useCallback(async (code: string, name: string, avatar: string) => {
    setMyName(name);
    setMyAvatar(avatar);
    setRoomCode(code);
    setIsLoading(true);
    setError(null);

    const me: Player = { id: myId, name, avatar, isHost: false, isReady: false, totalScore: 0 };
    setPlayers([me]);

    if (supabaseReady) {
      setMode('online');
      const ch = supabase.channel(channel(code), { config: { presence: { key: myId } } });

      ch.on('presence', { event: 'sync' }, () => {
        const state = ch.presenceState<{ player: Player }>();
        const ps = Object.values(state).flat().map(s => s.player).filter(Boolean);
        if (ps.length > 0) setPlayers(ps);
      });

      ch.on('broadcast', { event: 'start' }, ({ payload }: { payload: { seed: number; config: GameConfig } }) => {
        const locs = selectLocations(payload.seed, payload.config.roundCount);
        setLocations(locs);
        setSeed(payload.seed);
        setConfig(payload.config);
        setCurrentRound(0);
        setPendingGuess(null);
        setRoundResults([]);
        const s: Record<string, number> = {};
        setPlayers(prev => { prev.forEach(p => { s[p.id] = 0; }); return prev; });
        setScores(s);
        setView('round');
      });

      ch.on('broadcast', { event: 'ready' }, ({ payload }: { payload: { playerId: string } }) => {
        setPlayers(prev => prev.map(p => p.id === payload.playerId ? { ...p, isReady: true } : p));
      });

      ch.on('broadcast', { event: 'guess' }, ({ payload }: { payload: { playerId: string; roundIndex: number; lat: number; lng: number; distanceKm: number; score: number } }) => {
        const { playerId, roundIndex, lat, lng, distanceKm, score: pts } = payload;
        setRoundResults(prev => {
          const next = [...prev];
          while (next.length <= roundIndex) next.push({ locationIndex: next.length, guesses: [] });
          const existing = next[roundIndex].guesses.findIndex(g => g.playerId === playerId);
          const newGuess: RoundGuess = { playerId, lat, lng, distanceKm, score: pts, submittedAt: Date.now() };
          if (existing >= 0) next[roundIndex] = { ...next[roundIndex], guesses: next[roundIndex].guesses.map((g, i) => i === existing ? newGuess : g) };
          else next[roundIndex] = { ...next[roundIndex], guesses: [...next[roundIndex].guesses, newGuess] };
          return next;
        });
        setScores(prev => ({ ...prev, [playerId]: (prev[playerId] ?? 0) + pts }));
      });

      await ch.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await ch.track({ player: me });
        }
      });
      rtChannel.current = ch;
    } else {
      setError('Supabase not configured — online rooms are unavailable. Use Solo mode instead.');
      setIsLoading(false);
      return;
    }

    const initScores: Record<string, number> = {};
    initScores[myId] = 0;
    setScores(initScores);
    setIsLoading(false);
    setView('lobby');
  }, [myId]);

  // ══════════════════════════════════════════════════════════════════════════════
  // ── GUESS SUBMISSION ─────────────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════════

  const handleSubmitGuess = useCallback(async (guess: LatLng | null) => {
    const loc = locations[currentRound];
    if (!loc) return;

    const distanceKm = guess ? haversineKm(guess.lat, guess.lng, loc.lat, loc.lng) : 40000;
    const pts = guess ? calcScore(distanceKm) : 0;

    const roundGuess: RoundGuess = {
      playerId: myId,
      lat: guess?.lat ?? 0,
      lng: guess?.lng ?? 0,
      distanceKm,
      score: pts,
      submittedAt: Date.now(),
    };

    // Update local state
    setRoundResults(prev => {
      const next = [...prev];
      while (next.length <= currentRound) next.push({ locationIndex: next.length, guesses: [] });
      const existing = next[currentRound].guesses.findIndex(g => g.playerId === myId);
      if (existing >= 0) next[currentRound] = { ...next[currentRound], guesses: next[currentRound].guesses.map((g, i) => i === existing ? roundGuess : g) };
      else next[currentRound] = { ...next[currentRound], guesses: [...next[currentRound].guesses, roundGuess] };
      return next;
    });
    setScores(prev => ({ ...prev, [myId]: (prev[myId] ?? 0) + pts }));
    setPendingGuess(guess);

    // Broadcast to others
    if (mode === 'online' && rtChannel.current && guess) {
      await rtChannel.current.send({
        type: 'broadcast',
        event: 'guess',
        payload: { playerId: myId, roundIndex: currentRound, lat: guess.lat, lng: guess.lng, distanceKm, score: pts },
      });
    }

    if (config.soundEnabled) {
      import('@/lib/sounds').then(s => s.playReveal());
    }

    setView('reveal');
  }, [locations, currentRound, myId, mode, config.soundEnabled]);

  // ══════════════════════════════════════════════════════════════════════════════
  // ── NEXT ROUND ───────────────────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════════

  const handleNext = useCallback(() => {
    const nextRound = currentRound + 1;
    if (nextRound >= config.roundCount) {
      setView('results');
    } else {
      setCurrentRound(nextRound);
      setPendingGuess(null);
      setView('round');
    }
  }, [currentRound, config.roundCount]);

  // ══════════════════════════════════════════════════════════════════════════════
  // ── PLAY AGAIN / HOME ────────────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════════

  const handlePlayAgain = useCallback(() => {
    const newSeed = generateSeed();
    setSeed(newSeed);
    resetGame(newSeed, config, players);
    setView('round');
  }, [config, players, resetGame]);

  const handleHome = useCallback(() => {
    leaveChannel();
    setView('home');
    setRoundResults([]);
    setCurrentRound(0);
    setScores({});
    setPendingGuess(null);
    // Clear challenge URL params
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', window.location.pathname);
    }
    challengeParams.current = null;
  }, [leaveChannel]);

  const handleLeave = useCallback(() => {
    leaveChannel();
    handleHome();
  }, [leaveChannel, handleHome]);

  // ══════════════════════════════════════════════════════════════════════════════
  // ── DERIVED ──────────────────────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════════

  const currentLocation = locations[currentRound];
  const currentRoundResult = roundResults[currentRound];
  const otherPlayersNotGuessed = players.length > 1
    ? players.filter(p => p.id !== myId && !roundResults[currentRound]?.guesses.find(g => g.playerId === p.id)).length
    : 0;

  const challengeUrl = buildChallengeUrl(seed, config.roundCount, config.timerSeconds);

  // ══════════════════════════════════════════════════════════════════════════════
  // ── RENDER ───────────────────────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════════

  if (error) {
    return (
      <div className="min-h-screen bg-geo-dark flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="text-4xl mb-4">⚠️</div>
          <p className="text-white/60 text-sm mb-4">{error}</p>
          <button
            onClick={() => { setError(null); setView('home'); }}
            className="px-6 py-3 rounded-xl bg-emerald-500 text-white font-bold text-sm"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-geo-dark flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-spin">🌍</div>
          <p className="text-white/40 text-sm">Setting up your game…</p>
        </div>
      </div>
    );
  }

  if (view === 'home') {
    return (
      <HomeScreen
        onCreateGame={handleCreateGame}
        onJoinGame={handleJoinGame}
        onPlayChallenge={handlePlayChallenge}
        challengeDetected={!!challengeParams.current}
      />
    );
  }

  if (view === 'lobby') {
    const isHost = players.find(p => p.id === myId)?.isHost ?? false;
    return (
      <LobbyScreen
        roomCode={roomCode}
        players={players}
        myId={myId}
        isHost={isHost}
        onReady={handleReady}
        onStart={handleStart}
        onLeave={handleLeave}
        challengeUrl={challengeUrl}
        isOnline={mode === 'online'}
      />
    );
  }

  if (view === 'round' && currentLocation) {
    return (
      <GameRound
        location={currentLocation}
        roundIndex={currentRound}
        totalRounds={config.roundCount}
        config={config}
        playersWaiting={otherPlayersNotGuessed}
        onSubmitGuess={handleSubmitGuess}
        soundEnabled={config.soundEnabled}
      />
    );
  }

  if (view === 'reveal' && currentLocation && currentRoundResult) {
    return (
      <RevealScreen
        location={currentLocation}
        roundIndex={currentRound}
        totalRounds={config.roundCount}
        myId={myId}
        players={players}
        guesses={currentRoundResult.guesses}
        scores={scores}
        isLastRound={currentRound >= config.roundCount - 1}
        onNext={handleNext}
      />
    );
  }

  if (view === 'results') {
    return (
      <ResultsScreen
        players={players}
        myId={myId}
        locations={locations}
        roundResults={roundResults}
        scores={scores}
        seed={seed}
        roundCount={config.roundCount}
        timerSec={config.timerSeconds}
        soundEnabled={config.soundEnabled}
        onPlayAgain={handlePlayAgain}
        onHome={handleHome}
      />
    );
  }

  // Fallback (e.g. reveal before round result exists)
  return (
    <div className="min-h-screen bg-geo-dark flex items-center justify-center">
      <button onClick={handleHome} className="text-white/40 text-sm hover:text-white/70">
        ← Return home
      </button>
    </div>
  );
}
