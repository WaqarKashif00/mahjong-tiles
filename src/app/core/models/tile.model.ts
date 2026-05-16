export type TileSuit = 'man' | 'sou' | 'pin' | 'wind' | 'dragon';
export type WindType = 'east' | 'south' | 'west' | 'north';
export type DragonType = 'chun' | 'hatsu' | 'haku';

/** A single tile instance in the deck. */
export interface Tile {
  /** Globally unique instance ID, e.g. "man-5-2" (suit-number-copy). */
  id: string;
  suit: TileSuit;
  /** Face number for man/sou/pin tiles (1–9). Undefined for honor tiles. */
  faceNumber?: number;
  windType?: WindType;
  dragonType?: DragonType;
  /** True for wind and dragon tiles — value is dynamic. */
  isHonor: boolean;
  /**
   * Stable key identifying the tile TYPE (not instance).
   * Used to look up and update dynamic values.
   * e.g., "wind-east", "dragon-chun", "man-5"
   */
  typeKey: string;
}

/** Maps tile typeKey → current value. Number tiles are always face value. */
export type TileValueMap = Record<string, number>;

export const INITIAL_HONOR_VALUE = 5;
export const HONOR_VALUE_WIN_DELTA = 1;
export const HONOR_VALUE_LOSS_DELTA = -1;
export const MIN_TILE_VALUE = 0;
export const MAX_TILE_VALUE = 10;
