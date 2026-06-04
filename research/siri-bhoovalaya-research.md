# Siri Bhoovalaya — Deep Research Report

> Compiled via a fan-out deep-research harness: 98 agents, 16 sources, 69 claims
> extracted → 25 adversarially verified (3-vote, needs 2/3 to refute) → **23 confirmed,
> 2 refuted**. Raw machine output with per-claim votes and source quality is in
> [`siri-bhoovalaya-research-raw.json`](./siri-bhoovalaya-research-raw.json).
> Independent hands-on verification of the decoder is in
> [`verification-notes.md`](./verification-notes.md).

Confidence tags below come from the verifier panel, not the author.

---

## 1. What it is — authorship & origin *(high confidence, 3-0)*

A Jain manuscript attributed to the **Digambar Jain monk Kumudendu Muni** (Deshi Gana /
Nandi Sangh lineage, Karnataka), written **entirely in Kannada numerals (values 1–64)**
rather than alphabetic script. Kumudendu claimed to be **guru of Amoghavarsha** and
**disciple of Virasena/Jinasena** (the *Dhavala* authors), which would place it in a
**9th-century Rashtrakuta/Ganga** context.

⚠️ **Dating is genuinely disputed** — traditional ~800 AD vs. Dr. T.V. Venkatachala
Sastry's **15th–16th century (~1550–1600)**. A "seemingly modern form of Kannada" is the
unexplained anomaly feeding the skeptics.

*Sources: Wikipedia, srikanta-sastri.org, HereNow4U, Springer 2024.*

---

## 2. The Chakra — the grid *(high, 3-0)*

- A **27×27 matrix = 729 cells**, each an integer **1–64**, each integer → one phonetic
  character (primarily Kannada). One Chakra = **one page** of ciphertext.
- The full work: **1,270 surviving Chakras**, **~600,000 shlokas ≈ 1,400,000 letters**.
- Chapter count is **inconsistent across sources (56 vs 26 vs 59 Adhyayas)** — a real
  data-quality wrinkle.

> ✔️ Confirmed hands-on against the repo: `chakra_1` is exactly 729 cells, values 1–64.

---

## 3. THE BANDHAS — the decoding patterns

