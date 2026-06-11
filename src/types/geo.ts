import { Location } from '@/data/locations';

export type GameView = 'home' | 'lobby' | 'round' | 'reveal' | 'results';
export type MultiMode = 'solo' | 'challenge' | 'online';

export interface LatLng { lat: number; lng: number; }

export interface Player {
  id: string;
  name: string;
  avatar: string;
  isHost: boolean;
  isReady: boolean;
  totalScore: number;
}

export interface RoundGuess {
  playerId: string;
  lat: number;
  lng: number;
  distanceKm: number;
  score: number;
  submittedAt: number;
}

export interface RoundResult {
  locationIndex: number;
  guesses: RoundGuess[];
}

export interface GameConfig {
  roundCount: number;    // default 5
  timerSeconds: number;  // default 90; 0 = off
  soundEnabled: boolean;
}

export interface GameState {
  view: GameView;
  mode: MultiMode;
  // Identity
  myId: string;
  myName: string;
  myAvatar: string;
  // Room
  roomCode: string;
  seed: number;
  config: GameConfig;
  // Players (includes self)
  players: Player[];
  // Current game progress
  locations: Location[];
  currentRound: number; // 0-indexed
  // Per-round (keyed by playerId)
  pendingGuess: LatLng | null;
  // Completed rounds
  roundResults: RoundResult[];
  // Scores keyed by playerId
  scores: Record<string, number>;
  // UI
  isLoading: boolean;
  error: string | null;
}
