import { ProblemOutput } from "./types";
import { readAllLines } from "./util";

const VALID_OPERATORS = ['+', '-', '*', '/'] as const;

type Operator = typeof VALID_OPERATORS[number];

type Operation = {
    operandA: string;
    operandB: string;
    operator: Operator;
}

type Monkey = {
    name: string;
    instruction: bigint|Operation;
}

// Parses a single definition of a monkey instructions, which is a single line of text.
// The line can be either:
//   dbpl: 5
// or
//   dbpl: humn - dvpt
function parseMonkey(line: string): Monkey {
    const [name, instruction] = line.split(': ');
    if (instruction.match(/^\d+$/)) {
        return {name, instruction: BigInt(instruction)};
    } else {
        const [operandA, operatorStr, operandB] = instruction.split(' ');
        const operator = operatorStr as Operator;
        if (!VALID_OPERATORS.includes(operator)) {
            throw new Error(`Invalid operator ${operator}`);
        }
        return {name, instruction: {operandA, operator, operandB}};
    }
}

function evaluateOperator(a: bigint, operator: Operator|'==', b: bigint): bigint {
    switch (operator) {
        case '+': return a + b;
        case '-': return a - b;
        case '*': return a * b;
        case '/': return a / b;
        case '==': return a === b ? 1n : 0n;
    }
}

// Evaluates the instruction for a single monkey.
function evaluateMonkey(monkey: Monkey, monkeys: Map<string, Monkey>): bigint {
    if (typeof monkey.instruction === 'bigint') {
        return monkey.instruction;
    }
    const {operandA, operator, operandB} = monkey.instruction;
    const a = evaluateMonkey(monkeys.get(operandA)!, monkeys);
    const b = evaluateMonkey(monkeys.get(operandB)!, monkeys);
    const result = evaluateOperator(a, operator, b);
    return result;
}

function simplifyMonkeys(monkey: Monkey, monkeys: Map<string, Monkey>): Monkey[] {
    if (monkey.name === 'humn') {
        return [monkey];
    }
    if (typeof monkey.instruction === 'bigint') {
        return [monkey];
    }
    const {operandA, operandB} = monkey.instruction;
    const a = simplifyMonkeys(monkeys.get(operandA)!, monkeys);
    const b = simplifyMonkeys(monkeys.get(operandB)!, monkeys);
    const operator = monkey.name === 'root' ? '==' : monkey.instruction.operator;
    if (a[0].name === 'humn' || b[0].name === 'humn') {
        const [human, nonHuman] = a[0].name === 'humn' ? [a, b] : [b, a];
        if (nonHuman.length !== 1) {
            throw new Error('Expected nonHuman to be a single monkey');
        }
        return [...human, ...nonHuman, monkey];
    }
    if (a.length === 1 && b.length === 1 &&
        typeof a[0].instruction === 'bigint' && typeof b[0].instruction === 'bigint') {
        return [{
            name: monkey.name,
            instruction: evaluateOperator(a[0].instruction, operator, b[0].instruction),
        }];
    }
    throw new Error('Unable to simplify');
}

function reverseDivision(result: bigint[], denominator: bigint): bigint[] {
    if (denominator <= 0n) {
        throw new Error(`Invalid denominator ${denominator}`);
    }
    const candidates: Set<bigint> = new Set(); 
    for (const r of result) {
        for (let i = 0n; i < denominator; i++) {
            candidates.add(r * denominator + i);
        }
    }
    return [...candidates];
}

function reverseMultiplication(result: bigint[], factors: bigint[]): bigint[] {
    const candidates: Set<bigint> = new Set();
    for (const r of result) {
        for (const f of factors) {
            if (r % f === 0n) {
                candidates.add(r / f);
            }
        }
    }
    return [...candidates];
}

function solveMonkey(monkey: Monkey, monkeys: Map<string, Monkey>, goal: bigint[]): bigint[] {
    if (monkey.name === 'humn') {
        return goal;
    }
    if (typeof monkey.instruction === 'bigint') {
        throw new Error('unable to solve monkey');
    }
    const {operandA, operandB} = monkey.instruction;
    const operator = monkey.name === 'root' ? '==' : monkey.instruction.operator;
    const [monkeyA, monkeyB] = [monkeys.get(operandA)!, monkeys.get(operandB)!];
    if (typeof monkeyA.instruction !== 'bigint' || monkeyA.name === 'humn') {
        const [solvable, immediate] = [monkeyA, monkeyB];
        if (typeof immediate.instruction !== 'bigint') {
            throw new Error('unable to solve monkey');
        }
        switch (operator) {
            case '+': return solveMonkey(solvable, monkeys, goal.map(g => g - (immediate.instruction as bigint)));
            case '-': return solveMonkey(solvable, monkeys, goal.map(g => g + (immediate.instruction as bigint)));
            case '*': return solveMonkey(solvable, monkeys, reverseMultiplication(goal, [immediate.instruction as bigint]));
            case '/': return solveMonkey(solvable, monkeys, reverseDivision(goal, immediate.instruction as bigint));
            case '==': return solveMonkey(solvable, monkeys, [immediate.instruction]);
        }
    } else {
        const [solvable, immediate] = (typeof monkeyA.instruction !== 'bigint' || monkeyA.name === 'humn') ? [monkeyA, monkeyB] : [monkeyB, monkeyA];
        if (typeof immediate.instruction !== 'bigint') {
            throw new Error('unable to solve monkey');
        }
        switch (operator) {
            case '+': return solveMonkey(solvable, monkeys, goal.map(g => g - (immediate.instruction as bigint)));
            case '-': return solveMonkey(solvable, monkeys, goal.map(g => (immediate.instruction as bigint) - g));
            case '*': return solveMonkey(solvable, monkeys, reverseMultiplication(goal, [immediate.instruction as bigint]));
            case '/': return solveMonkey(solvable, monkeys, reverseMultiplication([immediate.instruction as bigint], goal));
            case '==': return solveMonkey(solvable, monkeys, [immediate.instruction]);
        }
    }
}

export async function dec21(input: NodeJS.ReadableStream): Promise<ProblemOutput> {
    const monkeys: Map<string, Monkey> = new Map();
    for await (const line of await readAllLines(input)) {
        const monkey = parseMonkey(line);
        monkeys.set(monkey.name, monkey);
    }
    const firstStarValue = evaluateMonkey(monkeys.get('root')!, monkeys);
    const simplifiedMonkeys = simplifyMonkeys(monkeys.get('root')!, monkeys);
    const simplifiedMonkeysMap = new Map(simplifiedMonkeys.map(m => [m.name, m]));
    const solutionStar2 = solveMonkey(monkeys.get('root')!, simplifiedMonkeysMap, []).filter((candidate) => {
        simplifiedMonkeysMap.get('humn')!.instruction = candidate;
        const leftMonkey = simplifiedMonkeysMap.get((monkeys.get('root')!.instruction as Operation).operandA)!;
        const rightMonkey = simplifiedMonkeysMap.get((monkeys.get('root')!.instruction as Operation).operandB)!;
        return evaluateMonkey(leftMonkey, simplifiedMonkeysMap) === evaluateMonkey(rightMonkey, simplifiedMonkeysMap);
    })[0];
    return {
        firstStar: firstStarValue.toString(),
        secondStar: solutionStar2.toString(),
    };
}