A **Bandha is fundamentally a transposition scheme**: a fixed path that linearizes the 2D
grid into a 1D number-string, which is then substituted to letters. *(high, 3-0 — Anil
Jain's CS framing verified verbatim.)*

**Eight named bandhas recur** in the literature *(high, 3-0)*:

| Bandha | Status in verified sources |
|---|---|
| **Chakra-Bandha** | Fully specified (below) |
| **Navmaank / Navmank-Bandh** | Fully specified (below) |
| Shreni-Bandha | Named only |
| Hans (Hamsa)-Bandha | Named only |
| Anu-Bandha | Named only |
| Mayur (Mayura)-Bandha | Named only |
| Saras (Sarasa)-Bandha | Named only |
| Padma (Varapadma)-Bandha | Named only |

### ① Chakra-Bandha *(high, 3-0)*

Traverses **all 729 cells**, starting **Row 1 / Column 14** (cell 1) → cell 2 at
**Row 27 / Col 15** → … → **cell 729 at Row 27 / Col 14**. Output: first-Chakra Kannada
plaintext in **Sangatya Chhanda** (a Kannada meter).

> ✔️ **This is the bandha reverse-engineered and verified in this repo.** The repo's
> `decoder/data/chakra_bandha.txt` starts at `0,13` — i.e. **row 0, column 13**
> (0-indexed) = **Row 1, Column 14** (1-indexed), matching the literature precisely. An
> independent Python reimplementation of this traversal reproduced the committed
> `output_1.txt` byte-for-byte (729/729) and the attested *maṅgala* verse 30/30 syllables.

### ② Navmaank-Bandh *(high, 3-0)*

Applied **from the 2nd to 8th Adhyaya**. It partitions the 27×27 Chakra into
**9×9 "UpChakra" sub-matrices**, each traversed recursively like Chakra-Bandh, with a
**different tile sequence per Adhyaya**.

➡️ **Chakra-Bandha + Navmaank-Bandh together are claimed sufficient to decode the entire
first volume (Khand)** — this is a *proponent self-claim* (aruhant README), not
independently validated.

### On "Koshtak Chintamani / diagonal / spiral" patterns

The research found **no scholarly source** documenting a "Koshtak Chintamani" bandha. That
term appears **only in the aruhant code** (`Bandha.fromKoshtakChintamani(size, up, right)`,
a parametric modular-walk generator) — a programmer's construct/naming, **not an attested
traditional bandha**. The per-coordinate mechanics of the other six named bandhas (Shreni,
Hans, Anu, Mayur, Saras, Padma) are **not documented anywhere** in the verified sources;
they are named as schemes but no published path exists. **This is the single biggest open
gap in the field.**

---

## 4. The decoding pipeline *(high, 3-0)*

1. Transform 2D matrix → row vector (the **Bandha**)
2. Mono-alphabetic substitution via the **Kumudendu Code Table** (each Mula Varna ↔ integer 1–64)
3. Join phonetic characters into words per **Kannada grammar**
4. Extract interlaced multilingual content via **steganography-like patterns**

**KES (Anil Kumar Jain) formalizes this as two ciphers**: a substitution cipher (KCT) + a
transposition cipher (the 729-cell Bandha Traversal Path Matrix). *(high, 3-0)*

---

## 5. The multilingual / "718 languages" claim *(MEDIUM — split 2-1)*

After the base **Halegannada (Old Kannada)** layer, **predefined positional/directional
patterns** (*antarsahitya* interweaving) are said to extract **Prakrit, Sanskrit, Tamil,
Telugu, Apabhramsha, Pali**. Documented example mechanics:

- read **top-to-bottom** → Prakrit
- **from the 9th letter downward** → Sanskrit
- **vertically from the 17th letter** → Telugu

The famous figure: **718 languages/dialects** (18 major + ~700 minor, in ~18 scripts).

⚠️ **Downgraded to medium; the "integrates knowledge from multiple sciences / 718
languages" framing was one of the 2 REFUTED claims.** It rests on proponent assertion +
selective decoding of ~3 chapters, not end-to-end reproduction.

---

## 6. Decipherment history *(high, 3-0)*

- Sole surviving copy brought to light by **Pandit Yellappa Shastri** (~1950s).
- **Karlamangalam Srikantaiah** edited the first edition (**Vol. 1, 1953; Vol. 2, 1955**).
- **Dr. S. Srikanta Sastri (1953)**, scrutinizing the published portion, found **"no
  evidence of a later date than 9th century A.D."** and **"no proof of deliberate forgery
  by any modern author"** — while flagging the modern-Kannada anomaly. This is the
  strongest independent scholarly statement, and it is *cautiously favorable*, not a debunk.

---

## 7. Computational efforts *(high, 3-0)*

- **Anil Kumar Jain — KES (Kumudendu Encryption System)**, presented at the **107th Indian
  Science Congress (Bengaluru, 6 Jan 2020)**.
- **2024 Springer paper** (*Multimedia Tools & Applications*, NLP-based automated decoder)
  — peer-reviewed, but still describes a **largely manual / partial** process.
- **aruhant/siri-bhoovalaya** (this repo) — TS/Python/C++, implements Chakra + Navmank bandhas.
- **mdileep/SiriBhoovalaya** (C#) — mostly **unfinished stubs**; only a basic Excel demo works.
- Overall decipherment remains **incomplete — roughly 3 of 26 chapters**.

---

## The two claims the adversarial verifiers KILLED

1. ❌ *"vowels map to 1–27, consonants to 28–60"* (1-2). Note: the actual repo table
   actually supports vowels 1–27 and consonants 28–60 (specials 61–64); the over-precise
   published version was killed on sourcing, not on the underlying split.
2. ❌ *"numbers correspond to syllables across 718 languages and integrate knowledge from
   multiple sciences"* (1-2) — killed as an unfalsifiable proponent claim.

---

## Honest caveats (from the report)

- Many sources are **proponent self-uploads** (Anil Jain SlideShare decks, KES) or
  **project READMEs** — authoritative for *describing their own models*, not for *proving
  the crypto claims true*.
- **No deep skeptical academic source** beyond Wikipedia's reservations was found — the
  skeptical literature is thin / hard to mine.
- Per-bandha mathematics **beyond the two documented ones do not exist in public sources.**
- Structural figures (1270 Chakras, ~600k shlokas, integers 1–64) are well-corroborated,
  but chapter count is inconsistent (56 vs 26 vs 59).

---

## Open questions

1. **Exact coordinate paths of the other 6 bandhas** (Shreni/Hans/Anu/Mayur/Saras/Padma)
   and what each reveals — undocumented anywhere.
2. Why **modern-form Kannada** if genuinely 9th-century? (paleographic dating unresolved)
3. Is **718 languages** reproducible end-to-end, or an artifact of selective decoding?
4. Lineage/cross-validation among the modern computational workers (Jain, Mehta, et al.).

---

## Sources

**Primary**
- Anil Kumar Jain, *Siri Bhoovalaya from a Computer Science Perspective* (SlideShare)
- Anil Kumar Jain, *Some Structural Aspects of Siribhoovalaya* (SlideShare)
- *KES — 107th Indian Science Congress 2020* (SlideShare)
- srikanta-sastri.org — *Scholarly Opinion on Siribhoovalaya* (S. Srikanta Sastri, 1953)
- Springer 2024 — DOI [10.1007/s11042-024-18527-y](https://link.springer.com/article/10.1007/s11042-024-18527-y)
- github.com/aruhant/siri-bhoovalaya
- github.com/mdileep/SiriBhoovalaya

**Secondary**
- en.wikipedia.org/wiki/Siribhoovalaya
- en.wikipedia.org/wiki/Kumudendu_Muni
- herenow4u.net (NCILC 2013 material)
- brickmag.com — *A Most Ingenious Work of Literature*

*Verification stats: 5 angles · 16 sources fetched · 69 claims extracted · 25 verified ·
23 confirmed · 2 killed · 8 findings after synthesis.*
