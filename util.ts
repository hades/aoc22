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