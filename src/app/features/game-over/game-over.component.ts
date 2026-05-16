import {
  Component,
  inject,
  OnInit,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { GameService } from '../../core/services/game.service';
import { LeaderboardService } from '../../core/services/leaderboard.service';

@Component({
  selector: 'app-game-over',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './game-over.component.html',
  styleUrls: ['./game-over.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GameOverComponent implements OnInit {
  private router = inject(Router);
  protected game = inject(GameService);
  private leaderboard = inject(LeaderboardService);

  // ── UI state ─────────────────────────────────────────────────────────────
  protected playerName = signal('');
  /** True once the score has been saved to the leaderboard. */
  protected submitted = signal(false);
  /** Whether the current score qualifies for the leaderboard. */
  protected isHighScore = signal(false);
  /** Controls the entrance animation. */
  protected visible = signal(false);

  // ── Read from game service ────────────────────────────────────────────────
  readonly score = this.game.score;
  readonly round = this.game.round;
  readonly gameOverMessage = this.game.gameOverMessage;
  readonly gameOverReason = this.game.gameOverReason;

  ngOnInit(): void {
    // Guard: if no finished game exists, redirect home
    if (this.game.phase() !== 'game-over') {
      this.router.navigate(['/']);
      return;
    }
    this.isHighScore.set(this.leaderboard.isHighScore(this.game.score()));
    // Slight delay gives the CSS entrance animation something to transition from
    setTimeout(() => this.visible.set(true), 50);
  }

  /** Save score and name to the leaderboard. */
  submitScore(): void {
    if (this.submitted()) return;
    this.leaderboard.addEntry(
      this.playerName().trim() || 'Anonymous',
      this.game.score(),
      this.game.round()
    );
    this.submitted.set(true);
  }

  /** Start a fresh game immediately. */
  playAgain(): void {
    this.game.startGame();
    this.router.navigate(['/game']);
  }

  /** Return to the landing/leaderboard page. */
  goHome(): void {
    this.router.navigate(['/']);
  }

  /** Returns a user-friendly label for the game-over reason icon. */
  get reasonIcon(): string {
    switch (this.gameOverReason()) {
      case 'tile-min':  return '📉';
      case 'tile-max':  return '📈';
      case 'deck-exhausted': return '🃏';
      default: return '🎴';
    }
  }
}
