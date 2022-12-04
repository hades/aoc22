import { ProblemOutput } from "./types";
import { readAllLines } from "./util";

const SHAPE_VALUES = {
    'X': 1,
    'Y': 2,
    'Z': 3,
}

// Maps the combination of their move and my move to the score.
const OUTCOME_SCORES = {
    'AX': 3,
    'BY': 3,
    'CZ': 3,
    'AZ': 0,
    'BX': 0,
    'CY': 0,
    'CX': 6,
    'AY': 6,
    'BZ': 6,
}

// For part 2:
// Maps a strategy (opponent's choice + win or lose) to the desired shape.
// E.g. 'AX' means that if the opponent chooses 'rock' (A) and we need to lose (X),
// so we choose 'paper' (Y).
const STRAT_TO_SHAPE = {
    'AX': 'Z',
    'BY': 'Y',
    'CZ': 'X',
    'AZ': 'Y',
    'BX': 'X',
    'CY': 'Z',
    'CX': 'Y',
    'AY': 'X',
    'BZ': 'Z',
}

function evaluateGame(theirMove: 'A'|'B'|'C', myMove: 'X'|'Y'|'Z'): number {
    return SHAPE_VALUES[myMove] + OUTCOME_SCORES[(theirMove + myMove) as keyof typeof OUTCOME_SCORES];
}

export async function dec02(input: NodeJS.ReadableStream): Promise<ProblemOutput> {
    const strat: string[][] = (await readAllLines(input)).map((line) => line.split(' '));
    let totalScore = 0;
    let totalScore2 = 0;
    for (const [theirMove, myMove] of strat) {
        totalScore += evaluateGame(theirMove as 'A'|'B'|'C', myMove as 'X'|'Y'|'Z');
        let choice = STRAT_TO_SHAPE[(theirMove + myMove) as keyof typeof STRAT_TO_SHAPE] as 'X'|'Y'|'Z';
        totalScore2 += evaluateGame(theirMove as 'A'|'B'|'C', choice);
    }

    return {
        firstStar: totalScore.toString(),
        secondStar: totalScore2.toString(),
    };
}
