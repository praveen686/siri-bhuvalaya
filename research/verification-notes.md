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

## Scope limit

"Decoding the rest of the manuscript" is bounded by **input**, not algorithm. The repo
contains only these 9 transcribed grids. The traditional ~1,200+ chakras are not present;
transcribing manuscript scans into 729-number grids is the field's real bottleneck. The
decoder is only as good as the grids fed to it.

---
*These notes correspond to the live analysis that accompanied the research report; they
record reproducible checks, not opinions.*
