import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LeaderboardService } from '../../core/services/leaderboard.service';
import { GameService } from '../../core/services/game.service';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingComponent {
  private router = inject(Router);
  protected leaderboard = inject(LeaderboardService);
  private game = inject(GameService);

  readonly topEntries = this.leaderboard.topEntries;

  startGame(): void {
    this.game.startGame();
    this.router.navigate(['/game']);
  }
}
