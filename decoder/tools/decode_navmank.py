#!/usr/bin/env python3
"""
Bulk-decode the ingested chakra grids (chapters/<A>/chakra_<M>.txt) and emit:
  - output/<A>/chakra_<M>.txt   : the post-bandha numeric sequence (space-separated,
                                  same format as the repo's existing output_N.txt)
  - output/decoded_kannada_adhyaya_<A>.md : a human-readable Old-Kannada rendering

Bandha per Khanda-1 chapter: Adhyaya 1 uses the Chakra-Bandha; Adhyayas 2-8 use the
Navmank-Bandh with the default (identity) tile order. Both traversals and the number->
syllable rendering mirror decoder/src/bandha.ts and decoder/src/script.ts exactly; the
numeric output is verified against the TypeScript engine by __tests__/navmank.decode.test.ts,
which is the authoritative cross-check. This script only exists to regenerate the bulk
artifacts without a Node build.
"""
import argparse
import glob
import os
import re

# ---- number -> Kannada syllable (kannada_script in script.ts) ----
HAL = "್"
CHARS = {1:"ಅ",2:"ಆ",3:"ಆಾ",4:"ಇ",5:"ಈ",6:"ಈೀ",7:"ಉ",8:"ಊ",9:"ಊೂ",10:"ಋ",11:"ೠ",12:"ೠೄ",
13:"ಳ್",14:"ಳು",15:"ಳೂ",16:"ಎ",17:"ಏ",18:"ಏೋ",19:"ಐ",20:"ಐೖ",21:"ಐೖೖ",22:"ಒ",23:"ಓ",24:"ಓೋ",
25:"ಔ",26:"ಔೌ",27:"ಔೌೌ",28:"ಕ್",29:"ಖ್",30:"ಗ್",31:"ಘ್",32:"ಙ್",33:"ಚ್",34:"ಛ್",35:"ಜ್",36:"ಝ್",
37:"ಞ್",38:"ಟ್",39:"ಠ್",40:"ಡ್",41:"ಢ್",42:"ಣ್",43:"ತ್",44:"ಥ್",45:"ದ್",46:"ಧ್",47:"ನ್",48:"ಪ್",
49:"ಫ್",50:"ಬ್",51:"ಭ್",52:"ಮ್",53:"ಯ್",54:"ರ್",55:"ಲ್",56:"ವ್",57:"ಶ್",58:"ಷ್",59:"ಸ್",60:"ಹ್",
61:"ಂ",62:"ಃ",63:"...",64:"::"}
MATRAS = {1:"",2:"ಾ",3:"ಾಾ",4:"ಿ",5:"ೀ",6:"ೀೀ",7:"ು",8:"ೂ",9:"ೂೂ",10:"ೃ",11:"ೄ",12:"ೄೄ",
14:"ಳು",15:"ಳೂ",16:"ೆ",17:"ೇ",18:"ೇೇ",19:"ೈ",20:"ೈೈ",21:"ೈೈೈ",22:"ೊ",23:"ೋ",24:"ೋೋ",
25:"ೌ",26:"ೌೌ",27:"ೌೌೌ"}


def is_vowel(n): return (1 <= n <= 12) or (16 <= n <= 27)
def is_cons(n):  return (27 < n <= 60) or n == 13
def is_special(n): return 60 < n <= 64


def render(nums):
    out, can_matra = "", False
    for i, n in enumerate(nums):
        c = CHARS[n]
        if is_vowel(n) or n in (14, 15):
            c = MATRAS.get(n, CHARS[n]) if can_matra else CHARS[n]
            can_matra = False
        elif is_cons(n):
            if i != len(nums) - 1 and not is_cons(nums[i + 1]):
                c = c.replace(HAL, "")
            can_matra = True
        elif is_special(n):
            can_matra = False
        out += c
    return out


def siamese(size):
    """De-la-Loubère / Siamese walk; matches Bandha.fromKoshtakChintamani(size,1,1)."""
    seen, b, r, col = set(), [], 0, (size - 1) // 2
    for _ in range(size * size):
        b.append((r, col)); seen.add((r, col))
        nr, nc = (r - 1) % size, (col + 1) % size
        if (nr, nc) in seen:
            nr, nc = (r + 1) % size, col
        r, col = nr, nc
    return b


def chakra_bandha():
    return siamese(27)


def navmank_bandha():
    local = siamese(9)
    return [(t // 3 * 9 + i, t % 3 * 9 + j) for t in range(9) for (i, j) in local]


def read_grid(path):
    line = [l for l in open(path) if not l.startswith("#") and l.strip()][0]
    nums = [int(x) for x in line.strip().split(",")]
    return [nums[i * 27:(i + 1) * 27] for i in range(27)]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--data", required=True, help="decoder/data directory")
    args = ap.parse_args()
    cb, nv = chakra_bandha(), navmank_bandha()
    for a in range(2, 9):  # Adhyaya 1 outputs already ship in the repo
        chap = os.path.join(args.data, "chapters", str(a))
        if not os.path.isdir(chap):
            continue
        out_dir = os.path.join(args.data, "output", str(a))
        os.makedirs(out_dir, exist_ok=True)
        bandha = nv  # Navmank for Adhyaya 2-8
        md = [f"# Adhyaya {a} — Navmank-Bandh decode (Old Kannada)\n"]
        files = sorted(glob.glob(os.path.join(chap, "chakra_*.txt")),
                       key=lambda p: int(re.search(r"chakra_(\d+)", p).group(1)))
        for path in files:
            m = int(re.search(r"chakra_(\d+)", path).group(1))
            grid = read_grid(path)
            seq = [grid[i][j] for (i, j) in bandha]
            with open(os.path.join(out_dir, f"chakra_{m}.txt"), "w") as f:
                f.write(" ".join(map(str, seq)) + "\n")
            md.append(f"## Chakra 1.{a}.{m}\n\n{render(seq)}\n")
        with open(os.path.join(args.data, "output", f"decoded_kannada_adhyaya_{a}.md"), "w") as f:
            f.write("\n".join(md))
        print(f"  Adhyaya {a}: {len(files)} chakras decoded -> output/{a}/")


if __name__ == "__main__":
    main()
