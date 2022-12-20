import { ProblemOutput } from "./types";
import { Coords3, Coords3Set, readAllLines } from "./util";

// Split the line into three integers.
function parseLine(line: string): Coords3 {
    const match = line.match(/^(\d+),(\d+),(\d+)$/);
    if (!match) {
        throw new Error('invalid line: ' + line);
    }
    return {
        x: parseInt(match[1], 10),
        y: parseInt(match[2], 10),
        z: parseInt(match[3], 10),
    }
}

type Body = {
    listOfBlocks: readonly Coords3[],
    setOfBlocks: Coords3Set,
}

function surfaceArea(body: Body): number {
    let surfaceArea = 0;
    for (const {x, y, z} of body.listOfBlocks) {
        for (const [dx, dy, dz] of [
            [0, 1, 0], [1, 0, 0], [0, 0, 1],
            [0, -1, 0], [-1, 0, 0], [0, 0, -1],
        ]) {
            const neighbour = {
                x: x + dx,
                y: y + dy,
                z: z + dz,
            }
            if (!body.setOfBlocks.has(neighbour)) {
                surfaceArea += 1;
            }
        }
    }
    return surfaceArea;
}

export async function dec18(input: NodeJS.ReadableStream): Promise<ProblemOutput> {
    const lines = await readAllLines(input);
    const data = lines.map(parseLine);
    const body = {
        listOfBlocks: data,
        setOfBlocks: new Coords3Set(),
    }
    body.listOfBlocks.forEach((coords) => body.setOfBlocks.add(coords));
    const xRange = [Math.min(...data.map(({x}) => x)), Math.max(...data.map(({x}) => x))];
    const yRange = [Math.min(...data.map(({y}) => y)), Math.max(...data.map(({y}) => y))];
    const zRange = [Math.min(...data.map(({z}) => z)), Math.max(...data.map(({z}) => z))];
    const setOfOutsideBlocks = new Coords3Set();
    const queue = [{x: xRange[0] - 1, y: yRange[0] - 1, z: zRange[0] - 1}];
    while (queue.length > 0) {
        const {x, y, z} = queue.pop()!;
        setOfOutsideBlocks.add({x, y, z});
        if (x < xRange[0] - 1 || x > xRange[1] + 1 ||
            y < yRange[0] - 1 || y > yRange[1] + 1 ||
            z < zRange[0] - 1 || z > zRange[1] + 1) {
            continue;
        }
        for (const [dx, dy, dz] of [
            [0, 1, 0], [1, 0, 0], [0, 0, 1],
            [0, -1, 0], [-1, 0, 0], [0, 0, -1],
        ]) {
            const next = {x: x + dx, y: y + dy, z: z + dz};
            if (setOfOutsideBlocks.has(next)) {
                continue;
            }
            if (body.setOfBlocks.has(next)) {
                continue;
            }
            queue.push(next);
        }
    }
    const blocksWithBodyFilled = body.listOfBlocks;
    for (let x = xRange[0]; x <= xRange[1]; x += 1) {
        for (let y = yRange[0]; y <= yRange[1]; y += 1) {
            for (let z = zRange[0]; z <= zRange[1]; z += 1) {
                const coords = {x, y, z};
                if (setOfOutsideBlocks.has(coords)) {
                    continue;
                }
                if (body.setOfBlocks.has(coords)) {
                    continue;
                }
                blocksWithBodyFilled.push(coords);
            }
        }
    }
    const bodyFilled = {
        listOfBlocks: blocksWithBodyFilled,
        setOfBlocks: new Coords3Set(),
    }
    bodyFilled.listOfBlocks.forEach((coords) => bodyFilled.setOfBlocks.add(coords));
    return {
        firstStar: surfaceArea(body).toString(),
        secondStar: surfaceArea(bodyFilled).toString(),
    }
}