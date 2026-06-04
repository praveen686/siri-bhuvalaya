# Independent Verification Notes

Hands-on checks performed directly against this repo's data, independent of the decoder's
own TypeScript. The point is to confirm the decode is **deterministic** (produced by a
fixed key + fixed traversal) and not manufactured by the fuzzy-matching layer.

## 1. The decode is purely mechanical — reproduced from scratch

A standalone Python reimplementation was written that:
1. parses `decoder/data/chapters/1/chakra_1.txt` → a 27×27 grid (729 integers, values 1–64);
2. parses `decoder/data/chakra_bandha.txt` → 729 ordered `(i,j)` traversal coordinates;
3. emits `grid[i][j]` for each coordinate in order.

**Result: the output is byte-for-byte identical to the committed
`decoder/data/output/output_1.txt` (729/729).** No dictionary, no edit distance, no NLP
involved. The Bandha + grid alone produce the number sequence.

## 2. The numbers decode to the attested verse — before any fuzzy step

Mapping those 729 numbers through the fixed syllable table in `decoder/src/script.ts`
yields, for the first line:

```
a ṣṭa ma hā prā ti hā rya  va ybha va di nda  ...
```

This is **30/30 units identical** to the independently published *maṅgala* (auspicious
opening) verse of the manuscript. The dictionary/segmenter only runs *afterwards*, to break
the syllable stream into words and spell-correct — it is **not** what produces the reading.
This is the crucial epistemic point: meaning is not snapped in by flexible matching.

## 3. All 9 shipped chakras decode cleanly

The repo ships 9 transcribed chakras (Chapter 1, first khaṇḍa). Decoding every one with the
same Chakra-Bandha (all verifying byte-identical against their committed `output_N.txt`)
yields coherent Old-Kannada (Halegannada) with genuine Jain doctrinal vocabulary:

| Chakra | Verifies | Opening (independent decode) |
|---|---|---|
| 1 | ✅ | a ṣṭa ma hā prā ti hā rya · va ybha va di nda … (the *maṅgala*) |
| 2 | ✅ | ma vi ru dha si dhānta · va nu mahāvrata · ke ndu navapada … |
| 3 | ✅ | si ka ru saṃsāra sāgara do ḷage … karmāṭaka (= Karnataka) … |
| 4 | ✅ | va da gi bandādhyāni … jñāna bhū … |
| 5 | ✅ | na nta saṃkhyāta di śe yoḷu ba nda · ananta saṃkhyāta … |
| 6 | ✅ | … ṣa dha ga ṇi ta va m **nāgārjuna** (names Nāgārjuna) … |
| 7 | ✅ | dharma dhvaja va da roḷu … cakra ni rma la … |
| 8 | ✅ | ne nu ta kṣaya vāda … puṇya bhū va … |
| 9 | ✅ | sa rya sva sā ra **bhūvalaya** dharma maṅgala da prābhruta vu nirmala … |

## 4. Mapping confirmed against `script.ts`

Vowels occupy integers **1–27**, consonants **28–60**, specials **61–64** (anusvāra 61,
visarga 62, etc.) — consistent for both `kannada_script` and `devanagari_script`. This is
why the refuted published claim ("vowels 1–27, consonants 28–60") is *substantively*
correct even though the verifier killed its over-precise wording on sourcing grounds.

## 5. Navmank-Bandh implemented and structurally verified

The literature describes Navmank-Bandh as: partition the 27×27 Chakra into **9×9
"UpChakra" sub-matrices**, traverse each with the same walk as the Chakra-Bandh, visiting
tiles in a per-Adhyaya sequence (Adhyayas 2–8).

The walk underlying both bandhas is the **Siamese / De-la-Loubère** method: step
`(up=1, right=1)` each cell, and on collision drop straight down one row (`row+1`, same
col). With `(size=27, up=1, right=1)` this reproduces `data/chakra_bandha.txt` **729/729**;
Navmank is the same walk at `size=9` applied to each 9×9 tile.

> **Correction (integrity note).** An earlier version of this file, and the first commit
> message, claimed the existing `fromKoshtakChintamani` had a "wrong collision rule" that
> was "fixed." **That claim was false.** The original code computed `row+2, col-1` *from
> the already-moved cell*, which nets to `row+1, col` from the current cell — i.e. it was
> already the correct Siamese rule and already reproduced the bandha 729/729. The error was
> in a throwaway diagnostic script (it read the pre-move `row` instead of the moved value),
> not in the repo. What was actually committed to `bandha.ts` is a **behaviour-preserving
> refactor**: identical output, but an O(1) `Set` membership test instead of an O(n²)
> `Array.find`, plus clearer naming. Not a bug fix.

