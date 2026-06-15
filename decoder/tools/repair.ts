/*
Dictionary-guided repair of transcription artifacts in the ingested Adhyaya 2-8 grids.

Each artifact cell maps (through the Navmank-Bandh) to one fixed position in the decoded
syllable stream. For "merge-ambiguous" cells — where the source held two or more legible
numbers fused into one token (e.g. "47-1", "754") — we try each candidate, segment the
local window with the repo's own BK-tree dictionary, and keep the value that yields the
best-matching Kannada words. "Lost" cells (illegible: "-", "Q", blanks) are NOT guessed —
fabricating 1-of-64 would invent data; they stay as placeholder 1 and are flagged in the
report for manual correction against the manuscript.

Reads tools/bad_cells.json (produced from the source .xls), rewrites the affected
chapters/<A>/chakra_<M>.txt in place, and writes data/chapters/REPAIR_REPORT.md.

Build:  npx tsc -p tsconfig.tools.json
Run:    node build/tools/repair.js
*/
import * as fs from 'fs';
import * as path from 'path';
import { BKTree } from '../src/BK_tree.js';
import { BrahmiDistanceCalculator } from '../src/fuzzy_search.js';
import { Word } from '../src/sequence.js';
import { Bandha } from '../src/bandha.js';
import { Logger } from '../src/utils/logger.js';

interface BadCell { k: number; raw: string; cands: number[]; kind: string; }
interface Entry { adhyaya: number; chakra: number; file: string; cells: BadCell[]; }

Logger.loggingOn = false;

const dict = BKTree.fromFile('data/bk_tree_best.json', new BrahmiDistanceCalculator());
// Extract every dictionary word once into a hash set of encoded strings. Fuzzy BK-tree
// queries against the 9 MB tree are far too slow to run thousands of times; exact
// membership lookups are O(1) and good enough to choose between a handful of candidates.
const VOCAB = new Set<string>(dict.gettAllWords().map((w) => w.toEncodedString()));
const bandha = Bandha.navmankBandha().get();
const posOf = new Map<number, number>();
bandha.forEach((c, idx) => posOf.set(c.i * 27 + c.j, idx));

function readGridFile(file: string): { header: string[]; nums: number[] } {
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  const header = lines.filter((l) => l.startsWith('#'));
  const data = lines.find((l) => l.trim() && !l.startsWith('#'))!;
  return { header, nums: data.trim().split(',').map(Number) };
}

function decode(nums: number[]): number[] {
  return bandha.map((c) => nums[c.i * 27 + c.j]);
}

// Fast fitness: length of the longest EXACT dictionary word that covers position p.
// A candidate that lets a real (long) word form across the repaired cell scores high.
function coverage(nums: number[], p: number): number {
  let best = 0;
  for (let a = Math.max(0, p - 9); a <= p; a++) {
    for (let b = Math.min(nums.length, p + 10); b > p; b--) {
      const len = b - a;
      if (len < 2 || len <= best) continue;
      if (VOCAB.has(Word.fromNumbers(nums.slice(a, b)).toEncodedString())) {
        best = len;
        break;
      }
    }
  }
  return best; // higher is better
}

const entries: Entry[] = JSON.parse(fs.readFileSync('tools/bad_cells.json', 'utf8'));
const report: string[] = [
  '# Adhyaya 2-8 dictionary-guided repair report',
  '',
  'Merge-ambiguous cells (source held >1 legible number) were resolved by picking the',
  'candidate whose decoded window best matches the BK-tree dictionary. Lost cells',
  '(illegible in the 2012 source) are left as placeholder `1` and listed for manual fixing.',
  '',
];
let resolved = 0;
let flagged = 0;

for (const e of entries) {
  const { header, nums } = readGridFile(e.file);
  const out = decode(nums);
  const merges = e.cells.filter((c) => c.kind === 'merge');
  const losts = e.cells.filter((c) => c.kind === 'lost');
  const notes: string[] = [];

  for (const cell of merges) {
    const lin = cell.k - 1;
    const p = posOf.get(lin)!;
    let best = cell.cands[0];
    let bestScore = -1;
    let second = -1;
    for (const v of cell.cands) {
      out[p] = v;
      const sc = coverage(out, p);
      if (sc > bestScore) { second = bestScore; bestScore = sc; best = v; }
      else if (sc > second) { second = sc; }
    }
    out[p] = best;
    nums[lin] = best;
    resolved++;
    const conf = bestScore > second ? 'medium' : 'low';
    notes.push(
      `- cell ${cell.k} \`${cell.raw}\` → **${best}**; candidates [${cell.cands.join(', ')}], ` +
        `coverage ${bestScore} vs next ${second} — ${conf} confidence`,
    );
  }

  for (const cell of losts) {
    flagged++;
    notes.push(`- cell ${cell.k} \`${cell.raw}\` → unrecoverable, left as placeholder 1`);
  }

  if (merges.length) {
    fs.writeFileSync(e.file, header.join('\n') + '\n' + nums.join(',') + '\n');
  }
  report.push(`## Adhyaya ${e.adhyaya} Chakra ${e.chakra} (${merges.length} resolved, ${losts.length} flagged)`);
  report.push(...notes, '');
}

fs.writeFileSync(path.join('data', 'chapters', 'REPAIR_REPORT.md'), report.join('\n'));
Logger.loggingOn = true;
console.log(`Repair done: ${resolved} merge-ambiguous cells resolved, ${flagged} lost cells flagged.`);
console.log('Rewrote affected grids; see data/chapters/REPAIR_REPORT.md');
