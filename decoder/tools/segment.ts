/*
Segment decoded chakra outputs into words using the repository's own BK-tree dictionary
and Default_Segmenter (the same pipeline main.ts uses for Chapter 1). Reads the numeric
decode `output/<A>/chakra_<M>.txt`, writes the word-broken Kannada to
`output/<A>/chakra_<M>_segmented.txt`, and prints it.

Build:  npx tsc -p tsconfig.tools.json
Run:    node build/tools/segment.js [<adhyaya> <chakra> ...]   (defaults to the opening
        chakra of each Adhyaya 2-8)
*/
import * as fs from 'fs';
import * as path from 'path';
import { BKTree } from '../src/BK_tree.js';
import { BrahmiDistanceCalculator } from '../src/fuzzy_search.js';
import { Default_Segmenter } from '../src/word_break.js';
import { kannada_script } from '../src/script.js';
import { Transposed } from '../src/sequence.js';
import { SequenceFile, Encoding } from '../src/file_processor.js';

const DICT = 'data/bk_tree_best.json';

// Parse "A M A M ..." pairs from argv, else default to the first chakra of Adhyaya 2-8.
function targets(): Array<[number, number]> {
  const a = process.argv.slice(2).map(Number);
  if (a.length >= 2) {
    const out: Array<[number, number]> = [];
    for (let i = 0; i + 1 < a.length; i += 2) out.push([a[i], a[i + 1]]);
    return out;
  }
  return [2, 3, 4, 5, 6, 7, 8].map((x) => [x, 1] as [number, number]);
}

function run() {
  const log = console.log;
  process.stderr.write(`Loading dictionary ${DICT} ...\n`);
  const dict = BKTree.fromFile(DICT, new BrahmiDistanceCalculator());
  const segmenter = new Default_Segmenter(dict);

  for (const [a, m] of targets()) {
    const inFile = path.join('data', 'output', String(a), `chakra_${m}.txt`);
    if (!fs.existsSync(inFile)) {
      process.stderr.write(`skip (missing): ${inFile}\n`);
      continue;
    }
    let seq = SequenceFile.readLine(inFile, Encoding.numerical, undefined, ' ');
    // Optional prefix cap (env SEG_LEN) — full 729-syllable segmentation is slow, so for a
    // quick readable opening shloka we segment just the first N syllables.
    const cap = Number(process.env.SEG_LEN) || 0;
    if (cap > 0 && seq.length() > cap) seq = seq.slice(0, cap);
    // Silence the segmenter's verbose per-trim console.log while it runs.
    console.log = () => {};
    const words = segmenter.segment(new Transposed(seq));
    console.log = log;
    const text = words.map((w) => kannada_script.wordToScript(w)).join(' ');
    const outFile = path.join('data', 'output', String(a), `chakra_${m}_segmented.txt`);
    fs.writeFileSync(outFile, text + '\n');
    log(`\n===== Adhyaya ${a} Chakra ${m} (segmented) =====`);
    log(text);
  }
}

run();
