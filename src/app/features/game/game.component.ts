import {
  Component,
  inject,
  ChangeDetectionStrategy,
  signal,
  computed,
  OnInit,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { GameService } from '../../core/services/game.service';
import { BetType } from '../../core/models/game.model';
import { TileCardComponent } from '../../shared/components/tile-card/tile-card.component';

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [CommonModule, TileCardComponent],
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GameComponent implements OnInit {
  private router = inject(Router);
  protected game = inject(GameService);

  // ── Local UI state ─────────────────────────────────────────────────────
  /** Which tiles in the revealed hand are animated (indexed). */
  protected animatedRevealIndices = signal<boolean[]>([]);
  /** Whether the result banner is visible. */
  protected showResultBanner = signal(false);
  /** 'win' | 'loss' | null for the current result. */
  protected lastResult = signal<'win' | 'loss' | null>(null);
  /** Stagger deal-in animation for current hand. */
  protected animatedCurrentIndices = signal<boolean[]>([]);

  // ── Derived display data ────────────────────────────────────────────────
  protected readonly phase = this.game.phase;
  protected readonly score = this.game.score;
  protected readonly round = this.game.round;
  protected readonly tileValues = this.game.tileValues;
  protected readonly currentHand = this.game.currentHand;
  protected readonly revealedHand = this.game.revealedHand;
  protected readonly currentHandTotal = this.game.currentHandTotal;
  protected readonly revealedHandTotal = this.game.revealedHandTotal;
  protected readonly drawPileCount = this.game.drawPileCount;
  protected readonly discardPileCount = this.game.discardPileCount;
  protected readonly handHistory = this.game.handHistory;
  protected readonly reshuffleCount = this.game.reshuffleCount;
  protected readonly currentBet = this.game.currentBet;

  /** Last 4 completed hands to show in the history strip. */
  protected readonly recentHistory = computed(() =>
    [...this.game.handHistory()].reverse().slice(0, 4)
  );

  /** Outcome for each tile in the revealed hand. */
  protected readonly revealOutcome = computed<'win' | 'loss' | 'neutral'>(() => {
    const result = this.lastResult();
    if (result === 'win') return 'win';
    if (result === 'loss') return 'loss';
    return 'neutral';
  });

  constructor() {
    // Navigate to game-over page when phase changes
    effect(() => {
      if (this.game.phase() === 'game-over') {
        // Give animations a moment to play out
        setTimeout(() => this.router.navigate(['/game-over']), 1200);
      }
    });
  }

  ngOnInit(): void {
    // Animate current hand on load
    this.triggerCurrentHandAnimation();
  }

  // ── Actions ────────────────────────────────────────────────────────────────

  placeBet(bet: BetType): void {
    this.showResultBanner.set(false);
    this.lastResult.set(null);
    this.game.placeBet(bet);
    // Animate the incoming revealed hand tiles
    this.triggerRevealAnimation();
  }

  continueAfterReveal(): void {
    // Determine win/loss from last history record
    const history = this.game.handHistory();
    const last = history[history.length - 1];
    const won = last?.won ?? false;

    this.lastResult.set(won ? 'win' : 'loss');
    this.showResultBanner.set(true);

    // After brief delay, advance state
    setTimeout(() => {
      this.showResultBanner.set(false);
      this.lastResult.set(null);
      this.animatedRevealIndices.set([]);
      this.game.resolveRound();
      this.triggerCurrentHandAnimation();
    }, 900);
  }

  exitGame(): void {
    this.router.navigate(['/']);
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private triggerRevealAnimation(): void {
    const count = this.game.revealedHand()?.length ?? 0;
    const flags = Array(count).fill(false);
    this.animatedRevealIndices.set(flags);

    flags.forEach((_, i) => {
      setTimeout(() => {
        const updated = [...this.animatedRevealIndices()];
        updated[i] = true;
        this.animatedRevealIndices.set(updated);
      }, i * 80 + 50);
    });
  }

  private triggerCurrentHandAnimation(): void {
    const count = this.game.currentHand()?.length ?? 0;
    const flags = Array(count).fill(false);
    this.animatedCurrentIndices.set(flags);

    flags.forEach((_, i) => {
      setTimeout(() => {
        const updated = [...this.animatedCurrentIndices()];
        updated[i] = true;
        this.animatedCurrentIndices.set(updated);
      }, i * 70 + 30);
    });
  }
}
