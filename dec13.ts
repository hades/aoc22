import { ProblemOutput } from "./types";
import { readAllLines } from "./util";

function* splitIntoThrees<T>(arr: T[]): Generator<[T, T, T], void, void> {
    for (let i = 0; i < arr.length; i += 3) {
        yield [arr[i], arr[i + 1], arr[i + 2]];
    }
}

type Entry = number|Entry[];

function compare(a: string, b: string): number;
function compare(a: Entry, b: Entry): number;
function compare(a: Entry|string, b: Entry|string): number {
    if (typeof a === 'string' || typeof b === 'string') {
        if (!(typeof a === 'string' && typeof b === 'string')) {
            throw new Error('invalid comparison');
        }
        return compare(JSON.parse(a), JSON.parse(b));
    }
    if (typeof a === 'number' && typeof b === 'number') {
        return a - b;
    }
    if (typeof a === 'number') {
        return compare([a], b);
    }
    if (typeof b === 'number') {
        return compare(a, [b]);
    }
    for (let i = 0; i < Math.min(a.length, b.length); i++) {
        const result = compare(a[i], b[i]);
        if (result !== 0) {
            return result;
        }
    }
    return a.length - b.length;
}

const DIVIDERS = ["[[2]]", "[[6]]"];

export async function dec13(input: NodeJS.ReadableStream): Promise<ProblemOutput> {
    let index = 1;
    const inRightOrder: number[] = [];
    const lines = await readAllLines(input);
    for (const [packet1, packet2] of splitIntoThrees(lines)) {
        if (compare(packet1, packet2) <= 0) {
            inRightOrder.push(index);
        }
        index++;
    }
    const sumOfIndices = inRightOrder.reduce((a, b) => a + b, 0);
    const packets = [...lines.filter((line) => line.length > 0), ...DIVIDERS];
    packets.sort(compare);
    let decoderKey = 1;
    for (const [index, packet] of packets.entries()) {
        if (DIVIDERS.includes(packet)) {
            decoderKey *= (index + 1);
        }
    }
    return {
        firstStar: sumOfIndices.toString(),
        secondStar: decoderKey.toString(),
    }
}