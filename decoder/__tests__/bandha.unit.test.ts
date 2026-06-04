import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { Bandha } from '../src/bandha.js';

function coordKey({ i, j }: { i: number; j: number }) {
  return `${i},${j}`;
}

describe('Chakra-Bandha (Siamese diagonal weave)', () => {
  it('reproduces the committed chakra_bandha.txt exactly (729/729)', () => {
    const file = path.join(process.cwd(), 'data', 'chakra_bandha.txt');
    const committed = fs
      .readFileSync(file, 'utf8')
      .trim()
      .split('\n')
      .filter((l) => !l.startsWith('#') && l.includes(','))
      .map((l) => l.trim());
    const generated = Bandha.chakraBandha(27).get().map(coordKey);
    expect(generated).toEqual(committed);
  });

  it('starts at the top-middle cell (row 0, col 13)', () => {
    expect(Bandha.chakraBandha(27).get()[0]).toEqual({ i: 0, j: 13 });
  });

  it('is a bijection over all 729 cells', () => {
    const cells = Bandha.chakraBandha(27).get().map(coordKey);
    expect(cells.length).toBe(729);
    expect(new Set(cells).size).toBe(729);
  });
});

describe('Navmank-Bandh (9x9 UpChakra tiling)', () => {
  it('is a valid bijection over all 729 cells, in range', () => {
    const nav = Bandha.navmankBandha().get();
    expect(nav.length).toBe(729);
    expect(new Set(nav.map(coordKey)).size).toBe(729);
    expect(nav.every(({ i, j }) => i >= 0 && i < 27 && j >= 0 && j < 27)).toBe(true);
  });

  it('traverses each tile with the same shape as a 9x9 Chakra-Bandha', () => {
    const tile = Bandha.chakraBandha(9).get().map(coordKey);
    const firstTile = Bandha.navmankBandha().get().slice(0, 81).map(coordKey);
    expect(firstTile).toEqual(tile);
  });

  it('remains a bijection under an arbitrary tile permutation', () => {
    const order = [8, 7, 6, 5, 4, 3, 2, 1, 0];
    const nav = Bandha.navmankBandha(27, 9, order).get();
    expect(new Set(nav.map(coordKey)).size).toBe(729);
  });

  it('orders tiles per tileOrder (tile 1 occupies columns 9..17 first when ordered)', () => {
    const nav = Bandha.navmankBandha(27, 9, [1, 0, 2, 3, 4, 5, 6, 7, 8]).get();
    // first 81 cells should all lie in tile (row 0, col 1) => rows 0..8, cols 9..17
    const firstTile = nav.slice(0, 81);
    expect(firstTile.every(({ i, j }) => i < 9 && j >= 9 && j < 18)).toBe(true);
  });
});
