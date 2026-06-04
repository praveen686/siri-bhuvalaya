/*
Copyright (C) 2025 Aruhant Mehta
This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, version 3.
This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
*/
import { assert } from 'console';
import { Chakra } from './chakra.js';
import { Sequence, Transposed } from './sequence.js';
import fs from 'fs';
import { Logger } from './utils/logger.js';
export class Bandha {
    private bandha: { i: number, j: number }[];
    private size: number;

    constructor(bandha: { i: number, j: number }[]) {
        this.bandha = bandha;
        this.size = Math.sqrt(bandha.length);
        if (this.size % 1 !== 0) {
            Logger.warn(`Bandha size ${this.size} is not a perfect square`);
        }
        for (const { i, j } of bandha) {
            if (i < 0 || i >= this.size || j < 0 || j >= this.size) {
                Logger.warn(`Bandha has unconvential indices: ${i}, ${j}`);
            }
        }
    }

    apply(chakra: Chakra): Transposed {
        if (chakra.getSize() - this.size != 0) {
            Logger.info(this.size.toString());
            Logger.info(chakra.getSize().toString());
            Logger.warn(`Bandha size ${this.size} does not match chakra size ${chakra.getSize()}`);
        }
        const result: Transposed = new Sequence('');
        this.bandha.forEach((unit) => {
            result.append(chakra.getUnit(unit.i, unit.j));
        });
        return result;
    }

    // method to convert this form of bandha (sequence of i,j pairs) to a 2D array of numbers
    to2DArray1base(): number[][] {
        let result: number[][] = Array.from({ length: this.size }, () => Array(this.size).fill(0));
        this.bandha.forEach((element, index) => {
            result[element.i][element.j] = index + 1;
        });
        return result;
    }

    toStringAs2DArray() {
        let as2DArray = this.to2DArray1base();
        let result = '';
        as2DArray.forEach(row => {
            row.forEach(value => {
                result += `${value}`.padStart((this.size * this.size + 1).toString().length)
            });
            result += '\n';
        });
        return result;
    }
    toString(delimiter: string = '\n'): string {
        return this.bandha.map(({ i, j }) => `${i},${j}`).join(delimiter);
    }

    get() {
        return this.bandha;
    }
    // Siamese / De-la-Loubère diagonal weave: start at the top-middle cell, step
    // (up, right) each time, and on collision drop straight down one row. With
    // (size=27, up=1, right=1) this reproduces the manuscript's Chakra-Bandha exactly
    // (verified 729/729 against data/chakra_bandha.txt).
    static fromKoshtakChintamani(size: number, up: number, right: number) {
        const bandha: { i: number, j: number }[] = [];
        const seen = new Set<string>();
        let row = 0;
        let col = (size - 1) / 2;
        for (let i = 0; i < size * size; i++) {
            bandha.push({ i: row, j: col });
            seen.add(`${row},${col}`);
            let nextRow = ((row - up) % size + size) % size;
            let nextCol = ((col + right) % size + size) % size;
            // if the cell is already filled, move one row down (same column)
            if (seen.has(`${nextRow},${nextCol}`)) {
                nextRow = (row + 1) % size;
                nextCol = col;
            }
            row = nextRow;
            col = nextCol;
        }
        return new Bandha(bandha);
    }

    // The Chakra-Bandha: the full-grid Siamese traversal used for the first Chakra.
    static chakraBandha(size: number = 27, up: number = 1, right: number = 1): Bandha {
        return Bandha.fromKoshtakChintamani(size, up, right);
    }

    // The Navmank (Navmaank) Bandha: partition the gridSize x gridSize Chakra into
    // (gridSize/tileSize)^2 square "UpChakra" sub-matrices, visit those tiles in
    // `tileOrder` (default row-major across the 3x3 arrangement), and traverse each
    // tile with the same Siamese walk as the Chakra-Bandha. Documented as applying to
    // Adhyayas 2-8, each Adhyaya using a different tile sequence; the per-Adhyaya
    // sequences are not publicly attested, so the order is parameterised rather than
    // hard-coded. Returns a valid bijection over all gridSize^2 cells.
    static navmankBandha(
        gridSize: number = 27,
        tileSize: number = 9,
        tileOrder?: number[],
        up: number = 1,
        right: number = 1
    ): Bandha {
        if (gridSize % tileSize !== 0) {
            Logger.warn(`Navmank: gridSize ${gridSize} is not divisible by tileSize ${tileSize}`);
        }
        const tilesPerSide = Math.floor(gridSize / tileSize);
        const tileCount = tilesPerSide * tilesPerSide;
        const order = tileOrder ?? Array.from({ length: tileCount }, (_, i) => i);
        if (order.length !== tileCount || new Set(order).size !== tileCount ||
            order.some(t => t < 0 || t >= tileCount)) {
            Logger.warn(`Navmank: tileOrder must be a permutation of 0..${tileCount - 1}`);
        }
        // one local UpChakra traversal, reused for every tile
        const local = Bandha.fromKoshtakChintamani(tileSize, up, right).get();
        const bandha: { i: number, j: number }[] = [];
        for (const tile of order) {
            const tileRow = Math.floor(tile / tilesPerSide);
            const tileCol = tile % tilesPerSide;
            const offsetRow = tileRow * tileSize;
            const offsetCol = tileCol * tileSize;
            for (const { i, j } of local) {
                bandha.push({ i: offsetRow + i, j: offsetCol + j });
            }
        }
        return new Bandha(bandha);
    }
}


export class BandhaFile {
    static readPairSeperatedBandha(filename: string): Bandha {
        const bandha = fs.readFileSync(filename, 'utf8')
            .trim()
            .split('\n')
            .filter(line => line.trim() != '' && line.length > 0 && !line.startsWith('#'))
            .map(line => {
                const [i, j] = line.split(',').map(Number);
                return { i, j };
            });
        return new Bandha(bandha);
    }

    static writePairSeperatedBandha(filename: string, bandha: Bandha
    ) {
        fs.writeFileSync(filename, bandha.toString());
    }
}

