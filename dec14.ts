import { ProblemOutput } from "./types";
import { Point, PointSet, readAllLines } from "./util";

type Segment = [Point, Point];

// Parses the line of input into a collection of segments. For example, the following
// line:
//   498,4 -> 498,6 -> 496,6
// produces the following segments:
//  [[498, 4], [498, 6]], [[498, 6], [496, 6]]
function parseLineOfSegments(line: string): Segment[] {
    const segments: Segment[] = [];
    const points = line.split(' -> ')
        .map((point) => point.split(',').map((n) => parseInt(n, 10)) as Point);
    for (let i = 0; i < points.length - 1; i++) {
        segments.push([points[i], points[i + 1]]);
    }
    return segments;
}

class SegmentSet {
    private readonly segmentsX: Map<number, Segment[]> = new Map();
    private readonly segmentsY: Map<number, Segment[]> = new Map();

    add(segment: Segment) {
        if (segment[0][0] === segment[1][0]) {
            const segments = this.segmentsX.get(segment[0][0]) || [];
            segments.push(segment);
            this.segmentsX.set(segment[0][0], segments);
        } else if (segment[0][1] === segment[1][1]) {
            const segments = this.segmentsY.get(segment[0][1]) || [];
            segments.push(segment);
            this.segmentsY.set(segment[0][1], segments);
        } else {
            throw new Error('invalid segment: ' + segment);
        }
    }

    // Checks if the provided point lies on a segment.
    private pointOnSegment(point: Point, segment: Segment): boolean {
        const [x, y] = point;
        const [[x1, y1], [x2, y2]] = segment;
        if (x1 === x2 && x === x1) {
            return y1 <= y && y <= y2 || y2 <= y && y <= y1;
        }
        if (y1 === y2 && y === y1) {
            return x1 <= x && x <= x2 || x2 <= x && x <= x1;
        }
        return false;
    }

    has(point: Point): boolean {
        for (const segment of this.segmentsX.get(point[0]) || []) {
            if (this.pointOnSegment(point, segment)) {
                return true;
            }
        }
        for (const segment of this.segmentsY.get(point[1]) || []) {
            if (this.pointOnSegment(point, segment)) {
                return true;
            }
        }
        return false;
    }
}

function findFirstFree(segments: SegmentSet, sandBlocks: PointSet, ...points: Point[]): Point|null {
    for (const point of points) {
        if (!segments.has(point) && !sandBlocks.has(point)) {
            return point;
        }
    }
    return null;
}

function findLeftMostPointOfSegments(segments: Segment[]): Point {
    const points = segments.flatMap((segment) => segment);
    const [x, y] = points.reduce((a, b) => [Math.min(a[0], b[0]), Math.max(a[1], b[1])]);
    return [x, y];
}

export async function dec14(input: NodeJS.ReadableStream): Promise<ProblemOutput> {
    const segments = (await readAllLines(input)).flatMap(parseLineOfSegments);
    const leftMostRock = findLeftMostPointOfSegments(segments);
    const segmentSet = new SegmentSet();
    for (const segment of segments) {
        segmentSet.add(segment);
    }
    const sandBlocks = new PointSet();
    let beforeOverflow = -1;
    let isOverflowing = false;
    while (!sandBlocks.has([500, 0])) {
        let sand: Point = [500, 0];
        while (true) {
            const firstNonRock = findFirstFree(segmentSet, sandBlocks,
                [sand[0], sand[1] + 1], [sand[0] - 1, sand[1] + 1], [sand[0] + 1, sand[1] + 1]);
            if (firstNonRock === null || sand[1] === leftMostRock[1] + 1) {
                sandBlocks.add(sand);
                break;
            }
            if (firstNonRock[0] < leftMostRock[0] || firstNonRock[1] > leftMostRock[1]) {
                if (!isOverflowing) {
                    isOverflowing = true;
                    beforeOverflow = sandBlocks.size;
                }
            }
            sand = firstNonRock;
        }
    }
    return {
        firstStar: beforeOverflow.toString(),
        secondStar: sandBlocks.size.toString(),
    };
}