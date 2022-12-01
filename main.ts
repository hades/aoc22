import { parseArgs } from 'util';

import {dec01} from './dec01';
import { ProblemOutput } from './types';

const { values } = parseArgs({
    options: {
        day: {
            type: 'string',
            short: 'd',
            default: '01',
        },
        partTwo: {
            type: 'boolean',
            short: '2',
            default: false,
        }
    }
});

const funcs: {[day: string]: (input: NodeJS.ReadableStream) => Promise<ProblemOutput>} = {
    '01': dec01,
}

if (values.day && funcs[values.day]) {
    console.log("Advent of Code 2022 Solutions");
    console.log(`Solving for December ${values.day}`);
    console.log('Problem input will be read from stdin');

    funcs[values.day](process.stdin).then((result) => {
        console.log(values.partTwo ? result.secondStar : result.firstStar);
    }).catch((e) => {
        console.error('failed to solve: ', e);
    });
} else {
    console.error('invalid value for --day: ', values.day);
}
