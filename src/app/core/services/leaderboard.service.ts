import { Injectable, signal, computed } from '@angular/core';
import { LeaderboardEntry, LEADERBOARD_SIZE } from '../models/leaderboard.model';

const STORAGE_KEY = 'mahjong_leaderboard';

@Injectable({ providedIn: 'root' })
export class LeaderboardService {
  private _entries = signal<LeaderboardEntry[]>(this.load());

  readonly entries = computed(() => this._entries());
  readonly topEntries = computed(() =>
    [...this._entries()]
      .sort((a, b) => b.score - a.score)
      .slice(0, LEADERBOARD_SIZE)
  );

  addEntry(name: string, score: number, rounds: number): void {
    const entry: LeaderboardEntry = {
      id: crypto.randomUUID(),
      name: name.trim() || 'Anonymous',
      score,
      rounds,
      date: new Date().toISOString(),
    };
    const updated = [...this._entries(), entry]
      .sort((a, b) => b.score - a.score)
      .slice(0, LEADERBOARD_SIZE * 3); // keep a larger pool, display top N
    this._entries.set(updated);
    this.persist(updated);
  }

  /** Returns whether the given score qualifies for the top-5 leaderboard. */
  isHighScore(score: number): boolean {
    const top = this.topEntries();
    if (top.length < LEADERBOARD_SIZE) return true;
    return score > (top[top.length - 1]?.score ?? 0);
  }

  private load(): LeaderboardEntry[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private persist(entries: LeaderboardEntry[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch {
      // storage unavailable — silently ignore
    }
  }
}
