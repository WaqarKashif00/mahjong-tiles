import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Tile, TileValueMap } from '../../../core/models/tile.model';
import { DeckService } from '../../../core/services/deck.service';

@Component({
  selector: 'app-tile-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tile-card.component.html',
  styleUrls: ['./tile-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TileCardComponent {
  @Input({ required: true }) tile!: Tile;
  @Input({ required: true }) tileValues!: TileValueMap;
  /** 'large' for current/revealed hand, 'small' for history strip. */
  @Input() size: 'large' | 'small' = 'large';
  /** Visual state applied after round resolution. */
  @Input() outcome: 'win' | 'loss' | 'neutral' = 'neutral';
  /** Whether to animate the tile dealing-in. */
  @Input() animate = false;

  constructor(private deck: DeckService) {}

  get value(): number {
    return this.deck.getTileValue(this.tile, this.tileValues);
  }

  get symbol(): string {
    const t = this.tile;
    if (!t.isHonor) {
      return String(t.faceNumber);
    }
    if (t.windType) {
      return { east: '東', south: '南', west: '西', north: '北' }[t.windType] ?? '';
    }
    if (t.dragonType) {
      return { chun: '中', hatsu: '發', haku: '白' }[t.dragonType] ?? '';
    }
    return '';
  }

  get suitLabel(): string {
    const t = this.tile;
    if (t.suit === 'man') return '萬';
    if (t.suit === 'sou') return '竹';
    if (t.suit === 'pin') return '筒';
    if (t.windType) {
      return { east: 'East', south: 'South', west: 'West', north: 'North' }[t.windType] ?? '';
    }
    if (t.dragonType) {
      return { chun: 'Red Dragon', hatsu: 'Green Dragon', haku: 'White Dragon' }[t.dragonType] ?? '';
    }
    return '';
  }

  get cssClasses(): Record<string, boolean> {
    return {
      'tile-card': true,
      [`tile-card--${this.size}`]: true,
      [`tile-card--${this.tile.suit}`]: true,
      [`tile-card--${this.tile.dragonType ?? ''}`]: !!this.tile.dragonType,
      'tile-card--win': this.outcome === 'win',
      'tile-card--loss': this.outcome === 'loss',
      'tile-card--animate': this.animate,
    };
  }
}
