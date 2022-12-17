import path from 'node:path/posix';
import { ProblemOutput } from './types';
import { feedLinesToGenerator } from './util';

function maybeAddFile(fileSizes: { [name: string]: number }, cur: string, entryLine: string) {
    const match = /^(\d+) (.*)$/.exec(entryLine);
    if (!match) {
        return;
    }
    const fileName = match[2];
    const fileSize = parseInt(match[1]);
    const fullPath = path.resolve(cur, fileName);
    fileSizes[fullPath] = fileSize;
}

function* solve(): Generator<undefined, ProblemOutput, string | null> {
    let cur = '/';
    let fileSizes: { [name: string]: number } = {};
    let line = yield;
    while (line) {
        if (/^\$ cd/.test(line)) {
            const dir = line.split(/ +/)[2];
            cur = path.resolve(cur, dir);
            line = yield;
        } else if (/^\$ ls/.test(line)) {
            for (line = yield; line && /^[^$]/.test(line); line = yield) {
                maybeAddFile(fileSizes, cur, line);
            }
        }
    }
    let dirSizes: { [name: string]: number } = {};
    for (const [name, size] of Object.entries(fileSizes)) {
        const dir = path.dirname(name);
        const dirs = dir == '/' ? [''] : dir.split(path.sep);
        for (let i = 0; i < dirs.length; ++i) {
            const dir = path.join('/', ...dirs.slice(0, i + 1));
            dirSizes[dir] = (dirSizes[dir] || 0) + size;
        }
    }
    let totalSizeOfSmallDirectories = 0;
    for (const [_, size] of Object.entries(dirSizes)) {
        if (size <= 100_000) {
            totalSizeOfSmallDirectories += size;
        }
    }
    let spaceToFree = 30_000_000 - (70_000_000 - dirSizes['/']);
    let dirSizesSorted = Object.entries(dirSizes).sort((a, b) => -b[1] + a[1]);
    let dirToDelete = null;
    for (const [dir, size] of dirSizesSorted) {
        if (size >= spaceToFree) {
            dirToDelete = dir;
            break;
        }
    }
    return {
        firstStar: totalSizeOfSmallDirectories.toString(),
        secondStar: dirSizes[dirToDelete!].toString(),
    };
}

export async function dec07(input: NodeJS.ReadableStream): Promise<ProblemOutput> {
    const solver = solve();
    return await feedLinesToGenerator(solver, input);
}