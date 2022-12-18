import { parseArgs } from 'util';

import { dec01 } from './dec01';
import { dec02 } from './dec02';
import { dec03 } from './dec03';
import { dec04 } from './dec04';
import { dec05 } from './dec05';
import { dec06 } from './dec06';
import { dec07 } from './dec07';
import { dec08 } from './dec08';
import { dec09 } from './dec09';
import { dec10 } from './dec10';
import { dec11 } from './dec11';
import { dec12 } from './dec12';
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
    '02': dec02,
    '03': dec03,
    '04': dec04,
    '05': dec05,
    '06': dec06,
    '07': dec07,
    '08': dec08,
    '09': dec09,
    '10': dec10,
    '11': dec11,
    '12': dec12,
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
