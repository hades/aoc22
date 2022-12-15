import { ProblemOutput } from "./types";
import { readAllLines } from "./util";

function priorityOf(char: string): number {
    let priority = char.charCodeAt(0) - 'a'.charCodeAt(0);
    if (priority >= 0 && priority <= 25) {
        return priority + 1;
    }
    priority = char.charCodeAt(0) - 'A'.charCodeAt(0);
    return priority + 27;
}

function* groupInThrees(lines: string[]): Generator<string[], void, void> {
    for (let i = 0; i < lines.length; i += 3) {
        yield [lines[i], lines[i+1], lines[i+2]];
    }
}

export async function dec03(input: NodeJS.ReadableStream): Promise<ProblemOutput> {
    const lines = await readAllLines(input);
    let priorityStar1 = 0;
    let priorityStar2 = 0;
    for (const line of lines) {
        const leftCompartment = new Set(line.slice(0, line.length / 2));
        const rightCompartment = new Set(line.slice(line.length / 2));
        const intersection = new Set([...leftCompartment].filter(x => rightCompartment.has(x)));
        priorityStar1 += priorityOf([...intersection][0]);
    }
    for (const group of groupInThrees(lines)) {
        const sets = group.map((line) => new Set(line));
        const intersection = new Set([...sets[0]].filter(x => sets[1].has(x) && sets[2].has(x)));
        priorityStar2 += priorityOf([...intersection][0]);
    }
    return {
        firstStar: priorityStar1.toString(),
        secondStar: priorityStar2.toString(),
    };
}