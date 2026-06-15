/*
Fast word segmentation of decoded chakras using the repository's BK-tree *vocabulary*
(exact membership) via greedy longest-match. The repo's Default_Segmenter does edit-distance
fuzzy matching with a DP and is far too slow to run over the 9 MB dictionary in bulk; this
tool trades fuzzy tolerance for speed by matching only exact dictionary words, falling back
to single syllables where no dictionary word starts. Good enough for readable shlokas.

Build:  npx tsc -p tsconfig.tools.json
Run:    node build/tools/segment_fast.js [<adhyaya> <chakra> ...]  (default: Adhyaya 2-8 ch.1)
*/
import * as fs from 'fs';
import * as path from 'path';
import { BKTree } from '../src/BK_tree.js';
import { BrahmiDistanceCalculator } from '../src/fuzzy_search.js';
import { kannada_script } from '../src/script.js';
import { Word } from '../src/sequence.js';
import { SequenceFile, Encoding } from '../src/file_processor.js';
import { Logger } from '../src/utils/logger.js';

Logger.loggingOn = false;
const MAXLEN = 14; // longest dictionary word to try at each position

// The manuscript marks vowel length (hasv/dirgha/pluta) that dictionary head-words usually
// don't; collapsing each vowel to its group's short form turns those edit-distance-1
// variants into exact matches, so greedy lookup catches real words without fuzzy search.
const VGROUP: Record<number, number> = {
  1: 1, 2: 1, 3: 1, 4: 4, 5: 4, 6: 4, 7: 7, 8: 7, 9: 7, 10: 10, 11: 10, 12: 10,
  14: 14, 15: 14, 16: 16, 17: 16, 18: 16, 19: 19, 20: 19, 21: 19,
  22: 22, 23: 22, 24: 22, 25: 25, 26: 25, 27: 25,
};
const norm = (nums: number[]): string =>
  Word.fromNumbers(nums.map((n) => VGROUP[n] ?? n)).toEncodedString();

const dict = BKTree.fromFile('data/bk_tree_best.json', new BrahmiDistanceCalculator());
const VOCAB = new Set<string>(dict.gettAllWords().map((w) => norm(w.toNumbers())));

function targets(): Array<[number, number]> {
  const a = process.argv.slice(2).map(Number);
  if (a.length >= 2) {
    const out: Array<[number, number]> = [];
    for (let i = 0; i + 1 < a.length; i += 2) out.push([a[i], a[i + 1]]);
    return out;
  }
  return [2, 3, 4, 5, 6, 7, 8].map((x) => [x, 1] as [number, number]);
}

// Greedy longest-match: at each position take the longest run that is an exact dictionary
// word; if none (len>=2), emit the single syllable and advance by one.
function segment(nums: number[]): Word[] {
  const words: Word[] = [];
  let i = 0;
  while (i < nums.length) {
    let matched = 0;
    for (let len = Math.min(MAXLEN, nums.length - i); len >= 2; len--) {
      const slice = nums.slice(i, i + len);
      if (VOCAB.has(norm(slice))) { words.push(Word.fromNumbers(slice)); matched = len; break; }
    }
    if (!matched) { words.push(Word.fromNumbers([nums[i]])); matched = 1; }
    i += matched;
  }
  return words;
}

for (const [a, m] of targets()) {
  const inFile = path.join('data', 'output', String(a), `chakra_${m}.txt`);
  if (!fs.existsSync(inFile)) { process.stderr.write(`skip: ${inFile}\n`); continue; }
  const nums = SequenceFile.readLine(inFile, Encoding.numerical, undefined, ' ').toNumbers();
  const text = segment(nums).map((w) => kannada_script.wordToScript(w)).join(' ');
  fs.writeFileSync(path.join('data', 'output', String(a), `chakra_${m}_segmented.txt`), text + '\n');
  console.log(`\n===== Adhyaya ${a} Chakra ${m} (segmented, greedy) =====`);
  console.log(text);
}
