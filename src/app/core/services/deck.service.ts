import { Injectable } from '@angular/core';
import {
  Tile,
  TileSuit,
  WindType,
  DragonType,
  TileValueMap,
  INITIAL_HONOR_VALUE,
} from '../models/tile.model';

const SUITS: Array<{ suit: TileSuit; prefix: string }> = [
  { suit: 'man', prefix: 'man' },
  { suit: 'sou', prefix: 'sou' },
  { suit: 'pin', prefix: 'pin' },
];
const WIND_TYPES: WindType[] = ['east', 'south', 'west', 'north'];
const DRAGON_TYPES: DragonType[] = ['chun', 'hatsu', 'haku'];
const COPIES_PER_TILE = 4;

@Injectable({ providedIn: 'root' })
export class DeckService {
  /** Creates a full shuffled 136-tile Mahjong deck. */
  createDeck(): Tile[] {
    const tiles: Tile[] = [];

    // Number tiles (man, sou, pin — 1-9 × 4 copies = 108 tiles)
    for (const { suit, prefix } of SUITS) {
      for (let n = 1; n <= 9; n++) {
        for (let copy = 0; copy < COPIES_PER_TILE; copy++) {
          tiles.push({
            id: `${prefix}-${n}-${copy}`,
            suit,
            faceNumber: n,
            isHonor: false,
            typeKey: `${prefix}-${n}`,
          });
        }
      }
    }

    // Wind tiles (4 types × 4 copies = 16 tiles)
    for (const wind of WIND_TYPES) {
      for (let copy = 0; copy < COPIES_PER_TILE; copy++) {
        tiles.push({
          id: `wind-${wind}-${copy}`,
          suit: 'wind',
          windType: wind,
          isHonor: true,
          typeKey: `wind-${wind}`,
        });
      }
    }

    // Dragon tiles (3 types × 4 copies = 12 tiles)
    for (const dragon of DRAGON_TYPES) {
      for (let copy = 0; copy < COPIES_PER_TILE; copy++) {
        tiles.push({
          id: `dragon-${dragon}-${copy}`,
          suit: 'dragon',
          dragonType: dragon,
          isHonor: true,
          typeKey: `dragon-${dragon}`,
        });
      }
    }

    return this.shuffle(tiles);
  }

  /** Fisher-Yates shuffle — returns a new array. */
  shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /** Builds the initial TileValueMap with all honor tiles at INITIAL_HONOR_VALUE. */
  buildInitialValueMap(): TileValueMap {
    const map: TileValueMap = {};
    for (const wind of WIND_TYPES) {
      map[`wind-${wind}`] = INITIAL_HONOR_VALUE;
    }
    for (const dragon of DRAGON_TYPES) {
      map[`dragon-${dragon}`] = INITIAL_HONOR_VALUE;
    }
    return map;
  }

  /** Returns the current point value of a tile given the value map. */
  getTileValue(tile: Tile, values: TileValueMap): number {
    if (!tile.isHonor) {
      return tile.faceNumber!;
    }
    return values[tile.typeKey] ?? INITIAL_HONOR_VALUE;
  }

  /** Sums the total value of a hand. */
  getHandTotal(hand: Tile[], values: TileValueMap): number {
    return hand.reduce((sum, t) => sum + this.getTileValue(t, values), 0);
  }
}
