import { ProblemOutput } from "./types";
import { feedLinesToGenerator } from "./util";

// Group the string into substrings of four characters. Returns a generator of
// four-character substrings.
function* groupByThree(str: string): Generator<string> {
    for (let i = 0; i < str.length; i += 4) {
        yield str.substring(i, i + 4);
    }
}

// Parses a single line of input into lists of container identifiers in each
// stack on the given level.
function parseStackLine(line: string): (string|undefined)[] {
    let stackIdx = 0;
    const stackLevel: string[] = [];
    for (const group of groupByThree(line)) {
        if (group[1] != ' ') {
            stackLevel[stackIdx] = group[1];
        }
        stackIdx++;
    }
    return stackLevel;
}

interface MoveCommand {
    itemCount: number;
    sourceStack: number;
    destinationStack: number;
}

function parseMoveCommand(line: string): MoveCommand {
    const parts = line.split(' ');
    return {
        itemCount: parseInt(parts[1]),
        sourceStack: parseInt(parts[3]),
        destinationStack: parseInt(parts[5]),
    };
}

function* processLines(): Generator<undefined, ProblemOutput, string|null> {
    const stacks: string[][] = [];
    for (let line = yield; line; line = yield) {
        // Skip the line with the stack numbers.
        if (/^[ 0-9]*$/.test(line)) {
            continue;
        }
        const stackLevel = parseStackLine(line);
        for (const [stackIdx, container] of stackLevel.entries()) {
            if (!container) {
                continue;
            }
            if (!stacks[stackIdx]) {
                stacks[stackIdx] = [];
            }
            stacks[stackIdx].push(container);
        }
    }
    const stacks9001 = structuredClone(stacks);
    for (let line = yield; line; line = yield) {
        const moveCommand = parseMoveCommand(line);
        const containersToMove = stacks[moveCommand.sourceStack-1].splice(0, moveCommand.itemCount);
        containersToMove.reverse();
        stacks[moveCommand.destinationStack-1].unshift(...containersToMove);
        const containersToMove9001 = stacks9001[moveCommand.sourceStack-1].splice(0, moveCommand.itemCount);
        stacks9001[moveCommand.destinationStack-1].unshift(...containersToMove9001);
    }
    return {
        firstStar: stacks.map((stack) => stack[0]).join(''),
        secondStar: stacks9001.map((stack) => stack[0]).join(''),
    };
}

export async function dec05(input: NodeJS.ReadableStream): Promise<ProblemOutput> {
    const solver = processLines();
    return await feedLinesToGenerator(solver, input);
}