The implementation is verified via a vitest suite
(`decoder/__tests__/bandha.unit.test.ts`, 7 tests, all green):

- Chakra-Bandha == committed file, 729/729; starts at `(0,13)`; bijection over 729 cells.
- Navmank-Bandh is a valid **bijection over all 729 cells**, all in range.
- Each Navmank tile has the **same shape as a 9×9 Chakra-Bandha**.
- Navmank stays a bijection under an arbitrary tile permutation, and honours `tileOrder`.

### Cross-check against the original author's reference (strong)

The deprecated C++ (`archive - deprecated version/c++/chakra_navmank_bandha.cpp`) hard-codes
the author's own path matrices. Converting those matrices to coordinate sequences:

- The C++ **27×27** Chakra-Bandha matrix == the committed `chakra_bandha.txt` == this repo's
  `siamese(27)` — all three identical, 729/729.
- The C++ **9×9** Navmank matrix == this repo's `siamese(9)` (the per-tile walk in
  `navmankBandha`) — identical cell-for-cell, all 81 cells.

So the new `navmankBandha` is validated **against the original author's reference
implementation**, not merely against an internal prototype. The C++ also takes the tile
routing as a runtime `order` vector — confirming that parameterising `tileOrder` (rather
than hard-coding it) is faithful to the original design. (Convention nuance: the C++ maps
*spatial tile → output block* via `order[sub_chakraN]`, whereas `navmankBandha` reads
*output block → spatial tile* via `order[k]`; the two coincide for the default identity
order and are inverses otherwise — a labelling choice, not a correctness difference.)

**Validation limit (still honest):** none of this checks Navmank against *known Adhyaya 2–8
plaintext*, because the repo contains only Chapter 1 data and the per-Adhyaya tile
sequences are unattested in public sources. The implementation is verified to (a) be a
valid bijection and (b) match the documented mechanism and the original author's reference
matrices — **not** to reproduce attested Adhyaya 2–8 verses. Running Navmank on Chapter 1
(Chakra-Bandha territory) yields jumbled syllables, as expected. Closing that last gap
requires transcribed Chapter 2–8 grids.

## 6. Data-availability survey for Chapters/Adhyayas 2–8 (2026-06)

A search for openly-downloadable numeric grids beyond Chapter 1 came up **empty**. What
exists publicly:

| Source | What it actually contains | Usable ch. 2–8 grids? |
|---|---|---|
| `aruhant/siri-bhoovalaya` | Chapter 1, 9 chakras (this repo) | No |
| `Naras/Siribhoovalaya` | `Adhyaya_One_Chakras.xlsx` — a single sheet `Chakra1-1-1` | No (Adhyaya 1) |
| `mdileep/SiriBhoovalaya` | `SiriBhoovalaya.xlsx` — sheets hold **path matrices** (values 1–729, the bandha traversal order), not manuscript content (1–64) | No (pattern demo) |
| `LappyG/Bhoovalaya` | `matrix.py` *generates a synthetic placeholder* grid (fills 1–16 into quadrants); not manuscript data | No (toy) |
| archive.org `bmshri.siribhoovalayaka0000npra...` | A scanned **published Kannada book** (decoded text, Ananta Subbarayaru) | No (plaintext, no grids) |
| Anil K. Jain / siri-bhoovalaya.org / KundKund Gyanpeeth | Presentations cite **"85 digitised chakras (Adhyaya 1–8)"** | Referenced but **not published as open data** |

**Conclusion:** every openly-downloadable digitization is Adhyaya/Chapter 1 (essentially
the same ~9 chakras). The larger "85 chakras" digitization is held by the research group
and is not downloadable. The only routes to more grids are (a) OCR/transcribe manuscript
scans or the published book into 729-number grids — the field's real bottleneck — or (b)
request the data directly from Anil Kumar Jain's group. The archive.org book gives decoded
*plaintext* for later adhyayas but not the *grids*, so it cannot be used to mechanically
validate the bandhas (it is the answer, not the puzzle).

## Scope limit

"Decoding the rest of the manuscript" is bounded by **input**, not algorithm. The repo
contains only these 9 transcribed grids. The traditional ~1,200+ chakras are not present;
transcribing manuscript scans into 729-number grids is the field's real bottleneck. The
decoder is only as good as the grids fed to it.

---
*These notes correspond to the live analysis that accompanied the research report; they
record reproducible checks, not opinions.*
