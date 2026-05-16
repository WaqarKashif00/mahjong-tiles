import { Injectable, signal, computed } from '@angular/core';
import { Tile, TileValueMap, HONOR_VALUE_WIN_DELTA, HONOR_VALUE_LOSS_DELTA, MIN_TILE_VALUE, MAX_TILE_VALUE } from '../models/tile.model';
import {
  GameState,
  BetType,
  GamePhase,
  HandRecord,
  HAND_SIZE,
  MAX_RESHUFFLES,
} from '../models/game.model';
import { DeckService } from './deck.service';

function buildInitialState(): GameState {
  return {
    phase: 'idle',
    score: 0,
    round: 0,
    currentHand: [],
    revealedHand: null,
    drawPile: [],
    discardPile: [],
    reshuffleCount: 0,
    tileValues: {},
    handHistory: [],
    currentBet: null,
    gameOverReason: null,
    gameOverMessage: '',
    playerName: '',
  };
}

@Injectable({ providedIn: 'root' })
export class GameService {
  private _state = signal<GameState>(buildInitialState());

  // ── Public read signals ────────────────────────────────────────────────────
  readonly state = this._state.asReadonly();
  readonly phase = computed(() => this._state().phase);
  readonly score = computed(() => this._state().score);
  readonly round = computed(() => this._state().round);
  readonly currentHand = computed(() => this._state().currentHand);
  readonly revealedHand = computed(() => this._state().revealedHand);
  readonly drawPileCount = computed(() => this._state().drawPile.length);
  readonly discardPileCount = computed(() => this._state().discardPile.length);
  readonly handHistory = computed(() => this._state().handHistory);
  readonly tileValues = computed(() => this._state().tileValues);
  readonly reshuffleCount = computed(() => this._state().reshuffleCount);
  readonly currentBet = computed(() => this._state().currentBet);
  readonly gameOverReason = computed(() => this._state().gameOverReason);
  readonly gameOverMessage = computed(() => this._state().gameOverMessage);
  readonly currentHandTotal = computed(() =>
    this.deck.getHandTotal(this._state().currentHand, this._state().tileValues)
  );
  readonly revealedHandTotal = computed(() => {
    const s = this._state();
    return s.revealedHand
      ? this.deck.getHandTotal(s.revealedHand, s.tileValues)
      : null;
  });

  constructor(private deck: DeckService) {}

  // ── Game lifecycle ─────────────────────────────────────────────────────────

  startGame(): void {
    const drawPile = this.deck.createDeck();
    const tileValues = this.deck.buildInitialValueMap();
    const { hand, remaining } = this.drawHand(drawPile, HAND_SIZE);

    this._state.set({
      ...buildInitialState(),
      phase: 'betting',
      round: 1,
      currentHand: hand,
      drawPile: remaining,
      discardPile: [],
      tileValues,
    });
  }

  /** Player places a bet on the next hand. Transitions to 'revealing'. */
  placeBet(bet: BetType): void {
    const s = this._state();
    if (s.phase !== 'betting') return;

    // Check if we can deal — reshuffle if needed
    let drawPile = s.drawPile;
    let discardPile = s.discardPile;
    let reshuffleCount = s.reshuffleCount;

    if (drawPile.length === 0) {
      if (reshuffleCount >= MAX_RESHUFFLES) {
        this._state.set({
          ...s,
          phase: 'game-over',
          gameOverReason: 'deck-exhausted',
          gameOverMessage: 'The draw pile ran out for the 3rd time. Game over!',
        });
        return;
      }
      // Reshuffle: fresh deck + discard pile → new draw pile
      const freshDeck = this.deck.createDeck();
      drawPile = this.deck.shuffle([...freshDeck, ...discardPile]);
      discardPile = [];
      reshuffleCount++;
    }

    const { hand: revealedHand, remaining } = this.drawHand(drawPile, HAND_SIZE);

    this._state.set({
      ...s,
      phase: 'revealing',
      currentBet: bet,
      revealedHand,
      drawPile: remaining,
      discardPile,
      reshuffleCount,
    });
  }

