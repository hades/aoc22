import { ProblemOutput } from "./types";
import { readAllLines } from "./util";

// Parses two ranges of integers from the provided line of text using a regex.
// The first range is expected to be separated from the second range by a comma.
function parseLine(line: string): [number, number][] {
    const regex = /(\d+)-(\d+)/g;
    const matches = [...line.matchAll(regex)];
    return matches.map((match) => [parseInt(match[1]), parseInt(match[2])]);
}

// Returns true if the first range is a strict subrange of the second range or
// the other way around.
function isStrictSubrange(range1: [number, number], range2: [number, number]): boolean {
    return (range1[0] >= range2[0] && range1[1] <= range2[1]) ||
        (range1[0] <= range2[0] && range1[1] >= range2[1]);
}

// Returns true if the two ranges overlap.
function isOverlap(range1: [number, number], range2: [number, number]): boolean {
    return range1[0] <= range2[1] && range2[0] <= range1[1];
}

export async function dec04(input: NodeJS.ReadableStream): Promise<ProblemOutput> {
    const lines = await readAllLines(input);
    const pairsOfRanges = lines.map(parseLine);
    let countOfSubranges = 0;
    let countOfOverlaps = 0;
    for (const [range1, range2] of pairsOfRanges) {
        if (isStrictSubrange(range1, range2)) {
            countOfSubranges++;
        }
        if (isOverlap(range1, range2)) {
            countOfOverlaps++;
        }
    }
    return {
        firstStar: countOfSubranges.toString(),
        secondStar: countOfOverlaps.toString(),
    };
}