import { createInterface } from "node:readline/promises";

export async function readAllLines(input: NodeJS.ReadableStream): Promise<string[]> {
    const iface = createInterface(input);
    const result: string[] = [];
    for await (const line of iface) {
        result.push(line);
    }
    return result;
}

export async function feedLinesToGenerator<R>(
        generator: Generator<undefined, R, string | null>,
        input: NodeJS.ReadableStream): Promise<R> {
    const iface = createInterface(input);
    generator.next();
    for await (const line of iface) {
        generator.next(line);
    }
    const result = generator.next(null).value;
    if (result === undefined) {
        throw new Error('generator did not return a result');
    }
    return result;
}

function rowColKey(row: number, col: number): string {
    return `${row},${col}`;
}

export class Matrix {
    constructor(
        private readonly data: Map<string, number>,
        readonly height: number,
        readonly width: number) {}

    get(coords: readonly [number, number]) {
        return this.data.get(rowColKey(...coords));
    }

    set(coords: readonly [number, number], value: number) {
        this.data.set(rowColKey(...coords), value);
    }

    copy(): Matrix {
        return new Matrix(new Map(this.data), this.height, this.width);
    }

    fill(value: number) {
        for (let row = 0; row < this.height; row++) {
            for (let col = 0; col < this.width; col++) {
                this.data.set(rowColKey(row, col), value);
            }
        }
    }

    keysWhere(predicate: (value: number) => boolean): [number, number][]{
        const result: [number, number][] = [];
        for (let row = 0; row < this.height; row++) {
            for (let col = 0; col < this.width; col++) {
                const value = this.data.get(rowColKey(row, col));
                if (value !== undefined && predicate(value)) {
                    result.push([row, col]);
                }
            }
        }
        return result;
    }

    toJson(): number[][] {
        const result: number[][] = [];
        for (let row = 0; row < this.height; row++) {
            const rowResult: number[] = [];
            for (let col = 0; col < this.width; col++) {
                rowResult.push(this.data.get(rowColKey(row, col))!);
            }
            result.push(rowResult);
        }
        return result;
    }
};
    
// Parses a block of characters into a matrix of numbers, where each character
// is mapped to a number using the provided function.
export async function parseMatrix(
        input: NodeJS.ReadableStream,
        mapFn: (char: string, coords: [number, number]) => number): Promise<Matrix> {
    const data: Map<string, number> = new Map();
    let row = 0;
    let width = 0;
    for (const line of await readAllLines(input)) {
        let col = 0;
        for (const char of line) {
            data.set(rowColKey(row, col), mapFn(char, [row, col]));
            col++;
        }
        row++;
        width = col;
    }
    return new Matrix(data, row, width);
}

export type Coords = { x: number; y: number };

export class ObjectSet<T> {
  private set: Set<string> = new Set();

  constructor(private readonly keyFunc: (obj: T) => string) {}

  add(obj: T) {
    this.set.add(this.keyFunc(obj));
  }

  has(obj: T) {
    return this.set.has(this.keyFunc(obj));
  }

  get size() {
    return this.set.size;
  }
}

export class CoordsSet extends ObjectSet<Coords> {
  constructor() {
    super((coords) => `${coords.x},${coords.y}`);
  }
} 
