import { Tile, TileValueMap } from './tile.model';

export type BetType = 'higher' | 'lower';

export type GamePhase =
  | 'idle'       // before the game starts (shouldn't last long)
  | 'betting'    // player sees current hand and must bet
  | 'revealing'  // next hand is shown; result displayed
  | 'game-over'; // final state

export type GameOverReason =
  | 'tile-min'       // a tile type reached value 0
  | 'tile-max'       // a tile type reached value 10
  | 'deck-exhausted' // draw pile emptied 3 times
  | null;

export const HAND_SIZE = 5;
export const MAX_RESHUFFLES = 2; // game over on 3rd exhaustion (after 2 reshuffles)

/** Snapshot of one dealt hand and the bet outcome. */
export interface HandRecord {
  id: string;
  round: number;
  tiles: Tile[];
  total: number;
  /** Bet placed BEFORE this hand was revealed (undefined for round-0 seed hand). */
  betMade?: BetType;
  /** Whether the bet on this hand was won. Undefined for seed hand. */
  won?: boolean;
}

export interface GameState {
  phase: GamePhase;
  score: number;
  round: number;
  /** The hand currently shown to the player (large display). */
  currentHand: Tile[];
  /** Next hand being revealed. Populated during 'revealing' phase only. */
  revealedHand: Tile[] | null;
  drawPile: Tile[];
  discardPile: Tile[];
  /** How many times the draw pile has been exhausted and reshuffled. */
  reshuffleCount: number;
  /** Dynamic value map for honor tiles. Number tiles use faceNumber directly. */
  tileValues: TileValueMap;
  /** All completed hand records in chronological order. */
  handHistory: HandRecord[];
  /** Bet placed this round, waiting for reveal. */
  currentBet: BetType | null;
  gameOverReason: GameOverReason;
  /** Human-readable game-over message. */
  gameOverMessage: string;
  /** Name entered on game-over screen (set before persisting score). */
  playerName: string;
}
