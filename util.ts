import { createInterface } from "node:readline/promises";

export async function readAllLines(input: NodeJS.ReadableStream): Promise<string[]> {
    const iface = createInterface(input);
    const result: string[] = [];
    for await (const line of iface) {
        result.push(line);
    }
    return result;
}