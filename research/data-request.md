# Draft: data request for Chapter/Adhyaya 2–8 chakra grids

**Status:** DRAFT — not sent. Review and send yourself if you want it.

**Suggested recipient:** Er. Anil Kumar Jain — `jain.anilk@gmail.com` (siri-bhoovalaya.org).
**Alternate channel:** a GitHub issue on `aruhant/siri-bhoovalaya`, or the
siri-bhoovalaya.org contact form.

---

## Exactly what we're asking for (the format that plugs straight into the decoder)

The decoder needs the **numeric grids** (the puzzles), not decoded text. Ideal delivery,
in order of preference:

1. **Plain text, one chakra per file**, named `chakra_<adhyaya>_<n>.txt` — 27 lines, each
   with 27 space-separated integers in the range 1–64. (This is exactly the shape of the
   Chapter-1 files already in the repo, e.g. `decoder/data/chapters/1/chakra_1.txt`.)
2. **CSV/TSV**, one 27×27 grid per file, same integer convention.
3. **The existing spreadsheets** (e.g. the cited "85 digitised chakras, Adhyaya 1–8") in
   whatever form they already exist — `.xlsx`/`.ods`/`.numbers`. We can convert.

A single example file, for orientation (values are illustrative):

```
59 23 1 16 1 28 28 1 1 56 59 4 56 1 1 47 16 34 1 7 16 1 1 7 56 1 60
... (27 rows total, 27 numbers each = 729 cells) ...
```

If only **page scans** are available, those help too (JP2/TIFF/PDF at the highest
resolution you have) — we can transcribe them — but pre-digitised numeric grids save the
most effort and avoid transcription error.

---

## Suggested message text

> Subject: Request: digitised Siri Bhoovalaya chakra grids (Adhyaya 2–8) for an open
> decoder
>
> Dear Er. Anil Kumar Jain,
>
> I'm working with an open-source Siri Bhoovalaya decoder (building on the
> `aruhant/siri-bhoovalaya` project). I've reproduced the Chakra-Bandha and implemented the
> Navmank-Bandh, and verified both against the Chapter-1 grids and against the reference
> 9×9/27×27 traversal matrices — everything checks out at the syllable level.
>
> The one thing blocking work beyond Chapter 1 is **input data**: only the first chapter's
> grids are public. Your presentations reference **85 digitised chakras across Adhyayas
> 1–8**. Would you be willing to share those grids — or any chakras beyond Chapter 1 — for
> open research and validation?
>
> The most useful form is the **numeric grids themselves**: one 27×27 matrix of integers
> 1–64 per chakra (plain text, CSV, or the spreadsheets you already have). High-resolution
> page scans would also work if grids aren't exported. I'm happy to (a) credit you and your
> group on every decoded chakra, (b) share back the decoded/segmented output and any
> corrections, and (c) keep attribution and licensing however you prefer.
>
> Thank you for your work making this text approachable.
>
> Best regards,
> [your name]

---

## Why this is the real unlock

Per a full survey (see `verification-notes.md` §6), no openly-downloadable numeric grids
exist beyond Chapter 1 — every public source (aruhant, Naras, mdileep, LappyG, the
archive.org book) is Chapter-1-only or contains pattern demos / decoded text rather than
grids. The decoder is validated and waiting; only the grids are missing.
