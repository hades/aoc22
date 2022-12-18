import { ProblemOutput } from "./types";
import { Matrix, parseMatrix } from "./util";

function isVisible(matrix: Matrix, row: number, col: number): boolean {
    let left = true;
    let right = true;
    let up = true;
    let down = true;
    for (let i = 0; i < matrix.height; ++i) {
        if (i == row) {
            continue;
        }
        if (matrix.get([i, col])! >= matrix.get([row, col])!) {
            (i < row) ? up = false : down = false;
        }
    }
    for (let j = 0; j < matrix.width; ++j) {
        if (j == col) {
            continue;
        }
        if (matrix.get([row, j])! >= matrix.get([row, col])!) {
            (j < col) ? left = false : right = false;
        }
    }
    return left || right || up || down;
}

function viewDistance(matrix: Matrix, row: number, col: number): {
    left: number, right: number, up: number, down: number} {
    const compute = (drow: number, dcol: number) => {
        let distance = 0;
        let r = row + drow;
        let c = col + dcol;
        while (r >= 0 && r < matrix.height && c >= 0 && c < matrix.width) {
            distance++;
            if (matrix.get([r, c])! >= matrix.get([row, col])!) {
                break;
            }
            r += drow;
            c += dcol;
        }
        return distance;
    }

    return {
        left: compute(0, -1),
        right: compute(0, 1),
        up: compute(-1, 0),
        down: compute(1, 0),
    };
}

export async function dec08(input: NodeJS.ReadableStream): Promise<ProblemOutput> {
    const matrix = await parseMatrix(input, (char) => parseInt(char));
    let treesVisible = 2*matrix.height + 2*matrix.width - 4;
    let maxScenicScore = 0;
    for (let row = 1; row < matrix.height-1; ++row) {
        for (let col = 1; col < matrix.width-1; ++col) {
            if (isVisible(matrix, row, col)) {
                treesVisible++; 
            }
            const viewDistances = viewDistance(matrix, row, col);
            const scenicScore = (viewDistances.left * viewDistances.right *
                viewDistances.up * viewDistances.down);
            if (scenicScore > maxScenicScore) {
                maxScenicScore = scenicScore;
            }
        }
    }
    return {
        firstStar: treesVisible.toString(),
        secondStar: maxScenicScore.toString(),
    }
}