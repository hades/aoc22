import { ProblemOutput } from "./types";
import { feedLinesToGenerator } from "./util";

type Monkey = {
    items: bigint[];
    operation: (x: bigint) => bigint;
    nextMonkey: (x: bigint) => number;
    business: number;
    factor: bigint;
}

// Parses the input lines into a list of monkey definitions. Monkeys are
// separated in the input line with one blank line. The text descriptions are
// parse using regular expressions.
function* parseMonkeys(): Generator<undefined, Monkey[], string | null> {
    let line: string | null = null;
    let monkeys: Monkey[] = [];
    while ((line = yield) !== null) {
        if (line === "") {
            continue;
        }
        if (line !== `Monkey ${monkeys.length}:`) {
            throw new Error(`Expected "Monkey ${monkeys.length}:" but got "${line}"`);
        }
        line = yield;
        const itemsParsed = /Starting items: (.*)/.exec(line!);
        if (!itemsParsed) {
            throw new Error(`Expected "Starting items: ..." but got "${line}"`);
        }
        line = yield;
        const operationParsed = /Operation: new = ([^ ]+) (.) ([^ ]+)/.exec(line!);
        if (!operationParsed) {
            throw new Error(`Expected "Operation: new = ..." but got "${line}"`);
        }
        line = yield;
        const conditionParsed = /Test: divisible by (.*)/.exec(line!);
        if (!conditionParsed) {
            throw new Error(`Expected "Test: divisible by ..." but got "${line}"`);
        }
        line = yield;
        const trueOutcomeParsed = /If true: throw to monkey (.*)/.exec(line!);
        if (!trueOutcomeParsed) {
            throw new Error(`Expected "If true: throw to monkey ..." but got "${line}"`);
        }
        line = yield;
        const falseOutcomeParsed = /If false: throw to monkey (.*)/.exec(line!);
        if (!falseOutcomeParsed) {
            throw new Error(`Expected "If false: throw to monkey ..." but got "${line}"`);
        }
        const operandADefinition = (operationParsed[1] === "old") ? null : BigInt(operationParsed[1]);
        const operandBDefinition = (operationParsed[3] === "old") ? null : BigInt(operationParsed[3]);
        const conditionDivisor = BigInt(conditionParsed[1]);
        const trueMonkey = parseInt(trueOutcomeParsed[1]);
        const falseMonkey = parseInt(falseOutcomeParsed[1]);
        monkeys.push({
            items: itemsParsed[1].split(", ").map(x => BigInt(x)),
            operation: (x: bigint) => {
                const operandA = (operandADefinition === null) ? x : operandADefinition;
                const operandB = (operandBDefinition === null) ? x : operandBDefinition;
                if (operationParsed[2] === "+") {
                    return operandA + operandB;
                } else if (operationParsed[2] === "*") {
                    return operandA * operandB;
                } else {
                    throw new Error(`Unrecognized operator: ${operationParsed[2]}`);
                }
            },
            nextMonkey: (x: bigint) => {
                if (x % conditionDivisor === 0n) {
                    return trueMonkey;
                } else {
                    return falseMonkey;
                }
            },
            business: 0,
            factor: conditionDivisor,
        });
    }
    return monkeys;
}
    
function simulateMonkeys(monkeys: Monkey[], rounds: number, worryAttenuation: bigint, factor: bigint): void {
    for (let round = 0; round < rounds; round++) {
        for (const monkey of monkeys) {
            for (const itemWorryLevel of monkey.items) {
                let postInspection = monkey.operation(itemWorryLevel);
                postInspection = postInspection / worryAttenuation;
                postInspection = postInspection % factor;
                monkeys[monkey.nextMonkey(postInspection)].items.push(postInspection);
                monkey.business++;
            }
            monkey.items = [];
        }
    }
}

function copyMonkeys(monkeys: Monkey[]): Monkey[] {
    return monkeys.map(monkey => ({
        items: [...monkey.items],
        operation: monkey.operation,
        nextMonkey: monkey.nextMonkey,
        business: monkey.business,
        factor: monkey.factor,
    }));
}

export async function dec11(input: NodeJS.ReadableStream): Promise<ProblemOutput> {
    const monkeyParser = parseMonkeys();
    const monkeys = await feedLinesToGenerator(monkeyParser, input);
    const monkeysStarTwo = copyMonkeys(monkeys);
    const factor = monkeys.map(monkey => monkey.factor).reduce((a, b) => a * b, 1n);
    simulateMonkeys(monkeys, 20, 3n, factor);
    simulateMonkeys(monkeysStarTwo, 10_000, 1n, factor);
    monkeys.sort((a, b) => b.business - a.business);
    monkeysStarTwo.sort((a, b) => b.business - a.business);
    return {
        firstStar: (monkeys[0].business * monkeys[1].business).toString(),
        secondStar: (monkeysStarTwo[0].business * monkeysStarTwo[1].business).toString(),
    };
}