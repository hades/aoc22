import { ProblemOutput } from "./types";
import { readAllLines } from "./util";

function findNUniqueChars(str: string, n: number): number {
    for (let i = n; i <= str.length; ++i) {
        const substr = str.slice(i-n, i);
        if (new Set(substr).size === n) {
            return i;
        }
    }
    throw new Error(`no ${n} unique characters found`);
}

function findFourUniqueChars(str: string): number {
    return findNUniqueChars(str, 4);
}

export async function dec06(input: NodeJS.ReadableStream): Promise<ProblemOutput> {
    const line = (await readAllLines(input))[0];
    return {
        firstStar: findFourUniqueChars(line).toString(),
        secondStar: findNUniqueChars(line, 14).toString(),
     };
}