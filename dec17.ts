import { ProblemOutput } from "./types";
import { Coords, CoordsSet, readAllLines } from "./util";

const ROCK_TYPES: readonly Coords[][] = (() => {
    const line: Coords[] = [];
    line.push({x: 0, y: 0}); 
    line.push({x: 1, y: 0}); 
    line.push({x: 2, y: 0}); 
    line.push({x: 3, y: 0}); 
    const cross: Coords[] = [];
    cross.push({x: 0, y: 1}); 
    cross.push({x: 1, y: 0}); 
    cross.push({x: 1, y: 1}); 
    cross.push({x: 2, y: 1}); 
    cross.push({x: 1, y: 2}); 
    const angle: Coords[] = [];
    angle.push({x: 0, y: 0});
    angle.push({x: 1, y: 0});
    angle.push({x: 2, y: 0});
    angle.push({x: 2, y: 1});
    angle.push({x: 2, y: 2});
    const vertical: Coords[] = [];
    vertical.push({x: 0, y: 0});
    vertical.push({x: 0, y: 1});
    vertical.push({x: 0, y: 2});
    vertical.push({x: 0, y: 3});
    const cube: Coords[] = [];
    cube.push({x: 0, y: 0});
    cube.push({x: 1, y: 0});
    cube.push({x: 0, y: 1});
    cube.push({x: 1, y: 1});
    return [line, cross, angle, vertical, cube];
})();

function scanFloor(fallenRocks: CoordsSet, height: number): string {
    const floor: string[] = [];
    for (let y = height; y > height - 48; y--) {
        floor.push('\n');
        for (let x = 0; x < 7; x++) {
            floor.push(fallenRocks.has({x, y}) ? '#' : '.');
        }
    }
    return floor.join('');
}

export async function dec17(input: NodeJS.ReadableStream): Promise<ProblemOutput> {
    const typesOfRock = ROCK_TYPES.length;
    const pattern = (await readAllLines(input))[0];
    const patternWidth = pattern.length;
    const fallenRocks = new CoordsSet();
    let rockType = 0;
    let jet = 0;
    let height = 0;
    let heightAt2022 = 0;
    let heightBump = 0;
    let oldStates: {
        [stateKey: string]: {height: number, rockCount: number};
    }|undefined = {};
    const endTime = 1_000_000_000_000;
    for (let rockCount = 0; rockCount < endTime; rockCount++) {
        const stateKey = `${rockType},${jet},${scanFloor(fallenRocks, height)}`;
        if (oldStates !== undefined) {
            if (oldStates[stateKey]) {
                const period = rockCount - oldStates[stateKey].rockCount;
                const heightDiff = height - oldStates[stateKey].height;
                const fullPeriods = Math.floor((endTime - rockCount) / period);
                rockCount += fullPeriods * period;
                heightBump = fullPeriods * heightDiff;
                oldStates = undefined;
            } else {
                oldStates[stateKey] = {height, rockCount};
            }
        }
        let rock: Coords[] = ROCK_TYPES[rockType].map((coords) => {
            return {x: coords.x + 2, y: coords.y + height + 3};
        });
        let rockXStart = Math.min(...rock.map((coords) => coords.x));
        let rockXEnd = Math.max(...rock.map((coords) => coords.x)) + 1;
        let rockYStart = height + 3;
        let rockYEnd = Math.max(...rock.map((coords) => coords.y)) + 1;
        rockType = (rockType + 1) % typesOfRock;
        while (true) {
            if (pattern[jet] === '<' && rockXStart > 0) {
                const newRock = rock.map((coords) => {
                    return {x: coords.x - 1, y: coords.y};
                });
                if (fallenRocks.intersection(newRock).length === 0) {
                    rockXStart -= 1;
                    rockXEnd -= 1;
                    rock = newRock;
                }
            } else if (pattern[jet] === '>' && rockXEnd < 7) {
                const newRock = rock.map((coords) => {
                    return {x: coords.x + 1, y: coords.y};
                });
                if (fallenRocks.intersection(newRock).length === 0) {
                    rockXStart += 1;
                    rockXEnd += 1;
                    rock = newRock;
                }
            }
            jet = (jet + 1) % patternWidth;
            const nextRock = rock.map((coords) => {
                return {x: coords.x, y: coords.y - 1};
            });
            if (rockYStart === 0 || fallenRocks.intersection(nextRock).length > 0) {
                fallenRocks.addAll(rock);
                break;
            }
            rock = nextRock;
            rockYStart -= 1;
            rockYEnd -= 1;
        }
        height = Math.max(rockYEnd, height);
        if (rockCount === 2021) {
            heightAt2022 = height;
        }
    }
    return {
        firstStar: heightAt2022.toString(),
        secondStar: (height + heightBump).toString(),
    }
}