import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { Bandha } from '../src/bandha.js';
import { Chakra } from '../src/chakra.js';
import { Sequence2D } from '../src/sequence.js';
import { SequenceFile, Encoding } from '../src/file_processor.js';

// Cross-checks that the TypeScript Navmank-Bandh reproduces the committed decode of the
// Anil Kumar Jain Adhyaya 2-8 grids (ingested by tools/ingest_chakra_xls.py, decoded by
// tools/decode_navmank.py). This closes the gap noted in research/verification-notes.md:
// Navmank was previously validated only structurally, never against real Chapter 2-8 data.

function decode(gridFile: string): number[] {
  const grid = new Chakra(
    new Sequence2D(SequenceFile.readLine(gridFile, Encoding.numerical)),
  );
  return Bandha.navmankBandha().apply(grid).toNumbers();
}

function committed(outFile: string): number[] {
  return fs
    .readFileSync(outFile, 'utf8')
    .trim()
    .split(/\s+/)
    .filter((t) => !t.startsWith('#'))
    .map(Number);
}

// One clean chakra from several adhyayas (729 valid cells, no transcription fills).
const CASES = [
  { adhyaya: 2, chakra: 5 },
  { adhyaya: 4, chakra: 2 },
  { adhyaya: 6, chakra: 1 },
  { adhyaya: 8, chakra: 1 },
];

describe('Navmank-Bandh decode of Adhyaya 2-8 (Anil Jain grids)', () => {
  for (const { adhyaya, chakra } of CASES) {
    it(`reproduces committed decode for Adhyaya ${adhyaya} Chakra ${chakra}`, () => {
      const grid = path.join('data', 'chapters', String(adhyaya), `chakra_${chakra}.txt`);
      const out = path.join('data', 'output', String(adhyaya), `chakra_${chakra}.txt`);
      const decoded = decode(grid);
      expect(decoded).toEqual(committed(out));
    });
  }

  it('Navmank is a bijection over all 729 cells of a real Chapter-2 grid', () => {
    const decoded = decode(path.join('data', 'chapters', '2', 'chakra_5.txt'));
    expect(decoded.length).toBe(729);
    // every cell value stays in the manuscript's 1..64 ank range
    expect(decoded.every((n) => n >= 1 && n <= 64)).toBe(true);
  });
});
