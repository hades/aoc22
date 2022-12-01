import { ProblemOutput } from "./types";
import { readAllLines } from "./util";

function topThree(elfCapacities: number[]): number {
    return elfCapacities
        .sort((a, b) => a - b)
        .slice(-3)
        .reduce((sum, v) => sum + v, 0);
}

export async function dec01(input: NodeJS.ReadableStream): Promise<ProblemOutput> {
    const lines = await readAllLines(input);
    const elfCapacities: number[] = [0];
    for (const line of lines) {
        if (line === '') {
            elfCapacities.push(0);
        } else {
            elfCapacities[elfCapacities.length-1] += parseInt(line);
        }
    }
    return {
        firstStar: `${Math.max(...elfCapacities)}`,
        secondStar: `${topThree(elfCapacities)}`,
    };
}