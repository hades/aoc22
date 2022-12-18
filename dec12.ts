import { ProblemOutput } from "./types";
import { CoordsSet, Matrix, parseMatrix } from "./util";

function shortestDistance(
        matrix: Matrix, startPositions: readonly [number, number][],
        endPosition: readonly [number, number]): number {
    const stepsToAchieve = matrix.copy();
    stepsToAchieve.fill(Infinity);
    startPositions.forEach((position) => stepsToAchieve.set(position, 0));
    for (let stepCount = 0; stepsToAchieve.get(endPosition) === Infinity; stepCount++) {
        const steps = stepsToAchieve.keysWhere((value) => value === stepCount);
        for (const [row, col] of stepsToAchieve.keysWhere((value) => value === stepCount)) {
            for (const [drow, dcol] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
                const target = [row + drow, col + dcol] as const;
                const destElevation = matrix.get(target);
                if (destElevation === undefined) {
                    continue;
                }
                if (destElevation > matrix.get([row, col])! + 1) {
                    continue;
                }
                if (stepsToAchieve.get(target)! > stepCount + 1) {
                    stepsToAchieve.set(target, stepCount + 1);
                }
            }
        }
    }
    return stepsToAchieve.get(endPosition)!;
}

export async function dec12(input: NodeJS.ReadableStream): Promise<ProblemOutput> {
    const positions: {
        start?: [number, number],
        end?: [number, number],
    } = {};
    const matrix = await parseMatrix(input, (char, coords) => {
        if (char === 'S') {
            positions.start = coords;
            return 0;
        }
        if (char === 'E') {
            positions.end = coords;
            return 25;
        }
        return char.charCodeAt(0) - 'a'.charCodeAt(0);
    });
    return {
        firstStar: shortestDistance(matrix, [positions.start!], positions.end!).toString() ?? 'error',
        secondStar: shortestDistance(matrix, matrix.keysWhere(
            (value) => value === 0), positions.end!).toString() ?? 'error',
    }
}