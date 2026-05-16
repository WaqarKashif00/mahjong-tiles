import {
  Component,
  inject,
  ChangeDetectionStrategy,
  signal,
  computed,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { GameService } from '../../core/services/game.service';
import { BetType } from '../../core/models/game.model';
import { TileCardComponent } from '../../shared/components/tile-card/tile-card.component';

const REVEAL_STAGGER_MS = 80;
const CURRENT_STAGGER_MS = 70;
const RESULT_BANNER_MS = 900;
const GAME_OVER_NAV_MS = 1200;

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
  protected animatedRevealIndices = signal<boolean[]>([]);
  protected showResultBanner = signal(false);
  protected lastResult = signal<'win' | 'loss' | null>(null);
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

  protected readonly recentHistory = computed(() =>
    [...this.game.handHistory()].reverse().slice(0, 4)
  );

  protected readonly revealOutcome = computed<'win' | 'loss' | 'neutral'>(() => {
    const result = this.lastResult();
    if (result === 'win') return 'win';
    if (result === 'loss') return 'loss';
    return 'neutral';
  });

  ngOnInit(): void {
    this.triggerCurrentHandAnimation();
  }

  // ── Actions ────────────────────────────────────────────────────────────────

  placeBet(bet: BetType): void {
    this.showResultBanner.set(false);
    this.lastResult.set(null);
    this.game.placeBet(bet);

    // placeBet() can trigger game-over when the draw pile is exhausted for the 3rd time
    if (this.game.phase() === 'game-over') {
      setTimeout(() => this.router.navigate(['/game-over']), GAME_OVER_NAV_MS);
      return;
    }

    this.triggerRevealAnimation();
  }

  continueAfterReveal(): void {
    // Compute result from current state BEFORE resolveRound changes it
    const bet = this.game.currentBet();
    const currentTotal = this.game.currentHandTotal();
    const revealedTotal = this.game.revealedHandTotal();

    if (bet === null || revealedTotal === null) return;

    const won =
      (bet === 'higher' && revealedTotal > currentTotal) ||
      (bet === 'lower' && revealedTotal < currentTotal);

    this.lastResult.set(won ? 'win' : 'loss');
    this.showResultBanner.set(true);

    setTimeout(() => {
      this.showResultBanner.set(false);
      this.lastResult.set(null);
      this.animatedRevealIndices.set([]);
      this.game.resolveRound();

      if (this.game.phase() === 'game-over') {
        setTimeout(() => this.router.navigate(['/game-over']), GAME_OVER_NAV_MS);
        return;
      }

      this.triggerCurrentHandAnimation();
    }, RESULT_BANNER_MS);
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
      }, i * REVEAL_STAGGER_MS + 50);
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
      }, i * CURRENT_STAGGER_MS + 30);
    });
  }
}