  /** Resolve the current reveal and advance to next round (or game-over). */
  resolveRound(): void {
    const s = this._state();
    if (s.phase !== 'revealing' || !s.revealedHand) return;

    const currentTotal = this.deck.getHandTotal(s.currentHand, s.tileValues);
    const revealedTotal = this.deck.getHandTotal(s.revealedHand, s.tileValues);
    const bet = s.currentBet!;

    const won =
      (bet === 'higher' && revealedTotal > currentTotal) ||
      (bet === 'lower' && revealedTotal < currentTotal);

    // Update tile values for honor tiles in the revealed hand
    const tileValues = this.applyTileValueChanges(
      s.revealedHand,
      s.tileValues,
      won
    );

    const newScore = won ? s.score + revealedTotal : s.score;

    // Record this hand in history
    const record: HandRecord = {
      id: `round-${s.round}`,
      round: s.round,
      tiles: s.revealedHand,
      total: revealedTotal,
      betMade: bet,
      won,
    };

    // Check game-over conditions AFTER updating values
    const gameOverResult = this.checkGameOver(tileValues, s.reshuffleCount, s.drawPile.length);

    // Move current hand → discard, revealed hand also → discard
    const discardPile = [...s.discardPile, ...s.currentHand, ...s.revealedHand];

    if (gameOverResult) {
      this._state.set({
        ...s,
        phase: 'game-over',
        score: newScore,
        tileValues,
        discardPile,
        handHistory: [...s.handHistory, record],
        gameOverReason: gameOverResult.reason,
        gameOverMessage: gameOverResult.message,
        currentBet: null,
        revealedHand: null,
        currentHand: s.revealedHand, // keep revealed hand visible on game-over screen
      });
      return;
    }

    // Continue — revealed hand becomes the new current hand
    this._state.set({
      ...s,
      phase: 'betting',
      score: newScore,
      round: s.round + 1,
      currentHand: s.revealedHand,
      revealedHand: null,
      discardPile,
      tileValues,
      handHistory: [...s.handHistory, record],
      currentBet: null,
    });
  }

  setPlayerName(name: string): void {
    this._state.update(s => ({ ...s, playerName: name }));
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private drawHand(
    drawPile: Tile[],
    count: number
  ): { hand: Tile[]; remaining: Tile[] } {
    return {
      hand: drawPile.slice(0, count),
      remaining: drawPile.slice(count),
    };
  }

  private applyTileValueChanges(
    hand: Tile[],
    values: TileValueMap,
    won: boolean
  ): TileValueMap {
    const updated = { ...values };
    const delta = won ? HONOR_VALUE_WIN_DELTA : HONOR_VALUE_LOSS_DELTA;

    for (const tile of hand) {
      if (!tile.isHonor) continue;
      const current = updated[tile.typeKey] ?? 5;
      const next = current + delta;
      // Clamp to [MIN, MAX] — game-over check happens separately
      updated[tile.typeKey] = Math.max(MIN_TILE_VALUE, Math.min(MAX_TILE_VALUE, next));
    }
    return updated;
  }

  private checkGameOver(
    values: TileValueMap,
    reshuffleCount: number,
    drawPileSize: number
  ): { reason: 'tile-min' | 'tile-max' | 'deck-exhausted'; message: string } | null {
    for (const [key, val] of Object.entries(values)) {
      if (val <= MIN_TILE_VALUE) {
        return {
          reason: 'tile-min',
          message: `The ${this.formatTileKey(key)} tile dropped to 0! Game over!`,
        };
      }
      if (val >= MAX_TILE_VALUE) {
        return {
          reason: 'tile-max',
          message: `The ${this.formatTileKey(key)} tile reached 10! Game over!`,
        };
      }
    }

    if (drawPileSize === 0 && reshuffleCount >= MAX_RESHUFFLES) {
      return {
        reason: 'deck-exhausted',
        message: 'The draw pile ran out for the 3rd time. Game over!',
      };
    }

    return null;
  }

  private formatTileKey(key: string): string {
    const parts = key.split('-');
    if (parts[0] === 'wind') return `${parts[1].charAt(0).toUpperCase() + parts[1].slice(1)} Wind`;
    if (parts[0] === 'dragon') {
      const names: Record<string, string> = { chun: 'Red Dragon', hatsu: 'Green Dragon', haku: 'White Dragon' };
      return names[parts[1]] ?? parts[1];
    }
    return key;
  }
}
