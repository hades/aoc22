import { ProblemOutput } from "./types";
import { readAllLines } from "./util";

function mod(nominator: number, denominator: number) {
    if (nominator < 0) {
        nominator += (Math.floor(Math.abs(nominator) / denominator) + 1) * denominator;
    }
    return nominator % denominator;
}

function decrypt(array: number[], iterations: number = 1): number {
    const indexMap: number[] = [...new Array(array.length).keys()];
    for (let i = 0; i < iterations; i++) {
        for (let i = 0; i < array.length; i++) {
            const number = array[i];
            const positionInNewArray = indexMap.indexOf(i);
            const newPosition = mod(positionInNewArray + number, array.length - 1);
            if (newPosition === positionInNewArray) {
                continue;
            }
            indexMap.splice(positionInNewArray, 1);
            indexMap.splice(newPosition, 0, i);
        }
    }
    const indexOfZero = indexMap.indexOf(array.indexOf(0));
    const valueAt1k = array[indexMap[mod(indexOfZero + 1_000, array.length)]];
    const valueAt2k = array[indexMap[mod(indexOfZero + 2_000, array.length)]];
    const valueAt3k = array[indexMap[mod(indexOfZero + 3_000, array.length)]];
    return valueAt1k + valueAt2k + valueAt3k;
}

export async function dec20(input: NodeJS.ReadableStream): Promise<ProblemOutput> {
    const array: number[] = (await readAllLines(input)).map((l) => parseInt(l, 10));
    return {
        firstStar: decrypt(array).toString(),
        secondStar: decrypt(array.map((n) => n * 811_589_153), 10).toString(),
    };
}
