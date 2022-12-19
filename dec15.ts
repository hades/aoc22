import { arrayDifference, union } from 'interval-operations';

import { ProblemOutput } from "./types";
import { Point, readAllLines } from "./util";

type Sensor = {
    position: Point,
    closestBeacon: Point,
}

// Parses a sensor definition, which is a line of the form:
//   Sensor at x=2, y=18: closest beacon is at x=-2, y=15
function parseSensor(line: string): Sensor {
    const match = line.match(/Sensor at x=([-0-9]+), y=([-0-9]+): closest beacon is at x=([-0-9]+), y=([-0-9]+)/);
    if (!match) {
        throw new Error('invalid beacon: ' + line);
    }
    return {
        position: [parseInt(match[1], 10), parseInt(match[2], 10)],
        closestBeacon: [parseInt(match[3], 10), parseInt(match[4], 10)],
    };
}

// Intersects the sensors's influence area (which is all points that are closer
// to the sensor than its beacon with Manhattan distance) with the given line
// y=y0. Returns the interval [x1, x2] of the intersection.
function intersect(sensor: Sensor, y0: number): [number, number]|null {
    const dy = Math.abs(y0 - sensor.position[1]);
    const db = Math.abs(sensor.position[1] - sensor.closestBeacon[1]) +
        Math.abs(sensor.position[0] - sensor.closestBeacon[0]);
    const interval: [number, number] = [
        sensor.position[0] - db + dy, sensor.position[0] + db - dy + 1];
    return interval[0] < interval[1] ? interval : null;
}

export async function dec15(input: NodeJS.ReadableStream): Promise<ProblemOutput> {
    const sensors = (await readAllLines(input)).map(parseSensor);
    const y0 = 2_000_000;
    const beaconsInY0 = sensors.filter((sensor) => sensor.closestBeacon[1] === y0)
            .map(sensor => sensor.closestBeacon[0]);
    const interval = union(...sensors.map((sensor) => intersect(sensor, y0))
            .flatMap((x) => x ? [x] : []));
    const intervalsWithoutBeacons = arrayDifference(
            interval,
            beaconsInY0.map((x) => [x, x + 1]));
    const sizeOfIntervals = intervalsWithoutBeacons.reduce((acc, [x1, x2]) => {
        return acc + (x2 as number) - (x1 as number)
    }, 0);
    let frequency = NaN;
    for (let y = 0; y < 4_000_000; y++) {
        const scannedInterval = union(...sensors.map((sensor) => intersect(sensor, y))
            .flatMap((x) => x ? [x] : []));
        const unscanned = arrayDifference([[0, 4_000_001]], scannedInterval);
        if (unscanned.length > 0) {
            frequency = (unscanned[0][0] as number) * 4_000_000 + y;
            break;
        }
    }
    return {
        firstStar: sizeOfIntervals.toString(),
        secondStar: frequency.toString(),
    };
}